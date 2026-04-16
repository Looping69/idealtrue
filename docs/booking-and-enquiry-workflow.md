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
- show stay value, breakage deposit, and total guest exposure
- show payment reference and proof-link state during payment review
- never enable payment confirmation if proof is inaccessible
- retain closed enquiries for audit context instead of dropping them from view

## Known limitations

The workflow is stronger than before, but still incomplete in a few places:

- no host notes field yet
- no structured decline reason yet
- no explicit dispute workflow yet
- no backend-side SLA timestamps or last-actor metadata yet
- off-platform payment confirmation still depends on host discipline

Those gaps are product and data-model gaps, not just UI polish gaps.
