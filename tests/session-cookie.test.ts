import assert from 'node:assert/strict';
import test from 'node:test';

import {
  allowsStagingEncoreBackend,
  getSessionTokenFromCookieHeader,
  parseCookies,
  resolveEncoreApiUrl,
  sanitizeSessionPayload,
  shouldPersistSessionToken,
} from '../lib/server/session-cookie.js';

test('production-like env blocks staging Encore hosts by default', () => {
  assert.throws(
    () =>
      resolveEncoreApiUrl({
        ENCORE_API_URL: 'https://staging-ideal-stay-online-gh5i.encr.app',
        NODE_ENV: 'production',
      }),
    /staging Encore backend/,
  );
});

test('explicit override allows staging Encore hosts in production-like environments', () => {
  assert.equal(
    resolveEncoreApiUrl({
      ENCORE_API_URL: 'https://staging-ideal-stay-online-gh5i.encr.app/',
      NODE_ENV: 'production',
      ALLOW_STAGING_ENCORE_BACKEND: 'true',
    }),
    'https://staging-ideal-stay-online-gh5i.encr.app',
  );
});

test('staging Encore override accepts common truthy values only', () => {
  assert.equal(allowsStagingEncoreBackend({ ALLOW_STAGING_ENCORE_BACKEND: 'yes' }), true);
  assert.equal(allowsStagingEncoreBackend({ ALLOW_STAGING_ENCORE_BACKEND: '1' }), true);
  assert.equal(allowsStagingEncoreBackend({ ALLOW_STAGING_ENCORE_BACKEND: 'false' }), false);
});

test('parseCookies tolerates malformed cookie encoding without breaking the whole header', () => {
  const cookies = parseCookies('broken=%E0%A4%A; idealstay_session=valid-token; theme=dark');

  assert.equal(cookies.broken, '%E0%A4%A');
  assert.equal(cookies.idealstay_session, 'valid-token');
  assert.equal(cookies.theme, 'dark');
});

test('getSessionTokenFromCookieHeader still returns the session token when another cookie is malformed', () => {
  assert.equal(
    getSessionTokenFromCookieHeader('tracking=%E0%A4%A; idealstay_session=session-token-123'),
    'session-token-123',
  );
});

test('auth responses persist tokens only for the expected session-bearing paths', () => {
  assert.equal(shouldPersistSessionToken('/auth/login', { token: 'abc' }), true);
  assert.equal(shouldPersistSessionToken('/auth/session', { token: 'abc' }), true);
  assert.equal(shouldPersistSessionToken('/auth/request-password-reset', { token: 'abc' }), false);
  assert.equal(shouldPersistSessionToken('/auth/login', { token: '' }), false);
});

test('sanitizeSessionPayload removes the raw token from persisted auth responses', () => {
  assert.deepEqual(
    sanitizeSessionPayload('/auth/signup', {
      token: 'secret-token',
      user: { id: 'user-1' },
      verificationEmailStatus: 'sent',
    }),
    {
      user: { id: 'user-1' },
      verificationEmailStatus: 'sent',
    },
  );

  assert.deepEqual(
    sanitizeSessionPayload('/auth/request-password-reset', {
      token: 'secret-token',
      ok: true,
    }),
    {
      token: 'secret-token',
      ok: true,
    },
  );
});
