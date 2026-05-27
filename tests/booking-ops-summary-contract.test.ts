import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const bookingApiPath = path.join(process.cwd(), "encore", "booking", "api.ts");
const domainPath = path.join(process.cwd(), "encore", "shared", "domain.ts");

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("booking API keeps the booking ops summary endpoint", () => {
  assert.equal(existsSync(bookingApiPath), true, "booking API file is missing");

  const source = readFileSync(bookingApiPath, "utf8");

  for (const snippet of [
    'path: "/bookings/:id/ops-summary"',
    'buildBookingOpsSummary',
    'listInquiryLedgerRows',
    'activeDeadlineKind',
    'openDisputeCount',
  ]) {
    assert.match(source, new RegExp(escapeRegExp(snippet)));
  }
});

test("shared domain exposes booking ops summary types", () => {
  assert.equal(existsSync(domainPath), true, "shared domain file is missing");

  const source = readFileSync(domainPath, "utf8");

  for (const snippet of [
    'export type BookingOpsDeadlineKind',
    'export interface BookingOpsSummaryRecord',
    'lastActor',
    'lastEvent',
    'lastEventAt',
    'activeDeadlineAt',
    'openDisputeCount',
  ]) {
    assert.match(source, new RegExp(escapeRegExp(snippet)));
  }
});
