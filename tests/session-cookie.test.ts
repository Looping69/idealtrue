import assert from 'node:assert/strict';
import test from 'node:test';

import {
  allowsStagingEncoreBackend,
  resolveEncoreApiUrl,
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
