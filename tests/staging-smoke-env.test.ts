import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

const scriptPath = path.join(process.cwd(), "scripts", "check-staging-smoke-env.mjs");

function runWithEnv(overrides = {}) {
  return spawnSync(process.execPath, [scriptPath], {
    env: {
      ...process.env,
      ENCORE_API_URL: "https://staging-ideal-stay-online-gh5i.encr.app",
      IDEAL_STAY_API_URL: "https://staging-ideal-stay-online-gh5i.encr.app",
      IDEAL_STAY_ALLOW_REMOTE_SEED: "true",
      IDEAL_STAY_SEED_ADMIN_EMAIL: "admin@example.com",
      IDEAL_STAY_SEED_ADMIN_PASSWORD: "admin-password",
      IDEAL_STAY_DEMO_PASSWORD: "IdealStayDemo123!",
      IDEAL_STAY_SMOKE_BASE_URL: "https://idealstay.example.com",
      IDEAL_STAY_SMOKE_GUEST_EMAIL: "guest.nomusa@idealstay.demo",
      IDEAL_STAY_SMOKE_GUEST_PASSWORD: "IdealStayDemo123!",
      IDEAL_STAY_SMOKE_HOST_EMAIL: "thandi.mokoena@idealstay.demo",
      IDEAL_STAY_SMOKE_HOST_PASSWORD: "IdealStayDemo123!",
      IDEAL_STAY_SMOKE_ADMIN_EMAIL: "admin@example.com",
      IDEAL_STAY_SMOKE_ADMIN_PASSWORD: "admin-password",
      ...overrides,
    },
    encoding: "utf8",
  });
}

test("staging smoke env check passes with aligned workflow values", () => {
  const result = runWithEnv();

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Staging smoke environment check passed\./);
});

test("staging smoke env check fails when remote seeding is disabled", () => {
  const result = runWithEnv({ IDEAL_STAY_ALLOW_REMOTE_SEED: "false" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /IDEAL_STAY_ALLOW_REMOTE_SEED must be true/);
});

test("staging smoke env check fails when smoke accounts drift from seeded identities", () => {
  const result = runWithEnv({ IDEAL_STAY_SMOKE_HOST_EMAIL: "different-host@example.com" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /IDEAL_STAY_SMOKE_HOST_EMAIL must stay aligned/);
});
