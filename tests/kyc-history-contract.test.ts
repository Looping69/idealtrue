import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const opsApiPath = path.join(process.cwd(), "encore", "ops", "api.ts");
const readmePath = path.join(process.cwd(), "README.md");

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("KYC ops API keeps audit-backed history endpoints and actions", () => {
  assert.equal(existsSync(opsApiPath), true, "ops API file is missing");

  const source = readFileSync(opsApiPath, "utf8");

  for (const snippet of [
    'path: "/ops/kyc/submissions/me/history"',
    'path: "/ops/kyc/submissions/:userId/history"',
    'kyc.submission.created',
    'kyc.submission.resubmitted',
    'kyc.submission.reviewed',
    'FROM audit_log',
    'target_id = $1',
  ]) {
    assert.match(source, new RegExp(escapeRegExp(snippet)));
  }
});

test("README documents KYC audit-backed history and remaining ops gap", () => {
  assert.equal(existsSync(readmePath), true, "README is missing");

  const readme = readFileSync(readmePath, "utf8");

  assert.match(readme, /audit-backed submission\/review history/i);
  assert.match(readme, /disputes and richer ops case management are still missing/i);
});
