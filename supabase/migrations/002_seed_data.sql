-- =====================================================================
-- Meridian — Seed Data
-- Demo organization with services, staff, and availability
-- =====================================================================

-- Demo organization
insert into organizations (id, slug, name, timezone, currency, locale, brand) values
  ('11111111-1111-1111-1111-111111111101', 'demo', 'Meridian Demo', 'Asia/Beirut', 'USD', 'en',
   '{"accent": "#0E7C7B", "font": "Bricolage Grotesque"}');

-- Demo staff
insert into staff (id, org_id, slug, display_name, title, bio, email, phone, timezone, color, is_bookable, is_active) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'elie-khachane', 'Elie Khachane', 'Senior Consultant', 'Expert in scheduling systems and call reservations', 'elie@meridian-demo.com', '+961 76 784 433', 'Asia/Beirut', '#0E7C7B', true, true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'sara-mansour', 'Sara Mansour', 'Support Specialist', 'Customer support and appointment scheduling', 'sara@meridian-demo.com', '+961 76 784 434', 'Asia/Beirut', '#C08A2E', true, true),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'omar-haddad', 'Omar Haddad', 'Technical Lead', 'Technical consultations and system demos', 'omar@meridian-demo.com', '+961 76 784 435', 'Asia/Beirut', '#1E7A4B', true, true);

-- Service categories
insert into service_categories (id, org_id, name, description, sort_order) values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', 'Consultations', 'One-on-one consultation calls', 1),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111101', 'Support', 'Technical support and troubleshooting', 2),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111101', 'Demos', 'Product demonstrations and walkthroughs', 3);

-- Services
insert into services (id, org_id, category_id, slug, name, description, duration_minutes, slot_interval_minutes, price_cents, currency, meeting_methods, default_method, location, phone_number, custom_meeting_url, meeting_instructions, buffer_before_minutes, buffer_after_minutes, minimum_notice_minutes, maximum_advance_days, max_bookings_per_day, requires_confirmation, allow_reschedule, allow_cancellation, cancellation_notice_hours, capacity, form_id, reminder_offsets_minutes, color, sort_order, is_published, is_active) values
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301', 'strategy-call', 'Strategy Call', 'A 30-minute consultation to discuss your scheduling needs', 30, 15, 0, 'USD', '{video,audio,phone}', 'video', null, null, 'https://meet.google.com/abc-defg-hij', 'Please have your calendar ready', 5, 5, 60, 30, 10, false, true, true, 24, 1, null, '{1440,120}', '#0E7C7B', 1, true, true),
  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301', 'deep-dive', 'Deep Dive Session', 'A 60-minute deep dive into your scheduling workflow', 60, 30, 5000, 'USD', '{video,audio}', 'video', null, null, 'https://meet.google.com/klm-nopq-rst', 'We will review your current setup', 10, 10, 120, 60, 5, false, true, true, 24, 1, null, '{1440,120}', '#C08A2E', 2, true, true),
  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333302', 'tech-support', 'Technical Support', 'Get help with technical issues and troubleshooting', 45, 15, 0, 'USD', '{phone,video,audio}', 'phone', null, '+961 76 784 433', null, 'Please describe your issue in advance', 5, 5, 30, 30, 15, false, true, true, 12, 1, null, '{1440}', '#1E7A4B', 3, true, true),
  ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333303', 'product-demo', 'Product Demo', 'A 45-minute walkthrough of the Meridian platform', 45, 15, 0, 'USD', '{video}', 'video', null, null, 'https://meet.google.com/uvw-xyza-bcd', 'No preparation needed', 5, 5, 60, 45, 8, false, true, true, 24, 1, null, '{1440,120}', '#6B7F88', 4, true, true);

-- Service staff assignments
insert into service_staff (service_id, staff_id) values
  ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201'),
  ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222202'),
  ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222201'),
  ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222202'),
  ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222203'),
  ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222201'),
  ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222203');

-- Schedules (working hours)
insert into schedules (id, org_id, staff_id, name, timezone, is_default) values
  ('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'Elie - Standard', 'Asia/Beirut', true),
  ('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202', 'Sara - Standard', 'Asia/Beirut', true),
  ('55555555-5555-5555-5555-555555555503', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222203', 'Omar - Standard', 'Asia/Beirut', true);

-- Availability rules (Mon-Fri 9:00-17:00, Sat 10:00-14:00)
insert into availability_rules (schedule_id, weekday, start_time, end_time) values
  ('55555555-5555-5555-5555-555555555501', 1, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555501', 2, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555501', 3, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555501', 4, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555501', 5, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555501', 6, '10:00', '14:00'),
  ('55555555-5555-5555-5555-555555555502', 1, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555502', 2, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555502', 3, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555502', 4, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555502', 5, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555502', 6, '10:00', '14:00'),
  ('55555555-5555-5555-5555-555555555503', 1, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555503', 2, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555503', 3, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555503', 4, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555503', 5, '09:00', '17:00'),
  ('55555555-5555-5555-5555-555555555503', 6, '10:00', '14:00');

-- Default booking form
insert into booking_forms (id, org_id, name, is_default) values
  ('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111101', 'Default Booking Form', true);

insert into booking_form_fields (form_id, key, label, help_text, type, options, placeholder, is_required, is_hidden, is_system, validation, sort_order) values
  ('66666666-6666-6666-6666-666666666601', 'name', 'Full Name', null, 'text', null, 'John Doe', true, false, true, null, 1),
  ('66666666-6666-6666-6666-666666666601', 'email', 'Email Address', null, 'email', null, 'john@example.com', true, false, true, null, 2),
  ('66666666-6666-6666-6666-666666666601', 'phone', 'Phone Number', null, 'phone', null, '+1 555 000 0000', false, false, true, null, 3),
  ('66666666-6666-6666-6666-666666666601', 'company', 'Company', null, 'text', null, 'Acme Inc.', false, false, false, null, 4),
  ('66666666-6666-6666-6666-666666666601', 'notes', 'Anything we should know?', 'Please share any relevant details', 'textarea', null, 'Tell us about your needs...', false, false, false, null, 5);

-- Update services to use the form
update services set form_id = '66666666-6666-6666-6666-666666666601' where org_id = '11111111-1111-1111-1111-111111111101';

-- Settings
insert into settings (org_id, booking, branding, notifications, security) values
  ('11111111-1111-1111-1111-111111111101',
   '{"allow_guest_booking": true, "require_confirmation": false}',
   '{"accent": "#0E7C7B", "font": "Bricolage Grotesque"}',
   '{"email_enabled": true, "sms_enabled": false, "whatsapp_enabled": false}',
   '{"two_factor_required": false, "session_timeout_minutes": 60}');
