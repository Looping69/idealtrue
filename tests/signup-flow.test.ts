import assert from 'node:assert/strict';
import test from 'node:test';
import type { UserProfile } from '../encore/shared/domain';
import { finalizeSignupSession } from '../encore/identity/signup-flow';

const baseUser: UserProfile = {
  id: 'user-1',
  email: 'new-user@example.com',
  emailVerified: false,
  displayName: 'New User',
  photoUrl: null,
  role: 'guest',
  isAdmin: false,
  hostPlan: 'standard',
  kycStatus: 'none',
  accountStatus: 'active',
  accountStatusReason: null,
  accountStatusChangedAt: null,
  accountStatusChangedBy: null,
  balance: 0,
  referralCount: 0,
  tier: 'bronze',
  referralCode: 'NEWUSER123',
  referredByCode: null,
  paymentMethod: null,
  paymentInstructions: null,
  paymentReferencePrefix: null,
  createdAt: '2026-05-08T08:00:00.000Z',
  updatedAt: '2026-05-08T08:00:00.000Z',
};

test('finalizeSignupSession still returns a session when verification email delivery fails', async () => {
  const failures: Error[] = [];

  const response = await finalizeSignupSession({
    user: baseUser,
    issueSession: (user) => ({ token: 'session-token-1', user }),
    sendVerificationEmail: async () => {
      throw new Error('mail transport offline');
    },
    onEmailFailure: (error) => {
      failures.push(error instanceof Error ? error : new Error(String(error)));
    },
  });

  assert.equal(response.user.id, baseUser.id);
  assert.equal(response.token, 'session-token-1');
  assert.equal(response.verificationEmailStatus, 'failed');
  assert.equal(failures.length, 1);
  assert.match(failures[0]?.message ?? '', /mail transport offline/);
});

test('finalizeSignupSession reports a sent verification email when delivery succeeds', async () => {
  const response = await finalizeSignupSession({
    user: baseUser,
    issueSession: (user) => ({ token: 'session-token-2', user }),
    sendVerificationEmail: async () => undefined,
  });

  assert.equal(response.user.id, baseUser.id);
  assert.equal(response.token, 'session-token-2');
  assert.equal(response.verificationEmailStatus, 'sent');
});
