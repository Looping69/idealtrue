import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const hostBookingActionsPath = path.join(process.cwd(), 'src', 'hooks', 'use-host-booking-actions.ts');

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('host booking actions keep readable platform error handling wired in', () => {
  assert.equal(existsSync(hostBookingActionsPath), true, 'host booking actions hook is missing');

  const source = readFileSync(hostBookingActionsPath, 'utf8');

  for (const snippet of [
    "import { extractPlatformErrorMessage } from '@/lib/platform-errors';",
    "toast.error(extractPlatformErrorMessage(error, 'Failed to approve inquiry.'));",
    "toast.error(extractPlatformErrorMessage(error, 'Failed to decline inquiry.'));",
    "toast.error(extractPlatformErrorMessage(error, 'Failed to confirm payment.'));",
    "toast.error(extractPlatformErrorMessage(error, 'Failed to open the guest conversation.'));",
  ]) {
    assert.match(source, new RegExp(escapeRegExp(snippet)));
  }
});
