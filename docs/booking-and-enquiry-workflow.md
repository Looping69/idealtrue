# Booking And Enquiry Workflow

This document describes the current stay-request workflow, the availability model behind it, and how the host enquiries screen is expected to behave.

## Availability model

Ideal Stay no longer treats listing availability as a flat, unreliable `blocked_dates` list.

The durable source of truth is the `listing_availability_blocks` ledger in Encore `catalog`.

Each block is one of:

- `MANUAL`: a host-created manual block
- `APPROVED_HOLD`: an approved enquiry that is holding the stay while payment is pending
- `BOOKED`: a confirmed stay after payment confirmation

Important rule:

- stay nights are end-exclusive
- `checkIn=2026-04-10`, `checkOut=2026-04-13` means the blocked nights are `2026-04-10`, `2026-04-11`, and `2026-04-12`
- the checkout day is not considered occupied overnight

Frontend note:

- `src/lib/listing-availability.ts` is the shared frontend helper for availability overlap checks
- `src/pages/ExploreView.tsx` uses it to hide unavailable listings for the requested stay
- `src/components/ListingDetail.tsx` uses the same helper so the booking UI and explore results stay aligned

## Booking lifecycle

Current booking lifecycle:

1. Guest creates an enquiry.
2. Host views, responds, approves, or declines.
3. Approval unlocks off-platform payment.
4. Guest submits payment proof.
5. Host confirms payment.
6. Inquiry becomes a booked stay.

Core states:

- Inquiry states: `PENDING`, `VIEWED`, `RESPONDED`, `APPROVED`, `DECLINED`, `EXPIRED`, `BOOKED`
- Payment states: `UNPAID`, `INITIATED`, `COMPLETED`, `FAILED`

Important workflow rule:

- an enquiry is not a booked stay until host payment confirmation completes

Expiry enforcement:

- unresolved enquiries in `PENDING`, `VIEWED`, or `RESPONDED` now expire automatically 48 hours after the latest host-response milestone
- approved enquiries now expire automatically 24 hours after approval unless the stay is fully confirmed into `BOOKED`
- expiry is enforced server-side when bookings are read or mutated, and an hourly booking cron sweeps stale rows so inventory does not depend on someone opening a screen
- when an approved enquiry expires, the booking moves to `EXPIRED` and its `APPROVED_HOLD` inventory is released on the next availability sync

## Host enquiries screen

The host enquiries page is intended to be an operational queue, not a passive list.

`src/pages/HostEnquiries.tsx` now groups bookings into these buckets:

- `Needs Response`: host still needs to act
- `Awaiting Guest Payment`: host approved, guest has not submitted proof
- `Awaiting Payment Confirmation`: guest submitted proof, host must confirm
- `Confirmed Stays`: payment confirmed and stay is booked
- `Closed Loop`: declined or expired enquiries retained for traceability

The classification logic lives in `src/lib/inquiry-state.ts` so page behavior stays consistent with the workflow model.

Key host-screen expectations:

- show booking age and last workflow movement
- show the active response/payment deadline for expirable enquiries
- show stay value, breakage deposit, and total guest exposure
- show payment reference and proof-link state during payment review
- never enable payment confirmation if proof is inaccessible
- retain closed enquiries for audit context instead of dropping them from view

## Host availability calendar

The host availability calendar is now expected to behave like an operational inventory tool, not just a date picker.

`src/pages/HostAvailability.tsx` now supports:

- per-listing availability metrics
- manual day toggling in the calendar
- bulk range block and reopen actions
- range block notes for manual operational context
- quick block presets for near-term shutdown windows
- selected-day inspection showing the owning availability blocks
- upcoming constraint tracking for future holds and booked stays
- direct jump into the enquiry workflow when an inspected night is tied to an inquiry-driven block

Important behavior rules:

- manual host blocks can be added or removed freely
- approved holds and booked stays are locked from manual editing
- bulk actions skip locked dates instead of pretending they changed
- manual blocks are now persisted as interval records, not one row per visible date
- unchanged manual intervals preserve their notes; reshaped intervals are treated as new intervals
- booked stays still follow end-exclusive occupancy rules

Implementation note:

- the frontend rule helpers for this surface live in `src/lib/host-availability.ts`
- these helpers exist so date classification, range application, and locked-date handling can stay tested and reusable
- the backend now exposes `PUT /host/listings/availability/blocks` for interval-based manual block persistence
- the backend now exposes `GET /host/listings/:listingId/availability-summary` for server-computed host calendar metrics and upcoming constraints
- manual availability blocks now support an optional `note` field in `listing_availability_blocks`

## Known limitations

The workflow is stronger than before, but still incomplete in a few places:

- no structured decline reason yet
- no explicit dispute workflow yet
- no backend-side SLA timestamps or last-actor metadata yet
- off-platform payment confirmation still depends on host discipline
- host availability still lacks recurring rules and import/export style controls

Those gaps are product and data-model gaps, not just UI polish gaps.
