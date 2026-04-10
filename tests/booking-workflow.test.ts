import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bookingOverlapsBlockedDates,
  computeBookingTotalPrice,
  getInquiryStatusTransitionError,
  getPaymentProofSubmissionError,
  getPaymentStateTransitionError,
} from '../encore/booking/workflow.ts';

test('computeBookingTotalPrice uses nightly pricing only for valid stays', () => {
  const total = computeBookingTotalPrice(
    1500,
    new Date('2026-04-10T00:00:00.000Z'),
    new Date('2026-04-13T00:00:00.000Z'),
  );

  assert.equal(total, 1500 * 3);
});

test('bookingOverlapsBlockedDates catches blocked nights inside the requested stay', () => {
  assert.equal(
    bookingOverlapsBlockedDates(
      new Date('2026-04-10T00:00:00.000Z'),
      new Date('2026-04-13T00:00:00.000Z'),
      ['2026-04-11', '2026-05-01'],
    ),
    true,
  );

  assert.equal(
    bookingOverlapsBlockedDates(
      new Date('2026-04-10T00:00:00.000Z'),
      new Date('2026-04-13T00:00:00.000Z'),
      ['2026-04-13'],
    ),
    false,
  );
});

test('getInquiryStatusTransitionError allows the intended host approval workflow', () => {
  assert.equal(getInquiryStatusTransitionError('PENDING', 'VIEWED', 'host'), null);
  assert.equal(getInquiryStatusTransitionError('VIEWED', 'RESPONDED', 'host'), null);
  assert.equal(getInquiryStatusTransitionError('RESPONDED', 'APPROVED', 'host'), null);
  assert.equal(getInquiryStatusTransitionError('PENDING', 'DECLINED', 'host'), null);
  assert.equal(getInquiryStatusTransitionError('APPROVED', 'BOOKED', 'system'), null);
});

test('getInquiryStatusTransitionError rejects invalid transitions', () => {
  assert.match(
    getInquiryStatusTransitionError('PENDING', 'BOOKED', 'host') || '',
    /Hosts can only view, respond to, approve, or decline/,
  );
  assert.match(
    getInquiryStatusTransitionError('BOOKED', 'DECLINED', 'host') || '',
    /immutable/,
  );
  assert.match(
    getInquiryStatusTransitionError('DECLINED', 'APPROVED', 'host') || '',
    /Closed inquiries/,
  );
});

test('getPaymentStateTransitionError allows unlocking payment after approval', () => {
  assert.equal(getPaymentStateTransitionError('APPROVED', 'UNPAID', 'INITIATED', 'host'), null);
  assert.equal(getPaymentStateTransitionError('APPROVED', 'INITIATED', 'COMPLETED', 'guest'), null);
});

test('getPaymentStateTransitionError rejects payment unlock before approval', () => {
  assert.match(
    getPaymentStateTransitionError('PENDING', 'UNPAID', 'INITIATED', 'host') || '',
    /after the host approves/,
  );
});

test('getPaymentProofSubmissionError only allows payment-step bookings', () => {
  assert.equal(getPaymentProofSubmissionError('APPROVED', 'INITIATED'), null);
  assert.match(
    getPaymentProofSubmissionError('PENDING', 'UNPAID') || '',
    /only available after approval/,
  );
  assert.match(
    getPaymentProofSubmissionError('APPROVED', 'UNPAID') || '',
    /only available after approval/,
  );
});
