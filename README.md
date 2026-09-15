# Meridian — Scheduling & Call Reservation Platform

A modern, timezone-safe scheduling and call reservation platform built with Next.js 16, Supabase, and Tailwind CSS v4.

## Features

- **Public booking funnel** — Service → Staff → Calendar → Slots → Details → Confirm
- **Timezone-safe** — All times stored in UTC, displayed in the customer's local timezone
- **No double bookings** — Database-level exclusion constraints guarantee no overlaps
- **Tokenised links** — Customers reschedule/cancel via secure email links, no account needed
- **Call-first booking** — Phone, video, audio, in-person meeting methods per service
- **Smart availability** — Working hours, breaks, buffers, minimum notice, daily limits
- **Admin dashboard** — Bookings, services, customers, analytics
- **Auth** — Supabase Auth with email/password and OAuth support
- **Design system** — Chronometer-inspired teal + brass palette, Bricolage Grotesque + IBM Plex

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS v4 + CSS custom properties
- **Database:** Supabase Postgres with RLS
- **Auth:** Supabase Auth (@supabase/ssr)
- **Dates:** Luxon with IANA timezone support
- **Validation:** Zod
- **Email:** Resend + React Email
- **Icons:** Lucide React

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase service role key (server-only)

### 3. Run database migrations

Apply the schema and seed data to your Supabase project:

```bash
# Using the Supabase Management API
npm run migrate
```

Or run the SQL files manually in the Supabase dashboard:
1. `supabase/migrations/001_create_schema.sql`
2. `supabase/migrations/002_seed_data.sql`

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Try the demo

Visit `/book/demo` to see the live booking flow with seeded data.

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, register, forgot-password
│   ├── book/[orgSlug]/   # Public booking funnel
│   ├── b/[token]/        # Booking management (reschedule/cancel)
│   ├── dashboard/        # Authenticated dashboard
│   ├── services/         # Service management
│   ├── api/              # API routes
│   ├── layout.tsx        # Root layout
│   ├── globals.css       # Design tokens + Tailwind
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Reusable UI components
│   └── hero-booker.tsx   # Live booking widget
├── lib/
│   ├── scheduling/       # Availability engine
│   ├── supabase/         # Three-client setup
│   ├── actions/          # Server actions
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Helpers
├── supabase/
│   └── migrations/       # SQL migrations
└── middleware.ts         # Route protection
```

## Design System

- **Colours:** Chronometer teal (`#0E7C7B`) + brass (`#C08A2E`)
- **Type:** Bricolage Grotesque (display) + IBM Plex Sans (body) + IBM Plex Mono (times)
- **Shape:** Differentiated radii — slot 4px, field 8px, card 14px, sheet 20px
- **Motion:** 120ms state, 200ms enter, 320ms sheet

## Database Schema

The full schema includes:
- `organizations` — Multi-tenant orgs with branding
- `profiles` — User profiles (mirrors auth.users)
- `staff` — Bookable staff members
- `services` — Bookable services with duration, price, meeting methods
- `schedules` + `availability_rules` — Weekly working hours
- `availability_overrides` — Date-specific overrides
- `blocked_times` — Vacation, breaks, personal time
- `customers` — Customer records with booking history
- `bookings` — Bookings with exclusion constraint for no-overlap
- `booking_forms` + `booking_form_fields` — Custom booking forms
- `notifications` + `scheduled_reminders` — Notification system
- `audit_logs` — Audit trail

## Security

- RLS on every table
- Service-role key used only server-side
- Tokenised access links (32-byte random, SHA-256 hashed)
- Input validation with Zod
- Rate limiting ready (Upstash Redis)
- Security headers and CSP

## License

MIT
