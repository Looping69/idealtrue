# Workflow Validation Matrix

This document is the maintained source-of-truth checklist for product workflows in Ideal Stay.

- inventory source files:
  - `/home/runner/work/idealtrue/idealtrue/src/components/AppRoutes.tsx`
  - `/home/runner/work/idealtrue/idealtrue/README.md`
  - `/home/runner/work/idealtrue/idealtrue/encore/*/api.ts`
- machine-readable matrix + CI enforcement:
  - `/home/runner/work/idealtrue/idealtrue/tests/workflow-matrix.ts`
  - `/home/runner/work/idealtrue/idealtrue/tests/workflow-matrix.test.ts`

## Workflow matrix

| Workflow | Owner area | Entry points | Backend service(s) | Expected outcome | Current coverage anchors | Gap status |
|---|---|---|---|---|---|---|
| Auth/account lifecycle | Identity + auth UI | `src/pages/SignupPage.tsx`, `src/pages/AccountPage.tsx` | `encore/identity/api.ts` | Users can sign up/sign in/verify/reset/manage profile securely | `tests/session-cookie.test.ts`, `tests/api-clients.test.ts`, `tests/ui/auth-context.test.tsx`, `tests/account-status.test.ts` | Needs full e2e auth journey |
| Listing discovery + booking request | Catalog + booking + explore UI | `src/pages/ExploreView.tsx`, `src/components/ListingDetail.tsx` | `encore/catalog/api.ts`, `encore/booking/api.ts` | Guests discover available listings and submit requests | `tests/listing-availability-ui.test.ts`, `tests/booking-workflow.test.ts`, `tests/e2e/happy-path.spec.ts` | Extend e2e rejection/edge cases |
| Booking/enquiry/payment lifecycle | Booking + host/guest UI | `src/pages/HostEnquiries.tsx`, `src/components/PaymentProofDialog.tsx` | `encore/booking/api.ts` | Booking reaches `BOOKED` only after valid payment flow | `tests/booking-workflow.test.ts`, `tests/inquiry-state.test.ts`, `tests/ui/host-dashboard.test.tsx`, `tests/ui/guest-dashboard.test.tsx` | Add full proof + confirm + review e2e |
| Host availability management | Catalog availability + host calendar UI | `src/pages/HostAvailability.tsx` | `encore/catalog/api.ts` | Manual blocks work; approved/booked locks remain immutable | `tests/host-availability.test.ts`, `tests/catalog-availability.test.ts`, `tests/api-clients.test.ts` | Add host availability e2e |
| Listing create/edit, quota, media | Catalog + billing entitlement | `src/pages/CreateListing.tsx` | `encore/catalog/api.ts`, `encore/billing/api.ts` | Hosts create/edit listings within plan constraints | `tests/ui/create-listing.test.tsx`, `tests/catalog-billing-helpers.test.ts`, `tests/api-clients.test.ts` | Add create/edit lifecycle e2e |
| KYC submission/review | Ops + identity + admin/account UI | `src/components/KYCModal.tsx`, `src/pages/AdminDashboard.tsx` | `encore/ops/api.ts`, `encore/identity/api.ts` | Hosts submit KYC; admins review and status persists | `tests/api-clients.test.ts`, `tests/ui/admin-dashboard-data.test.tsx`, `tests/backend-notification-helpers.test.ts` | Add host->admin->host e2e |
| Subscriptions and host billing | Billing + pricing UI | `src/pages/PricingPage.tsx` | `encore/billing/api.ts` | Checkout/voucher/card/greylist transitions remain consistent | `tests/host-billing-lifecycle.test.ts`, `tests/host-billing-ui.test.ts`, `tests/catalog-billing-helpers.test.ts` | Add checkout/voucher callback e2e |
| Content Studio lifecycle | Billing content engine + host social UI | `src/pages/SocialDashboard.tsx` | `encore/billing/api.ts` | Draft generation/schedule/publish honors entitlements | `tests/social-template-engine.test.ts`, `tests/text-generation.test.ts`, `tests/api-clients.test.ts` | Add social dashboard workflow e2e |
| Messaging + attachments | Messaging + chat UI | `src/components/ChatModal.tsx` | `encore/messaging/api.ts` | Booking participants can message and upload attachments safely | `tests/api-clients.test.ts`, `tests/backend-notification-helpers.test.ts` | Add chat/attachment UI + e2e |
| Reviews | Reviews + guest/admin UI | `src/components/ReviewForm.tsx`, `src/pages/AdminDashboard.tsx` | `encore/reviews/api.ts` | Eligible guests review stays; admins moderate | `tests/api-clients.test.ts`, `tests/ui/admin-dashboard-data.test.tsx` | Add review lifecycle unit/e2e |
| Notifications | Ops notifications + notification context UI | `src/components/NotificationBell.tsx`, `src/context/NotificationContext.tsx` | `encore/ops/api.ts` | Notification state remains consistent across reads/dismissals | `tests/ui/notification-context.test.tsx`, `tests/backend-notification-helpers.test.ts`, `tests/e2e/happy-path.spec.ts` | Expand cross-workflow notification e2e |
| Referrals + leaderboard | Referrals + identity + referral UI | `src/pages/ReferralView.tsx` | `encore/referrals/api.ts`, `encore/identity/api.ts` | Rewards and leaderboard are accurate and role-aware | `tests/api-clients.test.ts`, `tests/backend-notification-helpers.test.ts` | Add referral signup/reward e2e |
| Admin moderation + settings | Admin UI + ops/identity/reviews/referrals | `src/pages/AdminDashboard.tsx` | `encore/ops/api.ts`, `encore/identity/api.ts` | Admin operations are authorized and auditable | `tests/ui/admin-dashboard-data.test.tsx`, `tests/api-clients.test.ts` | Add destructive admin action e2e |
| Trip planner / AI-assisted flows | AI proxy + planner/content UI | `src/pages/HolidayPlanner.tsx`, `src/lib/ai-client.ts` | `server.ts` AI endpoints | AI responses stay constrained/validated/rate-limited | `tests/ai-client.test.ts`, `tests/ai-rails.test.ts`, `tests/text-generation.test.ts` | Add planner UI end-to-end checks |

## Layer coverage contract

For each workflow above, coverage must map to:

- pure business rules → unit tests
- frontend/backend contract mapping → client tests
- page behavior and state transitions → UI tests
- cross-role journeys → Playwright e2e
- cron/webhook/background behavior → backend-focused tests

## Prioritized expansion queue

- [ ] auth/account
- [ ] booking/payment
- [ ] KYC
- [ ] subscriptions/host billing
- [ ] admin moderation
- [ ] content studio
- [ ] messaging
- [ ] referrals
- [ ] reviews
- [ ] notifications
- [ ] trip planner

## Async and external dependency workflows

Treat these as first-class and keep deterministic mocks/fakes:

- [ ] booking expiry cycle
- [ ] host billing reminder cycle
- [ ] payment webhook outcomes
- [ ] signed upload flows
- [ ] AI endpoints and rate limiting
