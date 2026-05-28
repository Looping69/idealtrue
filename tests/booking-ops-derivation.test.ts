import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const bookingApiPath = path.join(process.cwd(), "encore", "booking", "api.ts");

function extractBookingOpsHelpersSource(source: string) {
  const startMarker = "function parseLedgerMetadata";
  const endMarker = "async function listInquiryLedgerRows";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);

  assert.notEqual(start, -1, `${startMarker} is missing from booking API`);
  assert.notEqual(end, -1, `${endMarker} is missing from booking API`);
  assert.ok(end > start, "booking ops helper block order changed unexpectedly");

  return source.slice(start, end).trim();
}

async function loadBookingOpsHelpers() {
  const source = readFileSync(bookingApiPath, "utf8");
  const helperBlock = extractBookingOpsHelpersSource(source);
  const tempDir = mkdtempSync(path.join(tmpdir(), "ideal-stay-booking-ops-"));
  const modulePath = path.join(tempDir, "booking-ops-helpers.ts");
  const moduleSource = `
type InquiryState = "PENDING" | "VIEWED" | "RESPONDED" | "APPROVED" | "DECLINED" | "EXPIRED" | "BOOKED";
type PaymentState = "UNPAID" | "INITIATED" | "FAILED" | "COMPLETED";
type InquiryActor = "guest" | "host" | "admin" | "support" | "system";
type InquiryEvent =
  | "INQUIRY_CREATED"
  | "STATUS_CHANGED"
  | "PAYMENT_CHANGED"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESOLVED";
type PaymentDisputeResolution =
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_REJECTED"
  | "REFUND_OUTSIDE_PLATFORM"
  | "OTHER";
type BookingOpsDeadlineKind = "NONE" | "HOST_RESPONSE" | "GUEST_PAYMENT";

interface BookingRow {
  id: string;
  inquiry_state: InquiryState;
  payment_state: PaymentState;
  expires_at: string | null;
  created_at: string;
}

interface InquiryLedgerRow {
  id: string;
  inquiry_id: string;
  event: InquiryEvent;
  from_state: string | null;
  to_state: string | null;
  actor: InquiryActor;
  metadata: string;
  created_at: string;
}

interface PaymentDisputeRecord {
  id: string;
  inquiryId: string;
  status: "OPEN" | "RESOLVED";
  openedBy: "guest" | "host" | "admin" | "support";
  openedByUserId: string;
  reason: string;
  details: string | null;
  resolution: PaymentDisputeResolution | null;
  resolutionNote: string | null;
  resolvedBy: "host" | "admin" | "support" | null;
  resolvedByUserId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

interface BookingOpsSummaryRecord {
  inquiryId: string;
  lastActor: InquiryActor;
  lastEvent: InquiryEvent;
  lastEventAt: string;
  activeDeadlineKind: BookingOpsDeadlineKind;
  activeDeadlineAt: string | null;
  openDisputeCount: number;
}

${helperBlock}

export { parseLedgerMetadata, buildDisputeRecordIndex, getOpenPaymentDispute, buildBookingOpsSummary };
`.trimStart();

  writeFileSync(modulePath, moduleSource, "utf8");

  try {
    return await import(pathToFileURL(modulePath).href);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

let bookingOpsHelpersPromise: Promise<Awaited<ReturnType<typeof loadBookingOpsHelpers>>> | null = null;

function getBookingOpsHelpers() {
  if (!bookingOpsHelpersPromise) {
    bookingOpsHelpersPromise = loadBookingOpsHelpers();
  }
  return bookingOpsHelpersPromise;
}

function ledgerRow(overrides: Record<string, unknown>) {
  return {
    id: "ledger-row",
    inquiry_id: "inquiry-1",
    event: "INQUIRY_CREATED",
    from_state: null,
    to_state: null,
    actor: "guest",
    metadata: "{}",
    created_at: "2026-05-01T09:00:00.000Z",
    ...overrides,
  };
}

test("booking ops helpers tolerate blank and invalid metadata", async () => {
  const { parseLedgerMetadata } = await getBookingOpsHelpers();

  assert.deepEqual(parseLedgerMetadata(null), {});
  assert.deepEqual(parseLedgerMetadata("{not-json"), {});
  assert.deepEqual(parseLedgerMetadata('{"reason":"Transfer delayed"}'), {
    reason: "Transfer delayed",
  });
});

test("booking ops helpers rebuild dispute history from inquiry ledger rows", async () => {
  const { buildDisputeRecordIndex, getOpenPaymentDispute } = await getBookingOpsHelpers();

  const disputes = buildDisputeRecordIndex([
    ledgerRow({
      id: "dispute-1",
      event: "DISPUTE_OPENED",
      actor: "guest",
      metadata: JSON.stringify({
        reason: "Guest provided proof but funds never landed.",
        details: "Bank trace still pending.",
        openedByUserId: "guest-1",
      }),
      created_at: "2026-05-02T10:00:00.000Z",
    }),
    ledgerRow({
      id: "dispute-1-resolution",
      event: "DISPUTE_RESOLVED",
      actor: "host",
      metadata: JSON.stringify({
        openedDisputeId: "dispute-1",
        resolution: "PAYMENT_CONFIRMED",
        resolutionNote: "Bank transfer arrived after reconciliation.",
        resolvedByUserId: "host-1",
      }),
      created_at: "2026-05-02T12:00:00.000Z",
    }),
    ledgerRow({
      id: "ignored-open",
      event: "DISPUTE_OPENED",
      actor: "guest",
      metadata: JSON.stringify({
        reason: "Missing opener should be ignored.",
      }),
      created_at: "2026-05-03T08:00:00.000Z",
    }),
    ledgerRow({
      id: "dispute-2",
      event: "DISPUTE_OPENED",
      actor: "guest",
      metadata: JSON.stringify({
        reason: "Host marked payment received before guest got confirmation.",
        details: "Need proof of release.",
        openedByUserId: "guest-2",
      }),
      created_at: "2026-05-03T09:00:00.000Z",
    }),
    ledgerRow({
      id: "ignored-resolution",
      event: "DISPUTE_RESOLVED",
      actor: "support",
      metadata: JSON.stringify({
        openedDisputeId: "dispute-2",
        resolution: "NOT_A_REAL_RESOLUTION",
        resolvedByUserId: "support-1",
      }),
      created_at: "2026-05-03T10:00:00.000Z",
    }),
    ledgerRow({
      id: "orphaned-resolution",
      event: "DISPUTE_RESOLVED",
      actor: "admin",
      metadata: JSON.stringify({
        openedDisputeId: "missing-dispute",
        resolution: "PAYMENT_REJECTED",
        resolvedByUserId: "admin-1",
      }),
      created_at: "2026-05-03T11:00:00.000Z",
    }),
  ]);

  assert.deepEqual(
    disputes.map((dispute: any) => ({
      id: dispute.id,
      status: dispute.status,
      openedBy: dispute.openedBy,
      resolution: dispute.resolution,
      resolvedBy: dispute.resolvedBy,
      resolvedByUserId: dispute.resolvedByUserId,
      resolvedAt: dispute.resolvedAt,
    })),
    [
      {
        id: "dispute-1",
        status: "RESOLVED",
        openedBy: "guest",
        resolution: "PAYMENT_CONFIRMED",
        resolvedBy: "host",
        resolvedByUserId: "host-1",
        resolvedAt: "2026-05-02T12:00:00.000Z",
      },
      {
        id: "dispute-2",
        status: "OPEN",
        openedBy: "guest",
        resolution: null,
        resolvedBy: null,
        resolvedByUserId: null,
        resolvedAt: null,
      },
    ],
  );

  assert.equal(getOpenPaymentDispute(disputes)?.id, "dispute-2");
});

test("booking ops summary derives deadlines, latest movement, and open dispute counts", async () => {
  const { buildBookingOpsSummary } = await getBookingOpsHelpers();

  const approvedSummary = buildBookingOpsSummary(
    {
      id: "inquiry-1",
      inquiry_state: "APPROVED",
      payment_state: "INITIATED",
      expires_at: "2026-05-04T18:00:00.000Z",
      created_at: "2026-05-01T09:00:00.000Z",
    },
    [
      ledgerRow({
        id: "created",
        event: "INQUIRY_CREATED",
        actor: "guest",
        created_at: "2026-05-01T09:00:00.000Z",
      }),
      ledgerRow({
        id: "approved",
        event: "STATUS_CHANGED",
        actor: "host",
        created_at: "2026-05-01T10:00:00.000Z",
      }),
      ledgerRow({
        id: "dispute-opened",
        event: "DISPUTE_OPENED",
        actor: "guest",
        created_at: "2026-05-01T11:00:00.000Z",
      }),
    ],
    [
      {
        id: "dispute-opened",
        inquiryId: "inquiry-1",
        status: "OPEN",
        openedBy: "guest",
        openedByUserId: "guest-1",
        reason: "Awaiting payment confirmation.",
        details: null,
        resolution: null,
        resolutionNote: null,
        resolvedBy: null,
        resolvedByUserId: null,
        createdAt: "2026-05-01T11:00:00.000Z",
        resolvedAt: null,
      },
      {
        id: "resolved-before",
        inquiryId: "inquiry-1",
        status: "RESOLVED",
        openedBy: "guest",
        openedByUserId: "guest-0",
        reason: "Prior dispute",
        details: null,
        resolution: "PAYMENT_CONFIRMED",
        resolutionNote: null,
        resolvedBy: "host",
        resolvedByUserId: "host-0",
        createdAt: "2026-04-30T11:00:00.000Z",
        resolvedAt: "2026-04-30T12:00:00.000Z",
      },
    ],
  );

  assert.deepEqual(approvedSummary, {
    inquiryId: "inquiry-1",
    lastActor: "guest",
    lastEvent: "DISPUTE_OPENED",
    lastEventAt: "2026-05-01T11:00:00.000Z",
    activeDeadlineKind: "GUEST_PAYMENT",
    activeDeadlineAt: "2026-05-04T18:00:00.000Z",
    openDisputeCount: 1,
  });

  const hostResponseSummary = buildBookingOpsSummary(
    {
      id: "inquiry-2",
      inquiry_state: "RESPONDED",
      payment_state: "UNPAID",
      expires_at: "2026-05-05T18:00:00.000Z",
      created_at: "2026-05-02T09:00:00.000Z",
    },
    [],
    [],
  );

  assert.equal(hostResponseSummary.activeDeadlineKind, "HOST_RESPONSE");
  assert.equal(hostResponseSummary.activeDeadlineAt, "2026-05-05T18:00:00.000Z");
  assert.equal(hostResponseSummary.lastActor, "guest");
  assert.equal(hostResponseSummary.lastEvent, "INQUIRY_CREATED");
  assert.equal(hostResponseSummary.lastEventAt, "2026-05-02T09:00:00.000Z");

  const settledSummary = buildBookingOpsSummary(
    {
      id: "inquiry-3",
      inquiry_state: "BOOKED",
      payment_state: "COMPLETED",
      expires_at: null,
      created_at: "2026-05-03T09:00:00.000Z",
    },
    [
      ledgerRow({
        id: "booked",
        event: "PAYMENT_CHANGED",
        actor: "host",
        created_at: "2026-05-03T10:00:00.000Z",
      }),
    ],
    [],
  );

  assert.equal(settledSummary.activeDeadlineKind, "NONE");
  assert.equal(settledSummary.activeDeadlineAt, null);
  assert.equal(settledSummary.lastActor, "host");
  assert.equal(settledSummary.lastEvent, "PAYMENT_CHANGED");
});
