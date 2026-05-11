# CommunityPass — Usage Guide

CommunityPass is a lightweight event hosting and attendance platform. This guide walks through the four main flows: **Publish → RSVP → Ticket → Check-in**.

## Submission Artifacts

- Deployed application: [https://community-pass-hub.lovable.app](https://community-pass-hub.lovable.app/)
- Public repository: [https://github.com/qa-auto-n/ai-challenge-v2](https://github.com/qa-auto-n/ai-challenge-v2)
- Project folder: `task-2/`
- Example CSV export: [`rsvps-export-example.csv`](rsvps-export-example.csv)

## Seeded Demo Content

The deployed app includes the minimum seeded content required by the task:

- Host: `Community Tech Hub`
- Upcoming event: `Frontend Meetup 2026`
- Past event: `QA Community Night`

## Prerequisites

- A modern browser (Chrome, Firefox, Safari, Edge)
- Access to the deployed app URL above

---

## 1. Publish an Event

### Register as a Host

1. Click **Become a host** in the top navigation bar.
2. Sign in or create an account when prompted.
3. Fill in your organization name, optional logo, short bio, and contact email.
4. Click **Submit**.

You are now a host and can access the **Host Dashboard** from the navigation bar.

### Create an Event

1. From the **Host Dashboard**, click **New event**.
2. Fill in:
   - **Title** — name of the event
   - **Description** — details for attendees
   - **Start / End** date-time and **Timezone**
   - **Venue address** *or* **Online link** (at least one is required)
   - **Capacity** — maximum number of confirmed attendees
   - **Cover image** (optional upload)
   - **Visibility** — toggle between **Public** (searchable on Explore) and **Unlisted** (link-only)
3. Choose **Paid event** — this option is visible but disabled ("Coming soon").
4. Click **Publish** to go live, or **Save draft** to continue editing later.

### Manage an Event

From the dashboard event table you can:

| Action | How |
|--------|-----|
| Edit | Click **Manage** |
| Unpublish | Open the editor and click **Unpublish** |
| Duplicate | In the editor, click **Duplicate** — creates a draft copy shifted one week forward |
| Export attendees | Click **RSVPs CSV** or **Attendance CSV** |

---

## 2. RSVP to an Event

1. Browse events on the **Explore** page (text search, date range, location filter, and "Include past" toggle are available).
2. Click any event card to open the event page.
3. Click **RSVP** in the sidebar.
   - If you are not signed in, you will be redirected to sign-in and returned to the event page afterward.
4. If the event is **not full**: you are confirmed immediately.
5. If the event **is full**: you are placed on the waitlist (FIFO). You will be promoted automatically when a spot opens.

> **Cancelling**: You can cancel your RSVP at any time from the event page or from **My Tickets**. Cancellation frees your spot and automatically promotes the next waitlisted attendee.

---

## 3. Your Ticket

After a confirmed RSVP:

1. Go to **My Tickets** in the navigation bar to see all your upcoming tickets.
2. Each ticket shows:
   - Event title, date/time, and location
   - Your **RSVP status** (Going / Waitlist)
   - A **QR code** and unique ticket code (e.g. `CP-A1B2C3D4`)
   - An **Add to Calendar** button (downloads a `.ics` file)
3. The QR code is dimmed for waitlist tickets and labeled "Not valid for entry".
4. Waitlist → Going promotion is displayed in-app (toast notification) on the next page refresh or within 15 seconds via background polling.

---

## 4. Check-in at the Event

### Who can check in

Checkers and Hosts of the event's host organisation can access the check-in page. A Host can create a **Checker invite link** from the dashboard (Team & invites section) and share it with venue staff.

### Check-in flow

1. Open the event's check-in page:
   - From the Host Dashboard, click **Check-in** next to the event.
   - Direct URL: `/check-in/<eventId>`
2. The page shows live counters: **Going**, **Waitlist**, **Checked-in**, and **Remaining**.
3. Enter a ticket code in the input field (e.g. `CP-A1B2C3D4`) and press **Enter** or click **Check in**.
   - The name of the checked-in attendee is shown in a toast.
   - Duplicate codes are rejected with an error.
   - Waitlisted attendees cannot be checked in until promoted.
4. To undo the last check-in (your session only), click **Undo Last Scan**.
5. Recent scans are listed below with attendee name, code, checker name, and timestamp.

---

## Additional Features

| Feature | Where |
|---------|-------|
| Post-event feedback (1–5 stars + comment) | Event page → Feedback section (visible after event ends) |
| Photo gallery upload | Event page → Gallery section (requires host approval) |
| Report event or photo | Flag button on event page / photo hover |
| Gallery moderation | Navigation → **Gallery** (hosts only) |
| Report queue | Navigation → **Reports** (hosts only) |
| My Events (host/checker view) | Navigation → **My Events** |

---

## CSV Export Schema

Exported files use the following columns and open correctly in Excel and Google Sheets:

| Column | Description |
|--------|-------------|
| `name` | Attendee display name |
| `email` | Attendee email address |
| `RSVP status` | `Going`, `Waitlist`, or `Cancelled` |
| `check-in time` | `YYYY-MM-DD HH:MM` (local) or blank if not checked in |

Two variants are available:
- **RSVPs CSV** — all RSVP rows for the event
- **Attendance CSV** — attendance-focused rows, including checked-in history
