# Keystone — Property-Native CRM

A CRM built for property sales: buyers, requirements, inventory, and deals are first-class objects — from lead to booking.

**Status:** Phase 1 (Core CRM) and Phase 2 (Sales Operations) are complete and working.

## Stack

- **Next.js 16** (App Router, Server Components + Server Actions)
- **Prisma 6 + SQLite**
- **Tailwind CSS 4**
- **Zod** validation, **jose** JWT auth, **bcryptjs** passwords
- **Vitest** for policy tests

## Setup

```bash
pnpm install
pnpm db:reset    # create DB + seed demo data
pnpm dev         # http://localhost:3000
```

### Demo logins (password: `keystone`)

| User | Email | Role |
|---|---|---|
| Ananya Rao | `ananya@keystone.local` | Admin |
| Vikram Shah | `vikram@keystone.local` | Manager |
| Arjun Mehta | `arjun@keystone.local` | Sales |
| Meera Iyer | `meera@keystone.local` | Sales |

### Environment

Copy `.env.example` and set:

- `DATABASE_URL` — SQLite file path
- `AUTH_SECRET` — JWT signing key (use a long random string)
- `CRON_SECRET` — bearer token for the scheduled jobs endpoint

---

## Phase 1 — Core CRM

The foundation: capture buyers, track inventory, match them, and move deals through the pipeline.

### 1. Authentication, users, roles

- Email/password login with bcrypt-hashed passwords.
- Session = signed JWT in an HTTP-only cookie (7 days).
- Roles: **Admin** (user management, everything), **Manager** (team views, approvals, lead assignment), **Sales** (own work).
- `proxy.ts` redirects unauthenticated users to `/login`.
- Admins create users, change roles, activate/deactivate from `/users`.

### 2. Customers & leads (with deduplication)

- `/leads/new` captures a lead; the system normalizes phone/email and matches it to an existing customer (same phone or email) instead of creating duplicates. Merged leads land on the lead page with `?merged=1`.
- Leads have a source (website, portal, referral, walk-in, broker, campaign), status (new → contacted → qualified/unqualified/converted), and an owner.
- `/customers` lists customers; `/customers/[id]` shows the full record: contact info, all leads, requirements, deals, visits, and the activity timeline.

### 3. Buyer requirements

- On the customer page, capture what they want: city, locality, configurations (1–4 BHK, villa, etc.), budget range, possession preference, purpose.
- Requirements drive property matching.

### 4. Inventory (developer → project → tower → unit)

- `/inventory` lists projects with availability counts.
- `/inventory/[projectId]` shows the full floor book: every unit with type, carpet area, price, and status (available/held/booked/sold).

### 5. Property matching (`lib/matching.ts`)

- When a requirement is saved (or "Run matching" is clicked), every available/held unit is scored 0–110: city (+25), locality (+15), configuration (+25), budget (+25, or +12 within 10%), availability (+10), possession (+10). Different city = 0.
- Matches scoring ≥40 are stored and shown at `/matches`, sorted by score, with human-readable reasons ("Inside budget", "Available now").
- Run matching again anytime inventory changes — scores update in place.

### 6. Sales pipeline

- Qualifying a lead opens an opportunity for that customer.
- `/pipeline` is a stage board: New → Qualified → Matching → Site visit → Negotiation → Won/Lost.
- Shortlisting a match attaches that unit + price to the customer's open opportunity.
- Stage moves are validated; **WON** requires a unit, a live hold, and an approved offer (see Phase 2), then books the unit and converts the leads — in one transaction.

### 7. Site visits

- `/visits/new` schedules a visit (customer, project, optional unit, host, time); scheduling advances early-stage opportunities to Site visit.
- `/visits` records outcomes — completed, no-show, cancelled — with feedback notes.

### 8. Dashboard

- Answers the five sales-floor questions: **Who should I contact?** (uncontacted leads, overdue tasks) · **What should I show them?** (high-score matches) · **What happened?** (activity) · **What is blocking the deal?** (stale opportunities, expiring holds) · **What is likely to close?** (deals in negotiation).

---

## Phase 2 — Sales Operations

Automation that keeps the floor moving: leads routed automatically, SLAs enforced, approvals controlled, and inventory protected by holds.

### 1. Sticky round-robin lead routing (`lib/sales-policy.ts`, `actions/leads.ts`)

- New leads are routed automatically among active **Sales** users — no manual picker.
- **Round robin:** next salesperson after the last one assigned (cursor stored in `RoutingState`).
- **Sticky:** if the customer already has an owner, the lead returns to that same salesperson.
- The owner is written to `Customer.ownerId` so every future lead sticks to them.
- Reassignment is manager/admin-only and moves the customer owner + open tasks together.

### 2. First-contact SLA + follow-up tasks

- Every new lead auto-creates a **first-contact task due in 4 hours** for the routed owner.
- Marking a lead contacted/qualified auto-completes that task.
- Completing a site visit auto-creates a **follow-up task due in 24 hours** (exactly once, guaranteed by a unique key).
- `/tasks`: create, complete, cancel. Sales sees their own; managers/admins can switch to team view (`?scope=team`).

