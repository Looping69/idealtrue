# Enquiry Expiry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce automatic expiry for stale enquiries, release approval holds when they expire, and surface expiry deadlines cleanly in host and guest flows.

**Architecture:** Keep expiry owned by the booking domain. Compute and persist enquiry deadlines at state transitions, enforce them on booking reads and mutations, and run an hourly backend sweep so inventory does not depend on someone opening a screen. Frontend surfaces should consume the canonical `expiresAt` and `EXPIRED` state instead of inventing local timeout logic.

**Tech Stack:** Encore TypeScript backend, node:test unit tests, React/Vitest frontend tests

---

### Task 1: Lock Expiry Rules With Failing Tests

**Files:**
- Modify: `C:\Git Repos\IdealTrue\tests\booking-workflow.test.ts`
- Modify: `C:\Git Repos\IdealTrue\tests\inquiry-state.test.ts`

- [ ] **Step 1: Write the failing backend expiry-rule tests**

```ts
test('workflow computes expiry deadlines for unresolved and approved enquiries', () => {
  assert.equal(
    computeInquiryExpiresAt('PENDING', '2026-04-20T10:00:00.000Z'),
    '2026-04-22T10:00:00.000Z',
  );
  assert.equal(
    computeInquiryExpiresAt('APPROVED', '2026-04-20T10:00:00.000Z'),
    '2026-04-21T10:00:00.000Z',
  );
  assert.equal(computeInquiryExpiresAt('BOOKED', '2026-04-20T10:00:00.000Z'), null);
});
```

- [ ] **Step 2: Run the backend test to verify it fails**

Run: `npx tsx --test tests/booking-workflow.test.ts`
Expected: FAIL because the expiry helpers do not exist yet.

- [ ] **Step 3: Write the failing frontend deadline-state tests**

```ts
test('deadline state distinguishes response, payment, review, and expired enquiries', () => {
  assert.deepEqual(
    getInquiryDeadlineState({
      inquiryState: 'APPROVED',
      paymentState: 'INITIATED',
      paymentSubmittedAt: null,
      expiresAt: '2026-04-21T10:00:00.000Z',
    }),
    { kind: 'payment_due', deadlineAt: '2026-04-21T10:00:00.000Z' },
  );
});
```

- [ ] **Step 4: Run the frontend state test to verify it fails**

Run: `npx tsx --test tests/inquiry-state.test.ts`
Expected: FAIL because the deadline-state helper does not exist yet.

### Task 2: Implement Backend Expiry Ownership

**Files:**
- Modify: `C:\Git Repos\IdealTrue\encore\booking\workflow.ts`
- Modify: `C:\Git Repos\IdealTrue\encore\booking\api.ts`

- [ ] **Step 1: Add pure expiry-policy helpers**

```ts
export function computeInquiryExpiresAt(state: InquiryState, referenceIso: string) {
  // unresolved host queue: 48h, approved/payment completion window: 24h
}
```

- [ ] **Step 2: Enforce expiry timestamps during booking lifecycle transitions**

```ts
paymentUnlockedAt: nextStatus === "APPROVED" ? now : existing.payment_unlocked_at,
expiresAt: computeInquiryExpiresAt(nextStatus, now) ?? existing.expires_at,
```

- [ ] **Step 3: Add stale-enquiry expiration before reads/mutations and in the cron sweep**

```ts
export const inquiryExpiryCron = new CronJob("inquiry-expiry-cycle", {
  every: "1h",
  endpoint: async () => {
    await processInquiryExpiryCycle();
  },
});
```

- [ ] **Step 4: Run the targeted backend tests**

Run: `npx tsx --test tests/booking-workflow.test.ts`
Expected: PASS

### Task 3: Surface Canonical Deadline State In Host And Guest Flows

**Files:**
- Modify: `C:\Git Repos\IdealTrue\src\lib\inquiry-state.ts`
- Modify: `C:\Git Repos\IdealTrue\src\pages\HostEnquiries.tsx`
- Modify: `C:\Git Repos\IdealTrue\src\pages\HostDashboard.tsx`
- Modify: `C:\Git Repos\IdealTrue\src\pages\GuestDashboard.tsx`

- [ ] **Step 1: Add the shared deadline-state helper in frontend domain code**

```ts
export function getInquiryDeadlineState(booking: BookingStateSlice & Pick<Booking, "expiresAt">) {
  // map canonical booking state to UI deadline state
}
```

- [ ] **Step 2: Render countdown / expiry copy in host and guest views**

```tsx
{deadlineState && (
  <p className="text-sm text-on-surface-variant">
    {deadlineCopy}
  </p>
)}
```

- [ ] **Step 3: Run targeted frontend tests**

Run: `npx tsx --test tests/inquiry-state.test.ts && npm run test:ui -- --run tests/ui/host-dashboard.test.tsx`
Expected: PASS

### Task 4: Document And Verify

**Files:**
- Modify: `C:\Git Repos\IdealTrue\docs\booking-and-enquiry-workflow.md`
- Modify: `C:\Git Repos\IdealTrue\sani-memory.md`

- [ ] **Step 1: Document the enforced expiry policy**

```md
- unresolved enquiries expire after 48 hours without decisive host progress
- approved enquiries expire 24 hours after approval if payment is not fully completed
- expiry is enforced server-side on reads/mutations and by an hourly sweep
```

- [ ] **Step 2: Run the full relevant verification pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Record the session change log**

```md
- Added server-owned enquiry expiry windows, automatic stale-enquiry expiration, and hold release for expired approvals.
```
