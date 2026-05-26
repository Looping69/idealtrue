import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_ENCORE_API_URL } from '../src/lib/encore-client';
import { getBookingOpsSummary } from '../src/lib/platform-client';

let fetchCalls: Array<{ url: string; init?: RequestInit }> = [];

function createJsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

test('booking ops summary client calls the canonical booking endpoint', async () => {
  fetchCalls = [];
  Object.defineProperty(globalThis, 'fetch', {
    value: async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      fetchCalls.push({ url, init });
      return createJsonResponse({
        summary: {
          inquiryId: 'booking-approved-awaiting-payment',
          lastActor: 'host',
          lastEvent: 'STATUS_CHANGED',
          lastEventAt: '2026-04-24T07:30:00.000Z',
          activeDeadlineKind: 'GUEST_PAYMENT',
          activeDeadlineAt: '2026-04-25T07:30:00.000Z',
          openDisputeCount: 1,
        },
      });
    },
    configurable: true,
    writable: true,
  });

  const summary = await getBookingOpsSummary('booking-approved-awaiting-payment');

  assert.equal(summary.inquiryId, 'booking-approved-awaiting-payment');
  assert.equal(summary.lastActor, 'host');
  assert.equal(summary.activeDeadlineKind, 'GUEST_PAYMENT');
  assert.equal(summary.openDisputeCount, 1);
  assert.equal(fetchCalls[0]?.url, `${DEFAULT_ENCORE_API_URL}/bookings/booking-approved-awaiting-payment/ops-summary`);
  assert.equal(fetchCalls[0]?.init?.method ?? 'GET', 'GET');
});