### 3. SLA escalations, reminders, hold expiry (scheduled job)

- `POST /api/jobs/sales-ops` with `Authorization: Bearer $CRON_SECRET`.
- Each run is **idempotent** (safe to run repeatedly):
  - **Overdue open tasks** → escalated: assignee notified, all managers/admins get an SLA-breach alert.
  - **Visits within 24 hours** → host gets a reminder.
  - **Holds expiring within 24 hours** → owner gets a warning.
  - **Holds past expiry** → released, unit returned to available, owner notified.
- Schedule it every ~15 minutes (cron, systemd timer, Vercel cron, etc.):

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-host/api/jobs/sales-ops
```

### 4. In-app notifications

- Every automated event (lead assigned, approval requested, task overdue, visit reminder, hold warnings/expiry) creates a notification.
- `/notifications` is the inbox; badge count in the sidebar; mark read individually or all.
- Duplicate protection via unique event keys — the job can never spam duplicates.

### 5. Unified customer timeline

- Every mutation across both phases (lead capture, routing, status changes, shortlists, visits, offers, approvals, holds, tasks, escalations) writes an Activity row **in the same transaction**.
- The customer page timeline is the complete story of that buyer.

### 6. Shortlist comparison

- Shortlisted matches persist per customer; attaching a unit to a deal is done by shortlisting.
- `/customers/[id]/compare` shows all shortlisted units side by side: project, developer, locality, unit, floor, configuration, carpet, price, possession, amenities.

### 7. Negotiation offers & discount approvals (`actions/deals.ts`)

- Offers are **immutable history** with a list-price snapshot — submit a new offer instead of editing an old one.
- Discount is computed in basis points from the live unit price (client can't fake it).
- **≤5% discount → auto-approved**, deal value updates immediately.
- **>5% discount → pending**; all active managers/admins are notified.
- Only Manager/Admin can approve/reject; **self-approval is blocked**; decisions are terminal (can't be re-decided, even concurrently); only an approved offer updates the deal value.
- Deal detail page: `/pipeline/[id]` — offer history, approval controls, hold management.

### 8. Transactional unit holds

- A hold reserves the unit for one opportunity until an expiry time — the only way a unit becomes **Held**.
- One active hold per unit and per opportunity, enforced by database unique keys.
- Atomic claim: two users trying to hold the same unit simultaneously — one wins, the other gets a clear error.
- Release (with reason) or expiry returns the unit to available automatically.
- **Winning a deal** requires an attached unit + a live hold + an approved latest offer; the hold converts, the unit is booked, and the customer's leads convert — all in one transaction. Losing a deal releases any holds.
- Manual `HELD` status changes in inventory are blocked; admins can still correct Available/Booked/Sold.

---

## Testing

### Automated

```bash
pnpm test        # policy tests: discount math, 5% threshold, round-robin rotation
pnpm lint        # ESLint
pnpm typecheck   # TypeScript
pnpm build       # production build
```

### Manual walkthrough (in the browser)

1. **Routing:** as Ananya, create 3 leads at `/leads/new` → owners rotate Arjun → Meera → Arjun. Create a 4th with the same phone as #1 → sticky (same owner, `?merged=1`).
2. **SLA:** after each lead, check `/tasks` for the 4-hour first-contact task. Mark the lead contacted → task completes. Create a task due yesterday → run the job → notification "Task overdue" for the assignee, "SLA breached" for managers.
3. **Visits:** schedule a visit 2 hours out → run the job → reminder notification. Mark it completed → exactly one follow-up task appears.
4. **Compare:** shortlist 2–3 matches at `/matches` → open the customer's `/compare` page → side-by-side table.
5. **Offers:** on `/pipeline/[id]`, offer ~4.9% below list → auto-approved; offer ~7% → pending, manager notified. As a different manager, approve → deal value updates. Try approving your own offer → blocked.
6. **Holds:** hold the unit for 2 minutes, wait, run the job → expired, unit available again. Hold for tomorrow → unit shows Held in inventory; try the manual Held dropdown → blocked.
7. **Win:** attach unit + approved offer + live hold → move to Won in `/pipeline` → hold converted, unit booked, leads converted. Try Won without a hold → blocked.

Reset any time with `pnpm db:reset`.

---

## Deployment notes

- Set `AUTH_SECRET` and `CRON_SECRET` to long random strings in production.
- Keep the sales-ops job on a ~15-minute schedule.
- **SQLite requires a single app instance with a persistent writable volume.** For serverless or horizontally scaled deployments, migrate to a shared transactional database (e.g., PostgreSQL) first.

## Project layout

```
app/(crm)/        # authenticated CRM pages (dashboard, leads, customers, pipeline, ...)
app/api/jobs/     # protected scheduled-job endpoint
actions/          # server actions (mutations) per domain
lib/              # db client, auth, matching, sales policies, validators, formatting
components/       # app shell, shared UI primitives, status badges
prisma/           # schema + seed
```
