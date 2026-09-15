-- =====================================================================
-- Meridian — Scheduling & Call Reservation Platform
-- Supabase / PostgreSQL schema, constraints, indexes, RLS
-- Run as a single migration. Requires Postgres 15+.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";
create extension if not exists "citext";

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

create type booking_status as enum (
  'pending', 'confirmed', 'payment_pending', 'paid',
  'cancelled', 'completed', 'no_show'
);

create type meeting_method as enum (
  'phone', 'video', 'audio', 'online_meeting', 'in_person', 'custom'
);

create type notification_channel as enum ('email', 'sms', 'whatsapp', 'push');

create type notification_status as enum ('pending', 'sent', 'failed', 'cancelled');

create type notification_event as enum (
  'booking_created', 'booking_cancelled', 'booking_rescheduled',
  'booking_reminder', 'booking_completed', 'staff_notification', 'follow_up'
);

create type form_field_type as enum (
  'text', 'textarea', 'email', 'phone', 'number', 'select',
  'multiselect', 'checkbox', 'radio', 'date', 'file'
);

create type integration_kind as enum ('calendar', 'meeting', 'payment', 'crm');

create type blocked_reason as enum ('vacation', 'break', 'personal', 'maintenance', 'other');

-- =====================================================================
-- 2. TENANCY
-- =====================================================================

