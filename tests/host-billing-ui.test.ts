import assert from 'node:assert/strict';
import test from 'node:test';

import type { HostBillingAccount } from '../src/types';
import { getHostBillingTimelinePresentation } from '../src/lib/host-billing-ui';

function makeVoucherAccount(overrides: Partial<HostBillingAccount> = {}): HostBillingAccount {
  return {
    userId: 'host-1',
    plan: 'professional',
    billingSource: 'voucher',
    billingStatus: 'active',
    voucherCode: 'FOUNDER-001',
    voucherRedeemedAt: '2026-04-01T00:00:00.000Z',
    currentPeriodStart: '2026-04-01T00:00:00.000Z',
    currentPeriodEnd: '2026-04-23T12:00:00.000Z',
    reminderWindowStartsAt: '2026-04-16T12:00:00.000Z',
    lastReminderSentAt: '2026-04-19T08:00:00.000Z',
    reminderCount: 2,
    cardOnFile: false,
    cardholderName: null,
    cardBrand: null,
    cardLast4: null,
    cardExpiryMonth: null,
    cardExpiryYear: null,
    cardLabel: null,
    greylistedAt: null,
    greylistReason: null,
    inReminderWindow: true,
    greylistEligible: false,
    nextAction: 'add_card',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-20T08:00:00.000Z',
    ...overrides,
  };
}

test('builds a countdown, urgency state, and action copy for voucher hosts in the reminder window', () => {
  const result = getHostBillingTimelinePresentation(
    makeVoucherAccount(),
    '2026-04-20T12:00:00.000Z',
  );

  assert.equal(result.countdownLabel, 'Greylist in 3 days');
  assert.equal(result.urgencyLabel, 'Final reminder window');
  assert.equal(result.urgencyTone, 'warning');
  assert.equal(result.actionLabel, 'Add a billing card before 2026-04-23 to keep your listings live.');
  assert.equal(result.reminderLabel, '2 reminders sent');
  assert.equal(result.periodLabel, 'Free hosting period: 2026-04-01 to 2026-04-23');
});

test('escalates to an overdue greylist state once the free period has ended', () => {
  const result = getHostBillingTimelinePresentation(
    makeVoucherAccount({
      currentPeriodEnd: '2026-04-20T11:00:00.000Z',
      greylistEligible: true,
      inReminderWindow: false,
      nextAction: 'greylist',
      reminderCount: 4,
    }),
    '2026-04-20T12:00:00.000Z',
  );

  assert.equal(result.countdownLabel, 'Greylist can happen now');
  assert.equal(result.urgencyLabel, 'Overdue');
  assert.equal(result.urgencyTone, 'danger');
  assert.equal(result.actionLabel, 'Add a billing card now to stop your account from being paused.');
  assert.equal(result.reminderLabel, '4 reminders sent');
});
