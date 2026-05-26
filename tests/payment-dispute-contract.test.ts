import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const bookingApiPath = path.join(process.cwd(), "encore", "booking", "api.ts");
const domainPath = path.join(process.cwd(), "encore", "shared", "domain.ts");

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("booking API keeps payment dispute endpoints and ledger events", () => {
  assert.equal(existsSync(bookingApiPath), true, "booking API file is missing");

  const source = readFileSync(bookingApiPath, "utf8");

  for (const snippet of [
    'path: "/bookings/:id/disputes"',
    'path: "/bookings/:id/disputes/resolve"',
    'DISPUTE_OPENED',
    'DISPUTE_RESOLVED',
    'PAYMENT_REJECTED',
    'listPaymentDisputesForInquiry',
    'getOpenPaymentDispute',
  ]) {
    assert.match(source, new RegExp(escapeRegExp(snippet)));
  }
});

test("shared domain exposes payment dispute record types", () => {
  assert.equal(existsSync(domainPath), true, "shared domain file is missing");

  const source = readFileSync(domainPath, "utf8");

  for (const snippet of [
    'export type PaymentDisputeResolution',
    'export interface PaymentDisputeRecord',
    'DISPUTE_OPENED',
    'DISPUTE_RESOLVED',
  ]) {
    assert.match(source, new RegExp(escapeRegExp(snippet)));
  }
});
