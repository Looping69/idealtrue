import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_ENCORE_API_URL } from '../src/lib/encore-client';
import {
  listPaymentDisputes,
  openPaymentDispute,
  resolvePaymentDispute,
} from '../src/lib/platform-client';

let fetchCalls: Array<{ url: string; init?: RequestInit }> = [];

function createJsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

test('payment dispute clients call the canonical booking dispute endpoints', async () => {
  fetchCalls = [];
  Object.defineProperty(globalThis, 'fetch', {
    value: async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      fetchCalls.push({ url, init });

      if (url.endsWith('/bookings/booking-approved-awaiting-payment/disputes') && (!init?.method || init.method === 'GET')) {
        return createJsonResponse({
          disputes: [
            {
              id: 'dispute-open-1',
              inquiryId: 'booking-approved-awaiting-payment',
              status: 'OPEN',
              openedBy: 'guest',
              openedByUserId: 'user-guest-verified',
              reason: 'Payment was sent but not acknowledged yet.',
              details: 'Bank transfer reference attached in chat.',
              resolution: null,
              resolutionNote: null,
              resolvedBy: null,
              resolvedByUserId: null,
              createdAt: '2026-04-24T08:05:00.000Z',
              resolvedAt: null,
            },
          ],
        });
      }

      if (url.endsWith('/bookings/booking-approved-awaiting-payment/disputes') && init?.method === 'POST') {
        return createJsonResponse({
          dispute: {
            id: 'dispute-open-2',
            inquiryId: 'booking-approved-awaiting-payment',
            status: 'OPEN',
            openedBy: 'host',
            openedByUserId: 'user-host-verified',
            reason: 'Reference does not match the expected amount.',
            details: 'Need updated proof from the guest.',
            resolution: null,
            resolutionNote: null,
            resolvedBy: null,
            resolvedByUserId: null,
            createdAt: '2026-04-24T08:10:00.000Z',
            resolvedAt: null,
          },
        });
      }

      if (url.endsWith('/bookings/booking-approved-awaiting-payment/disputes/resolve') && init?.method === 'POST') {
        return createJsonResponse({
          dispute: {
            id: 'dispute-open-2',
            inquiryId: 'booking-approved-awaiting-payment',
            status: 'RESOLVED',
            openedBy: 'host',
            openedByUserId: 'user-host-verified',
            reason: 'Reference does not match the expected amount.',
            details: 'Need updated proof from the guest.',
            resolution: 'PAYMENT_REJECTED',
            resolutionNote: 'Guest will resend proof with corrected reference.',
            resolvedBy: 'admin',
            resolvedByUserId: 'user-admin',
            createdAt: '2026-04-24T08:10:00.000Z',
            resolvedAt: '2026-04-24T08:20:00.000Z',
          },
          booking: {
            id: 'booking-approved-awaiting-payment',
            listingId: 'listing-active-cape-town',
            guestId: 'user-guest-verified',
            hostId: 'user-host-verified',
            checkIn: '2026-05-05T00:00:00.000Z',
            checkOut: '2026-05-08T00:00:00.000Z',
            adults: 1,
            children: 0,
            totalPrice: 4860,
            breakageDeposit: 750,
            inquiryState: 'APPROVED',
            paymentState: 'FAILED',
            paymentMethod: 'bank_transfer',
            paymentInstructions: 'Pay within 24 hours.',
            paymentReference: 'HOST-booking-approved-awaiting-payment',
            paymentProofAccessible: false,
            paymentProofAccessUrl: null,
            declineReason: null,
            declineReasonNote: null,
            viewedAt: '2026-04-24T07:10:00.000Z',
            respondedAt: '2026-04-24T07:20:00.000Z',
            paymentUnlockedAt: '2026-04-24T07:30:00.000Z',
            paymentSubmittedAt: '2026-04-24T07:45:00.000Z',
            paymentConfirmedAt: null,
            expiresAt: '2026-04-25T07:30:00.000Z',
            bookedAt: null,
            createdAt: '2026-04-24T07:00:00.000Z',
            updatedAt: '2026-04-24T08:20:00.000Z',
          },
        });
      }

      throw new Error(`Unhandled dispute endpoint: ${url}`);
    },
    configurable: true,
    writable: true,
  });

  const disputes = await listPaymentDisputes('booking-approved-awaiting-payment');
  const opened = await openPaymentDispute({
    id: 'booking-approved-awaiting-payment',
    reason: 'Reference does not match the expected amount.',
    details: 'Need updated proof from the guest.',
  });
  const resolved = await resolvePaymentDispute({
    id: 'booking-approved-awaiting-payment',
    resolution: 'PAYMENT_REJECTED',
    resolutionNote: 'Guest will resend proof with corrected reference.',
  });

  assert.equal(disputes.length, 1);
  assert.equal(disputes[0]?.status, 'OPEN');
  assert.equal(opened.openedBy, 'host');
  assert.equal(resolved.dispute.status, 'RESOLVED');
  assert.equal(resolved.booking.paymentState, 'FAILED');

  assert.equal(fetchCalls[0]?.url, `${DEFAULT_ENCORE_API_URL}/bookings/booking-approved-awaiting-payment/disputes`);
  assert.equal(fetchCalls[0]?.init?.method ?? 'GET', 'GET');
  assert.equal(fetchCalls[1]?.url, `${DEFAULT_ENCORE_API_URL}/bookings/booking-approved-awaiting-payment/disputes`);
  assert.equal(fetchCalls[1]?.init?.method, 'POST');
  assert.equal(fetchCalls[2]?.url, `${DEFAULT_ENCORE_API_URL}/bookings/booking-approved-awaiting-payment/disputes/resolve`);
  assert.equal(fetchCalls[2]?.init?.method, 'POST');

  assert.deepEqual(JSON.parse(String(fetchCalls[1]?.init?.body || '{}')), {
    reason: 'Reference does not match the expected amount.',
    details: 'Need updated proof from the guest.',
  });
  assert.deepEqual(JSON.parse(String(fetchCalls[2]?.init?.body || '{}')), {
    resolution: 'PAYMENT_REJECTED',
    resolutionNote: 'Guest will resend proof with corrected reference.',
  });
});
