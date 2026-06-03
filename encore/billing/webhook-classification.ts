export type BillingWebhookOutcome = "paid" | "failed" | "cancelled" | "ignored";

function normalizeYocoValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function classifyYocoWebhookOutcome(eventType?: string | null, payloadStatus?: string | null): BillingWebhookOutcome {
  const normalizedEventType = normalizeYocoValue(eventType);
  const normalizedPayloadStatus = normalizeYocoValue(payloadStatus);

  if (
    normalizedEventType === "payment.succeeded" ||
    normalizedEventType === "order.completed" ||
    normalizedEventType.includes("succeed") ||
    normalizedEventType.includes("success") ||
    normalizedPayloadStatus === "succeeded" ||
    normalizedPayloadStatus === "successful" ||
    normalizedPayloadStatus === "approved" ||
    normalizedPayloadStatus === "paid" ||
    normalizedPayloadStatus === "completed"
  ) {
    return "paid";
  }

  if (normalizedEventType.includes("fail") || normalizedEventType === "payment.refunded" || normalizedPayloadStatus === "failed") {
    return "failed";
  }

  if (normalizedEventType.includes("cancel") || normalizedEventType === "order.cancelled" || normalizedPayloadStatus === "cancelled") {
    return "cancelled";
  }

  return "ignored";
}
