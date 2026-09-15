export type BookingStatus =
  | "pending"
  | "confirmed"
  | "payment_pending"
  | "paid"
  | "cancelled"
  | "completed"
  | "no_show";

export type MeetingMethod =
  | "phone"
  | "video"
  | "audio"
  | "online_meeting"
  | "in_person"
  | "custom";

export type NotificationChannel = "email" | "sms" | "whatsapp" | "push";

export type NotificationStatus = "pending" | "sent" | "failed" | "cancelled";

export type NotificationEvent =
  | "booking_created"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "booking_reminder"
  | "booking_completed"
  | "staff_notification"
  | "follow_up";

export type FormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "number"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "date"
  | "file";

export type BlockedReason = "vacation" | "break" | "personal" | "maintenance" | "other";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  currency: string;
  locale: string;
  logo_url: string | null;
  brand: Record<string, unknown>;
  feature_flags: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  timezone: string;
  locale: string;
  is_superadmin: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  org_id: string;
  user_id: string | null;
  slug: string;
  display_name: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  timezone: string;
  color: string | null;
  is_bookable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Service {
  id: string;
  org_id: string;
  category_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  slot_interval_minutes: number;
  price_cents: number;
  currency: string;
  meeting_methods: MeetingMethod[];
  default_method: MeetingMethod;
  location: string | null;
  phone_number: string | null;
  custom_meeting_url: string | null;
  meeting_instructions: string | null;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  minimum_notice_minutes: number;
  maximum_advance_days: number;
  max_bookings_per_day: number | null;
  requires_confirmation: boolean;
  allow_reschedule: boolean;
  allow_cancellation: boolean;
  cancellation_notice_hours: number;
  capacity: number;
  form_id: string | null;
  reminder_offsets_minutes: number[];
  color: string | null;
  sort_order: number;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category_name?: string;
}

export interface Customer {
  id: string;
  org_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  timezone: string | null;
  notes: string | null;
  tags: string[];
  total_bookings: number;
  total_cancellations: number;
  last_booking_at: string | null;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  org_id: string;
  service_id: string;
  staff_id: string;
  customer_id: string;
  reference: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  customer_timezone: string;
  staff_timezone: string;
  status: BookingStatus;
  meeting_method: MeetingMethod;
  meeting_url: string | null;
  meeting_phone: string | null;
  meeting_location: string | null;
  meeting_provider: string | null;
  meeting_ref: string | null;
  meeting_instructions: string | null;
  price_cents: number;
  currency: string;
  access_token_hash: string;
  title: string | null;
  internal_notes: string | null;
  customer_note: string | null;
  source: string;
  rescheduled_from: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  completed_at: string | null;
  external_event_ids: Record<string, string>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined fields
  service_name?: string;
  staff_name?: string;
  customer_name?: string;
  customer_email?: string;
}

export interface BookingForm {
  id: string;
  org_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingFormField {
  id: string;
  form_id: string;
  key: string;
  label: string;
  help_text: string | null;
  type: FormFieldType;
  options: { value: string; label: string }[] | null;
  placeholder: string | null;
  is_required: boolean;
  is_hidden: boolean;
  is_system: boolean;
  validation: Record<string, unknown> | null;
  sort_order: number;
  created_at: string;
}

export interface AvailabilityRule {
  id: string;
  schedule_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  org_id: string;
  staff_id: string | null;
  name: string;
  timezone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  rules?: AvailabilityRule[];
  availability_rules?: AvailabilityRule[];
}

export interface Slot {
  start: Date;
  end: Date;
}

export interface SlotQuery {
  from: Date;
  to: Date;
  scheduleTimezone: string;
  rules: { weekday: number; startTime: string; endTime: string }[];
  overrides?: { date: string; isClosed: boolean; startTime?: string; endTime?: string }[];
  busy: { start: Date; end: Date }[];
  service: {
    durationMinutes: number;
    slotIntervalMinutes: number;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    minimumNoticeMinutes: number;
    maximumAdvanceDays: number;
    maxBookingsPerDay?: number | null;
  };
  bookingsPerDay?: Record<string, number>;
  now?: Date;
}
