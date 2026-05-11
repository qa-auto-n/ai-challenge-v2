# Task 2 — Development Report

## Submission Summary

- Deployed application: [https://community-pass-hub.lovable.app](https://community-pass-hub.lovable.app/)
- Public repository: [https://github.com/qa-auto-n/ai-challenge-v2](https://github.com/qa-auto-n/ai-challenge-v2)
- Task folder: `task-2/`
- Example CSV export: [`task-2/community-pass-hub/examples/rsvps-export-example.csv`](community-pass-hub/examples/rsvps-export-example.csv)

## Tools and Techniques Used

### Platform

- **Lovable** — AI-assisted full-stack web application builder. Used to scaffold the project, generate the initial database schema, produce React components, and deploy the application to Cloudflare Pages with a connected Supabase backend.

### Frontend Stack

| Tool | Purpose |
|------|---------|
| React 19 | UI component library |
| TanStack Router | File-based routing with type-safe params and search validation |
| TanStack Query | Server state management, polling, cache invalidation |
| Tailwind CSS v4 | Utility-first styling |
| Radix UI / shadcn-ui | Accessible headless component primitives |
| `qrcode.react` | QR code generation for tickets |
| `sonner` | Toast notifications |
| `date-fns` | Date manipulation for CSV formatting |
| `zod` v3 | Search-param validation compatible with TanStack's zod adapter |

### Backend / Infrastructure

| Tool | Purpose |
|------|---------|
| Supabase | Postgres database, Row Level Security, Auth, Storage |
| Cloudflare Pages | Static/SSR deployment via `@cloudflare/vite-plugin` |
| TanStack Start | SSR/SSG framework wrapper for TanStack Router |

### Database Design Techniques

- **Row Level Security (RLS)** on every table — enforces access control at the database level rather than relying solely on application-layer checks.
- **`SECURITY DEFINER` helper functions** (`is_host_member`, `is_event_host`, `is_event_checker_or_host`, `is_photo_host`) — used inside RLS policies to avoid recursive policy evaluation.
- **Database triggers** for RSVP lifecycle:
  - `place_rsvp` — on insert, automatically sets `status = 'going'` if capacity is available, otherwise `status = 'waitlist'` with a position number.
  - `on_rsvp_update` — on cancellation of a `going` RSVP, calls `promote_waitlist()` to advance the FIFO queue automatically.
  - `on_event_capacity_change` — when event capacity is increased, `promote_waitlist()` runs to fill newly opened spots.
- **Unique partial index** (`rsvps_active_unique`) — prevents duplicate active RSVPs per user per event while allowing multiple cancelled rows.

### Testing Approach

Manual end-to-end testing across all flows:
- Host registration and event CRUD (create, publish, unpublish, duplicate)
- RSVP (going path and waitlist path when capacity is filled)
- Ticket display with QR code and Add-to-Calendar
- Check-in page: code entry, duplicate detection, undo
- Gallery upload and host moderation
- Post-event feedback submission (checked that the form only appears after `end_at`)
- Report submission and hide/dismiss actions

---

## What Worked Well

- **Supabase triggers for RSVP placement and waitlist promotion** — moving this logic into the database (rather than application code) means it fires reliably even if multiple concurrent requests arrive simultaneously. There is no race condition for capacity enforcement.
- **TanStack Query polling** (`refetchInterval: 15000`) for the tickets and event detail pages — provides in-app notification of waitlist promotion without requiring WebSockets.
- **RLS-based scoping** — the reports and dashboard queries don't need manual host-ID filtering in the application layer; Postgres automatically returns only rows the signed-in user is authorised to see.
- **ICS calendar file generation** — entirely client-side, no server round-trip needed.
- **Lovable code generation** — accelerated initial scaffolding significantly, especially for boilerplate UI components, the Supabase client wrapper, and route structure.

---

## What Did Not Work / Limitations

- **No real-time push** — waitlist promotion notifications rely on polling. A user whose tab is inactive won't receive the notification until they return to the page. A Supabase Realtime subscription would be the right long-term solution.
- **No email notifications** — attendees are not emailed when they are promoted from waitlist to confirmed. In-app polling is the only promotion signal.
- **Image upload path** — images are stored under `{userId}/{uuid}.{ext}` in Supabase Storage. There is no post-upload image optimisation (resizing, format conversion). Large uploads from attendees are accepted up to the bucket size limit.
- **Timezone input is a free-text field** — no validation beyond requiring a non-empty string. An incorrect IANA timezone string would silently fall back to UTC in `Intl.DateTimeFormat`.

---

## Notable Decisions

### Waitlist promotion in the database, not the application

Promoting the next waitlisted attendee on cancellation is handled by a Postgres trigger (`on_rsvp_update → promote_waitlist`). This was deliberately chosen over an application-layer approach because:
- Concurrent cancellations cannot over-promote; the trigger runs inside the same transaction.
- It works even if future admin tooling bypasses the React frontend.

### Ticket code generation: client-side prefix + DB override

The application generates a human-readable code (`CP-XXXXXXXX`) before inserting the RSVP. The `place_rsvp` trigger also generates one if the provided code is empty, acting as a safety net. This means the code is known to the client immediately after insert without a second round-trip.

### Separate `demo_attendees` table for seeded test data

The main `profiles` table is keyed to `auth.users`, which means seeded demo attendees would require real auth users. Instead, the seed migration creates fake UUIDs in `demo_attendees` and loosens the `rsvps.user_id` foreign key. The CSV export reads both `profiles` and `demo_attendees` with a fallback, so exported data is complete for both real and demo attendees.

### Public host page and social preview metadata

Each event page and host page includes `og:title`, `og:description`, and `og:type` meta tags so that shared links render a preview card in Slack, Twitter/X, and iMessage. These are set in the TanStack Router `head()` function at the route level.

### Checker role separation

The `checker` host role was given access only to the check-in page (not event management, dashboard, or CSV export). This allows event organisers to safely share a checker invite link with venue staff without granting them management capabilities.
