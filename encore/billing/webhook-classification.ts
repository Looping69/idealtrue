export type BillingWebhookOutcome = "paid" | "failed" | "cancelled" | "ignored";

function normalizeYocoValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function classifyYocoWebhookOutcome(eventType?: string | null, payloadStatus?: string | null): BillingWebhookOutcome {
  const normalizedEventType = normalizeYocoValue(eventType);
  const normalizedPayloadStatus = normalizeYocoValue(payloadStatus);

  if (
    normalizedEventType === "payment.succeeded" ||
    normalizedEventType.includes("succeed") ||
    normalizedEventType.includes("success") ||
    normalizedPayloadStatus === "succeeded" ||
    normalizedPayloadStatus === "successful" ||
    normalizedPayloadStatus === "paid"
  ) {
    return "paid";
  }

  if (normalizedEventType.includes("fail") || normalizedPayloadStatus === "failed") {
    return "failed";
  }

  if (normalizedEventType.includes("cancel") || normalizedPayloadStatus === "cancelled") {
    return "cancelled";
  }

  return "ignored";
}
