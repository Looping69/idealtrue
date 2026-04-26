import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getContentCreditPrice,
  resolveContentDraftDebit,
} from '../encore/billing/content-entitlements.ts';

test('content credit packs only price supported top-up sizes', () => {
  assert.equal(getContentCreditPrice(10), 120);
  assert.equal(getContentCreditPrice(25), 300);
  assert.equal(getContentCreditPrice(50), 600);
  assert.equal(getContentCreditPrice(1), null);
  assert.equal(getContentCreditPrice(100), null);
});

test('content draft debit uses included allowance before paid credits', () => {
  const decision = resolveContentDraftDebit({
    contentStudioEnabled: true,
    remainingIncludedDrafts: 2,
    creditBalance: 4,
  });

  assert.deepEqual(decision, { allowed: true, source: 'included' });
});

test('content draft debit falls back to credits after included usage is exhausted', () => {
  const decision = resolveContentDraftDebit({
    contentStudioEnabled: true,
    remainingIncludedDrafts: 0,
    creditBalance: 1,
  });

  assert.deepEqual(decision, { allowed: true, source: 'credit' });
});

test('content draft debit rejects disabled studio access and empty wallets', () => {
  assert.deepEqual(
    resolveContentDraftDebit({
      contentStudioEnabled: false,
      remainingIncludedDrafts: 20,
      creditBalance: 20,
    }),
    { allowed: false, reason: 'studio_disabled' },
  );

  assert.deepEqual(
    resolveContentDraftDebit({
      contentStudioEnabled: true,
      remainingIncludedDrafts: 0,
      creditBalance: 0,
    }),
    { allowed: false, reason: 'insufficient_credits' },
  );
});
