# Keystone

Property-native CRM. Phase 1 covers authentication, customers, leads, inventory, matching, pipeline, site visits, and a working dashboard.

## Stack

Next.js 16, Prisma, SQLite, Tailwind CSS.

## Setup

```bash
pnpm install
pnpm db:reset
pnpm dev
```

Sign in with `ananya@keystone.local` / `keystone`.

Other demo users: `vikram@keystone.local`, `arjun@keystone.local`, `meera@keystone.local` — same password.

## Phase 1

- Auth, users, roles
- Customer and lead management with phone/email deduplication
- Buyer requirement capture
- Project / tower / unit inventory
- Sales pipeline
- Property matching
- Site visit tracking
- Dashboard answering who to contact, what to show, and what is blocking
