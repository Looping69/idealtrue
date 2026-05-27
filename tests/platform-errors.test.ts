import assert from 'node:assert/strict';
import test from 'node:test';

import { extractPlatformErrorMessage } from '../src/lib/platform-errors';

test('extractPlatformErrorMessage returns plain error text unchanged', () => {
  assert.equal(
    extractPlatformErrorMessage(new Error('Resolve the open payment dispute before confirming payment.'), 'Fallback message.'),
    'Resolve the open payment dispute before confirming payment.',
  );
});

test('extractPlatformErrorMessage pulls nested API messages out of serialized payloads', () => {
  assert.equal(
    extractPlatformErrorMessage(
      new Error('500 Internal Server Error {"message":"Payment proof is stored but not currently accessible."}'),
      'Fallback message.',
    ),
    'Payment proof is stored but not currently accessible.',
  );

  assert.equal(
    extractPlatformErrorMessage(
      new Error('{"message":"Host billing access must be active before you can manage bookings."}'),
      'Fallback message.',
    ),
    'Host billing access must be active before you can manage bookings.',
  );
});

test('extractPlatformErrorMessage falls back when the input is not a useful Error', () => {
  assert.equal(extractPlatformErrorMessage(null, 'Fallback message.'), 'Fallback message.');
  assert.equal(extractPlatformErrorMessage(new Error('   '), 'Fallback message.'), 'Fallback message.');
});
