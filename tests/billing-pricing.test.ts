import assert from 'node:assert/strict';
import test from 'node:test';

import { toMinorUnits } from '../encore/billing/pricing.ts';

test('toMinorUnits converts rand values to cents for provider checkouts', () => {
  assert.equal(toMinorUnits(350), 35000);
  assert.equal(toMinorUnits(149), 14900);
  assert.equal(toMinorUnits(399.99), 39999);
});

test('toMinorUnits rejects invalid input', () => {
  assert.throws(() => toMinorUnits(-1), /non-negative finite number/);
  assert.throws(() => toMinorUnits(Number.NaN), /non-negative finite number/);
});
