# Ideal Stay

Ideal Stay is a South Africa-focused accommodation marketplace and host workspace. The repo now has two clear halves:

- a React/Vite frontend in the root
- an Encore TypeScript backend in [`encore`](/C:/Git%20Repos/IdealTrue/encore)

This is no longer a Gemini template repo, and it is no longer pretending Firebase should own the product. The frontend now runs against Encore-backed services, PostgreSQL databases, buckets, and typed API boundaries.

## Current architecture

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4

### Backend

- Encore TypeScript app in [`encore`](/C:/Git%20Repos/IdealTrue/encore)
- Service split across `identity`, `catalog`, `booking`, `billing`, `messaging`, `referrals`, `reviews`, `ops`, and `analytics`
- Multiple provisioned SQL databases
- Provisioned buckets for listing media, chat attachments, KYC docs, and moderation evidence
- Pub/Sub topic for platform domain events

### Realtime notes

- notification delivery currently uses backend-backed polling through the same-origin Encore proxy
- read state is persisted per user in Encore, so notifications stay consistent across devices
- the durable source of truth for bookings, listings, identity, KYC, reviews, referrals, notifications, and admin workflows is Encore

This is now an Encore-first repo, not a Firebase bridge with new paint.

## What already routes through Encore

- session sync and profile resolution
- local session bootstrap and account creation
- password signup and password login
- Google sign-in through Google Identity Services
- email verification and password reset flows
- profile updates and role changes
- public listing reads
- host listing reads
- listing create/update
- booking creation
- guest/host booking reads
- referral reward history reads
- listing reviews read/write
- referral leaderboard reads
- admin reads and writes for users, bookings, listings, reviews, referrals, subscriptions, notifications, and platform settings
- listing media uploads through Encore bucket URLs
- profile photo uploads through Encore bucket URLs
- KYC submission review, audit-backed submission/review history, and secure asset previews through Encore ops APIs
- booking payment dispute escalation history and booking ops summaries through Encore booking APIs
- subscription upgrades and downgrades through Encore billing APIs
- content studio entitlements, monthly included usage, credit top-ups, and saved drafts through Encore billing APIs

## Booking and availability rules

- listing availability now uses a durable ledger of availability blocks, not just a fragile `blocked_dates` array
- host manual blocks, approved enquiry holds, and confirmed booked stays are tracked separately in Encore `catalog`
- manual host blocks are now stored as interval records with optional notes, not just flat date arrays
- stay dates are end-exclusive for occupancy logic, so checkout day is not treated as a blocked overnight
- the frontend uses shared availability logic in [`src/lib/listing-availability.ts`](/C:/Git%20Repos/IdealTrue/src/lib/listing-availability.ts) so explore filtering and booking validation stay consistent
- the host enquiries screen is now treated as a workflow board with `Needs Response`, `Awaiting Guest Payment`, `Awaiting Payment Confirmation`, `Confirmed Stays`, and `Closed Loop` buckets
- booking ops summary data now comes from Encore for the latest actor, latest workflow movement, active deadline, and open dispute count
- the host dashboard watchlist now prefers those same backend booking ops summaries when ordering urgent approved holds and surfacing open disputes
- the frontend now has typed booking dispute and booking ops summary clients instead of ad hoc route calls
- payment confirmation is now visibly blocked in the host enquiries UI while an open dispute is still attached to the inquiry
- the host availability calendar now supports bulk range actions, notes on manual block intervals, selected-day inspection, and backend summary tracking instead of only single-day toggles

See [`docs/booking-and-enquiry-workflow.md`](/C:/Git%20Repos/IdealTrue/docs/booking-and-enquiry-workflow.md) for the full workflow and operational expectations.

See [`docs/workflow-validation-matrix.md`](/C:/Git%20Repos/IdealTrue/docs/workflow-validation-matrix.md) for the maintained workflow inventory, coverage gaps, fixture contract, and CI acceptance gate.

## What does not fully route through Encore yet

