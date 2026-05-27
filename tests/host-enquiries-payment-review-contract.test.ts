import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const hostEnquiriesPath = path.join(process.cwd(), 'src', 'pages', 'HostEnquiries.tsx');

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('host enquiries keeps the dispute-aware payment confirmation guard', () => {
  assert.equal(existsSync(hostEnquiriesPath), true, 'host enquiries page is missing');

  const source = readFileSync(hostEnquiriesPath, 'utf8');

  for (const snippet of [
    'const hasOpenPaymentDispute = (opsSummary?.openDisputeCount ?? 0) > 0;',
    'Confirmation is paused until the open payment dispute is resolved.',
    'disabled={isProcessingBookingId === booking.id || !booking.paymentProofAccessible || !booking.paymentProofAccessUrl || hasOpenPaymentDispute}',
  ]) {
    assert.match(source, new RegExp(escapeRegExp(snippet)));
  }
});