create table organizations (
  id            uuid primary key default gen_random_uuid(),
  slug          citext not null unique
                  check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),
  name          text not null check (length(name) between 2 and 120),
  timezone      text not null default 'UTC',
  currency      char(3) not null default 'USD',
  locale        text not null default 'en',
  logo_url      text,
  brand         jsonb not null default '{}'::jsonb,
  feature_flags jsonb not null default '{}'::jsonb,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table profiles (
  id            uuid primary key,
  full_name     text,
  email         citext not null,
  phone         text,
  avatar_url    text,
  timezone      text not null default 'UTC',
  locale        text not null default 'en',
  is_superadmin boolean not null default false,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table roles (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references organizations(id) on delete cascade,
  key          text not null,
  name         text not null,
  permissions  jsonb not null default '{}'::jsonb,
  is_system    boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (org_id, key)
);

create table organization_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  role_id     uuid not null references roles(id),
  department  text,
  is_active   boolean not null default true,
  invited_at  timestamptz,
  joined_at   timestamptz default now(),
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

-- =====================================================================
-- 3. STAFF, SERVICES
-- =====================================================================

create table staff (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  slug          citext not null,
  display_name  text not null,
  title         text,
  bio           text,
  avatar_url    text,
  email         citext,
  phone         text,
  timezone      text not null default 'UTC',
  color         text,
  is_bookable   boolean not null default true,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (org_id, slug)
);

create table service_categories (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  name        text not null,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique (org_id, name)
);

create table services (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references organizations(id) on delete cascade,
  category_id           uuid references service_categories(id) on delete set null,
  slug                  citext not null,
  name                  text not null,
  description           text,
  duration_minutes      int not null check (duration_minutes between 5 and 1440),
  slot_interval_minutes int not null default 15 check (slot_interval_minutes between 5 and 120),
  price_cents           int not null default 0 check (price_cents >= 0),
  currency              char(3) not null default 'USD',
  meeting_methods       meeting_method[] not null default '{video}',
  default_method        meeting_method not null default 'video',
  location              text,
  phone_number          text,
  custom_meeting_url    text,
  meeting_instructions  text,
  buffer_before_minutes int not null default 0 check (buffer_before_minutes between 0 and 240),
  buffer_after_minutes  int not null default 0 check (buffer_after_minutes between 0 and 240),
  minimum_notice_minutes int not null default 60 check (minimum_notice_minutes >= 0),
  maximum_advance_days  int not null default 60 check (maximum_advance_days between 1 and 730),
  max_bookings_per_day  int check (max_bookings_per_day > 0),
  requires_confirmation boolean not null default false,
  allow_reschedule      boolean not null default true,
  allow_cancellation    boolean not null default true,
  cancellation_notice_hours int not null default 24,
  capacity              int not null default 1 check (capacity >= 1),
  form_id               uuid,
  reminder_offsets_minutes int[] not null default '{1440,120}',
  color                 text,
  sort_order            int not null default 0,
  is_published          boolean not null default false,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz,
  unique (org_id, slug),
  check (default_method = any(meeting_methods))
);

create table service_staff (
  service_id uuid not null references services(id) on delete cascade,
  staff_id   uuid not null references staff(id) on delete cascade,
  primary key (service_id, staff_id)
);

-- =====================================================================
-- 4. AVAILABILITY
-- =====================================================================

create table schedules (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  staff_id   uuid references staff(id) on delete cascade,
  name       text not null default 'Working hours',
  timezone   text not null default 'UTC',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table availability_rules (
  id          uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules(id) on delete cascade,
  weekday     int not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  created_at  timestamptz not null default now(),
  check (end_time > start_time)
);

create table availability_overrides (
  id          uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules(id) on delete cascade,
  date        date not null,
  start_time  time,
  end_time    time,
  is_closed   boolean not null default false,
  created_at  timestamptz not null default now(),
  check (is_closed or (start_time is not null and end_time is not null and end_time > start_time))
);

create table blocked_times (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  staff_id   uuid references staff(id) on delete cascade,
  reason     blocked_reason not null default 'other',
  note       text,
  period     tstzrange not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  check (not isempty(period))
);

create table holidays (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  name       text not null,
  date       date not null,
  is_recurring_yearly boolean not null default false,
  applies_to_staff uuid[],
  created_at timestamptz not null default now(),
  unique (org_id, name, date)
);

create table slot_holds (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  staff_id   uuid not null references staff(id) on delete cascade,
  period     tstzrange not null,
  session_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 5. CUSTOMERS
-- =====================================================================

create table customers (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  full_name    text not null,
  email        citext not null,
  phone        text,
  company      text,
  timezone     text,
  notes        text,
  tags         text[] not null default '{}',
  total_bookings     int not null default 0,
  total_cancellations int not null default 0,
  last_booking_at    timestamptz,
  is_blocked   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (org_id, email)
);

-- =====================================================================
-- 6. BOOKING FORMS
-- =====================================================================

create table booking_forms (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  name       text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table booking_form_fields (
  id          uuid primary key default gen_random_uuid(),
  form_id     uuid not null references booking_forms(id) on delete cascade,
  key         text not null,
  label       text not null,
  help_text   text,
  type        form_field_type not null default 'text',
  options     jsonb,
  placeholder text,
  is_required boolean not null default false,
  is_hidden   boolean not null default false,
  is_system   boolean not null default false,
  validation  jsonb,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique (form_id, key)
);

alter table services
  add constraint services_form_fk
  foreign key (form_id) references booking_forms(id) on delete set null;

-- =====================================================================
-- 7. BOOKINGS
-- =====================================================================

create table bookings (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  service_id        uuid not null references services(id) on delete restrict,
  staff_id          uuid not null references staff(id) on delete restrict,
  customer_id       uuid not null references customers(id) on delete restrict,
  reference         text not null unique default upper(substr(encode(gen_random_bytes(6),'hex'),1,10)),
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  period            tstzrange not null,
  duration_minutes  int not null,
  customer_timezone text not null default 'UTC',
  staff_timezone    text not null default 'UTC',
  status            booking_status not null default 'pending',
  meeting_method    meeting_method not null,
  meeting_url       text,
  meeting_phone     text,
  meeting_location  text,
  meeting_provider  text,
  meeting_ref       text,
  meeting_instructions text,
  price_cents       int not null default 0,
  currency          char(3) not null default 'USD',
  access_token_hash text not null,
  title             text,
  internal_notes    text,
  customer_note     text,
  source            text not null default 'public',
  rescheduled_from  uuid references bookings(id) on delete set null,
  cancelled_at      timestamptz,
  cancelled_by      text,
  cancellation_reason text,
  completed_at      timestamptz,
  external_event_ids jsonb not null default '{}'::jsonb,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  check (ends_at > starts_at),
  check (period @> tstzrange(starts_at, ends_at, '[)'))
);

alter table bookings
  add constraint bookings_no_overlap
  exclude using gist (
    staff_id with =,
    period with &&
  ) where (status not in ('cancelled','no_show') and deleted_at is null);

create table booking_answers (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  field_id   uuid references booking_form_fields(id) on delete set null,
  field_key  text not null,
  label      text not null,
  value      text,
  file_path  text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 8. NOTIFICATIONS
-- =====================================================================

create table notification_templates (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references organizations(id) on delete cascade,
  event      notification_event not null,
  channel    notification_channel not null default 'email',
  locale     text not null default 'en',
  subject    text,
  body       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, event, channel, locale)
);

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  booking_id  uuid references bookings(id) on delete cascade,
  event       notification_event not null,
  channel     notification_channel not null,
  recipient   text not null,
  subject     text,
  body        text,
  status      notification_status not null default 'pending',
  provider_id text,
  error       text,
  attempts    int not null default 0,
  send_after  timestamptz not null default now(),
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table scheduled_reminders (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  offset_minutes int not null,
  send_at     timestamptz not null,
  status      notification_status not null default 'pending',
  sent_at     timestamptz,
  created_at  timestamptz not null default now(),
  unique (booking_id, offset_minutes)
);

-- =====================================================================
-- 9. INTEGRATIONS, PAYMENTS
-- =====================================================================

create table integrations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  kind       integration_kind not null,
  provider   text not null,
  is_enabled boolean not null default true,
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (org_id, kind, provider)
);

create table payments (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  booking_id   uuid references bookings(id) on delete set null,
  provider     text not null default 'stripe',
  provider_ref text,
  amount_cents int not null,
  currency     char(3) not null default 'USD',
  status       text not null default 'pending',
  is_deposit   boolean not null default false,
  coupon_id    uuid,
  raw          jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table coupons (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organizations(id) on delete cascade,
  code           citext not null,
  percent_off    int check (percent_off between 1 and 100),
  amount_off_cents int check (amount_off_cents > 0),
  max_redemptions int,
  redeemed_count int not null default 0,
  valid_from     timestamptz,
  valid_until    timestamptz,
  service_ids    uuid[],
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (org_id, code),
  check (percent_off is not null or amount_off_cents is not null)
);

-- =====================================================================
-- 10. SETTINGS, AUDIT
-- =====================================================================

create table settings (
  org_id     uuid primary key references organizations(id) on delete cascade,
  booking    jsonb not null default '{}'::jsonb,
  branding   jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  security   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id          bigserial primary key,
  org_id      uuid references organizations(id) on delete cascade,
  actor_id    uuid references profiles(id) on delete set null,
  actor_label text,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- 11. HELPER FUNCTIONS
-- =====================================================================

create or replace function auth_org_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(om.org_id), '{}')
  from organization_members om
  where om.user_id = auth.uid() and om.is_active;
$$;

create or replace function is_org_member(p_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_org = any(auth_org_ids());
$$;

create or replace function is_superadmin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_superadmin from profiles where id = auth.uid()), false);
$$;

create or replace function has_permission(p_org uuid, p_resource text, p_action text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from organization_members om
    join roles r on r.id = om.role_id
    where om.user_id = auth.uid()
      and om.org_id = p_org
      and om.is_active
      and (
        r.key = 'super_admin'
        or r.permissions -> p_resource ? p_action
        or r.permissions -> p_resource ? '*'
      )
  );
$$;

-- =====================================================================
-- 12. TRIGGERS
-- =====================================================================

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'organizations','profiles','staff','services','schedules','customers',
    'bookings','booking_forms','notification_templates','payments','settings'
  ] loop
    execute format(
      'create trigger trg_%1$s_touch before update on %1$s
       for each row execute function touch_updated_at()', t);
  end loop;
end $$;

create or replace function bookings_set_period()
returns trigger language plpgsql as $$
declare b_before int; b_after int;
begin
  select buffer_before_minutes, buffer_after_minutes
    into b_before, b_after
  from services where id = new.service_id;

  new.period := tstzrange(
    new.starts_at - make_interval(mins => coalesce(b_before,0)),
    new.ends_at   + make_interval(mins => coalesce(b_after,0)),
    '[)'
  );
  new.duration_minutes := ceil(extract(epoch from (new.ends_at - new.starts_at)) / 60);
  return new;
end $$;

create trigger trg_bookings_period
  before insert or update of starts_at, ends_at, service_id on bookings
  for each row execute function bookings_set_period();

create or replace function bookings_sync_customer()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update customers
       set total_bookings = total_bookings + 1,
           last_booking_at = greatest(coalesce(last_booking_at, new.starts_at), new.starts_at)
     where id = new.customer_id;
  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    update customers
       set total_cancellations = total_cancellations + 1
     where id = new.customer_id;
  end if;
  return new;
end $$;

create trigger trg_bookings_customer
  after insert or update of status on bookings
  for each row execute function bookings_sync_customer();

create or replace function write_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_logs (org_id, actor_id, action, entity, entity_id, before, after)
  values (
    coalesce(new.org_id, old.org_id),
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create trigger trg_audit_bookings after insert or update or delete on bookings
  for each row execute function write_audit();
create trigger trg_audit_services after insert or update or delete on services
  for each row execute function write_audit();
create trigger trg_audit_members after insert or update or delete on organization_members
  for each row execute function write_audit();

-- =====================================================================
-- 13. ROW LEVEL SECURITY
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'organizations','profiles','roles','organization_members','staff',
    'service_categories','services','service_staff','schedules','availability_rules',
    'availability_overrides','blocked_times','holidays','slot_holds','customers',
    'booking_forms','booking_form_fields','bookings','booking_answers',
    'notification_templates','notifications','scheduled_reminders','integrations',
    'payments','coupons','settings','audit_logs'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

-- =====================================================================
-- 14. SEED — system roles
-- =====================================================================

insert into roles (org_id, key, name, is_system, permissions) values
  (null,'super_admin','Super Admin',true,'{"*":["*"]}'),
  (null,'admin','Admin',true,
   '{"organization":["read","write"],"members":["read","write"],"roles":["read","write"],
     "services":["read","write"],"availability":["read","write"],"bookings":["read","write"],
     "customers":["read","write"],"forms":["read","write"],"integrations":["read","write"],
     "notifications":["read","write"],"payments":["read","write"],"audit":["read"],
     "settings":["read","write"],"coupons":["read","write"],"staff":["read","write"],
     "service_categories":["read","write"],"holidays":["read","write"],
     "blocked_times":["read","write"],"schedules":["read","write"],
     "calendar_connections":["read","write"],"booking_forms":["read","write"],
     "notification_templates":["read","write"],"waiting_list":["read","write"]}'),
  (null,'manager','Manager',true,
   '{"services":["read","write"],"availability":["read","write"],"bookings":["read","write"],
     "customers":["read","write"],"staff":["read"],"schedules":["read","write"],
     "holidays":["read","write"],"blocked_times":["read","write"],"notifications":["read"]}'),
  (null,'staff','Staff',true,
   '{"bookings":["read"],"availability":["read","write"],"customers":["read"],
     "services":["read"],"schedules":["read","write"],"blocked_times":["read","write"]}'),
  (null,'receptionist','Receptionist',true,
   '{"bookings":["read","write"],"customers":["read","write"],"services":["read"],
     "staff":["read"],"availability":["read"]}'),
  (null,'viewer','Viewer',true,
   '{"bookings":["read"],"services":["read"],"customers":["read"]}');