- KYC document submission now records audit-backed submission/review history, but disputes and richer ops case management are still missing
- stay-payment coordination now has a lightweight dispute escalation trail and backend ops summary metadata, but off-platform payment operations still need fuller case handling, refund automation, assignee workflow, and SLA tooling
- billing/subscriptions are scaffolded on the backend but not commercially complete
- AI content engine still needs real social publishing integrations beyond draft scheduling and publish tracking
- generated Encore frontend clients are still blocked, so the frontend uses a manual request client

## Local development

### Prerequisites

- Node.js 20+
- npm
- Encore CLI installed and authenticated if you want to run the backend locally

### Install frontend dependencies

```bash
npm install
```

### Install backend dependencies

```bash
cd encore
npm install
```

### Run frontend

```bash
npm run dev
```

The frontend runs at [http://localhost:3000](http://localhost:3000).

### Backend notes

The local dev proxy defaults to `http://127.0.0.1:4000` only in local development.

If you want to be explicit in your local env file, set:

```bash
ENCORE_API_URL=http://127.0.0.1:4000
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

Preview and production must set `ENCORE_API_URL` explicitly. They fail closed if the variable is missing, and production-like environments refuse to start if the value points at the staging Encore host.

Dev login is now opt-in only and should never be enabled in a shared environment:

```bash
IDEAL_STAY_ENABLE_DEV_LOGIN=true
```

The demo seed script defaults to local and refuses to hit a non-local API target unless you opt in:

```bash
IDEAL_STAY_ALLOW_REMOTE_SEED=true
```

For shared preview or staging environments, the same script can now create disposable guest and host smoke accounts through the real auth flow, then use an existing admin account to normalize passwords, host plans, KYC state, and demo listings:

### Yoco test mode

Use the backend `YOCO_PAYMENT_MODE=test` setting together with `YOCO_TEST_SECRET_KEY` to exercise the checkout flow without charging a real card.

For Yoco checkout testing, Yoco’s developer docs currently list the successful test card as `4111 1111 1111 1111`. Use any future expiry date and any 3-digit CVC.

Test transactions are isolated from live sales data and should be used for subscription checkout verification before switching back to live mode.

```bash
IDEAL_STAY_API_URL=https://your-encore-host \
IDEAL_STAY_ALLOW_REMOTE_SEED=true \
IDEAL_STAY_SEED_ADMIN_EMAIL=admin@example.com \
IDEAL_STAY_SEED_ADMIN_PASSWORD=admin-password \
IDEAL_STAY_DEMO_PASSWORD='IdealStayDemo123!' \
npm run seed:demo
```

That shared-environment path does not mint a new admin. It expects one existing admin login, then provisions disposable smoke users and listing data around it.

Backend auth email delivery is optional in local/dev but should be configured in any serious environment:

- `RESEND_API_KEY`
- `AUTH_EMAIL_FROM`
- `AUTH_EMAIL_REPLY_TO`
- `IDEAL_STAY_APP_URL`
- `GOOGLE_OAUTH_CLIENT_ID`

Google sign-in now expects the same Google web client id in two places:

- frontend env: `VITE_GOOGLE_CLIENT_ID`
- Encore backend config/secret: `GOOGLE_OAUTH_CLIENT_ID`

Do not commit the downloaded Google OAuth client secret JSON into the repo. The frontend only needs the client id string, and the backend verifies Google ID tokens against that same client id.

The Encore app typechecks cleanly, but there are two environment caveats in the current machine state:

- `encore gen client` still fails because Encore client generation is rejecting the current auth metadata shape
- local `encore run` / `encore test` can fail if the local Encore daemon is unhealthy

That is why the frontend currently uses a manual fetch client in [`src/lib/encore-client.ts`](/C:/Git%20Repos/IdealTrue/src/lib/encore-client.ts) instead of a generated one.

## Production env contract

These are the important runtime expectations now:

- `ENCORE_API_URL`
  Required for preview and production.
  Optional only for local dev, where the proxy falls back to `http://127.0.0.1:4000`.
- auth runs through the same-origin proxy and is stored in an HttpOnly cookie.
- proxy logs are structured and include request id, upstream path, status, and duration.
- proxy logs never include bearer tokens or cookie contents.
- production and preview builds run a config guard that rejects missing `ENCORE_API_URL` and any staging Encore host reference.
- frontend builds also run a bundle-budget check so large JS regressions fail the build instead of sneaking through.

## Verification

The repo currently has two separate verification layers:

- `npm run test` and `npm run test:e2e` prove local rules, client contracts, and UI workflows.
- the Playwright specs under `tests/e2e` currently mock `/api/encore/**`, so they should be treated as frontend workflow coverage, not proof that a live Encore environment is healthy.

The baseline local verification commands are:

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
cd encore
npx tsc --noEmit
```

Before calling a preview or production deployment launch-ready, run the shared-environment seed if you need disposable smoke users, then run the live smoke check against the deployed frontend host so the same-origin proxy, session cookie flow, public listing reads, and real role-based access are verified in a real environment:

```bash
IDEAL_STAY_API_URL=https://your-encore-host \
IDEAL_STAY_ALLOW_REMOTE_SEED=true \
IDEAL_STAY_SEED_ADMIN_EMAIL=admin@example.com \
IDEAL_STAY_SEED_ADMIN_PASSWORD=admin-password \
npm run seed:demo

IDEAL_STAY_SMOKE_BASE_URL=https://your-preview-or-production-host \
IDEAL_STAY_SMOKE_REQUIRE_ROLE_CREDENTIALS=true \
IDEAL_STAY_SMOKE_EXPECT_LISTINGS_MIN=1 \
IDEAL_STAY_SMOKE_GUEST_EMAIL=guest.nomusa@idealstay.demo \
IDEAL_STAY_SMOKE_GUEST_PASSWORD='IdealStayDemo123!' \
IDEAL_STAY_SMOKE_HOST_EMAIL=thandi.mokoena@idealstay.demo \
IDEAL_STAY_SMOKE_HOST_PASSWORD='IdealStayDemo123!' \
IDEAL_STAY_SMOKE_ADMIN_EMAIL=admin@example.com \
IDEAL_STAY_SMOKE_ADMIN_PASSWORD=admin-password \
npm run smoke:live
```

The smoke runner also supports an optional throwaway signup probe through `IDEAL_STAY_SMOKE_SIGNUP_*` environment variables when you want to validate account creation in a shared test environment.

If you want the main test command to include the live environment gate in CI or a release checklist, set:

```bash
IDEAL_STAY_RUN_LIVE_SMOKE=true
```

### GitHub Actions staging workflow

The repo now includes `.github/workflows/staging-smoke.yml`.

It runs on pushes to `main` that touch app, test, script, or Encore files, on a nightly schedule at `03:17 UTC`, and through `workflow_dispatch` with an optional `run_seed` toggle.

Set these repository secrets before relying on it:

- `ENCORE_API_URL`
- `IDEAL_STAY_SEED_ADMIN_EMAIL`
- `IDEAL_STAY_SEED_ADMIN_PASSWORD`
- `IDEAL_STAY_DEMO_PASSWORD`
- `IDEAL_STAY_SMOKE_BASE_URL`
- `IDEAL_STAY_SMOKE_ADMIN_EMAIL`
- `IDEAL_STAY_SMOKE_ADMIN_PASSWORD`

The workflow now does four important things before it ever touches the live smoke path:

- runs `npm run check:staging-smoke-env` so missing secrets and bad URLs fail early
- runs frontend unit/UI tests plus the mocked Playwright pack
- installs Encore backend dependencies and typechecks the backend separately
- uploads Playwright artifacts from CI so browser failures are inspectable instead of opaque

After that it optionally runs `seed:demo`, then runs `smoke:live` against the deployed frontend host.

## Immediate next engineering work

1. Extend stay-payment operations beyond the current dispute trail and ops summary with assignee workflow, SLA handling, and refund orchestration.
2. Tighten KYC ops workflows beyond audit-backed history and simple approve/reject.
3. Add real payment provider integration for subscriptions and content-credit purchases.
4. Ship actual social platform publishing integrations on top of the new content draft workflow.
5. Solve the Encore auth metadata shape so generated frontend clients can replace the manual fetch bridge.
