import { createHash } from "node:crypto";
import { Subscription } from "encore.dev/pubsub";
import { platformEvents } from "../analytics/events";
import { messagingDB } from "./db";

type InquiryEventPayload = {
  listingId: string;
  listingTitle: string;
  guestId: string;
  hostId: string;
  inquiryState: "PENDING" | "VIEWED" | "RESPONDED" | "APPROVED" | "DECLINED" | "EXPIRED" | "BOOKED";
  paymentState: "UNPAID" | "INITIATED" | "COMPLETED" | "FAILED";
  paymentSubmittedAt?: string | null;
  declineReason?: "DATES_UNAVAILABLE" | "GUEST_COUNT_NOT_SUPPORTED" | "BOOKING_REQUIREMENTS_NOT_MET" | "HOST_UNAVAILABLE" | "OTHER" | null;
  declineReasonNote?: string | null;
  actor: "host" | "system" | "guest";
};

type SystemMessageInput = {
  bookingId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  dedupeKey: string;
};

function buildSystemMessageId(bookingId: string, dedupeKey: string) {
  return createHash("sha256").update(`${bookingId}:${dedupeKey}`).digest("hex");
}

function formatDeclineDetail(payload: InquiryEventPayload) {
  const note = payload.declineReasonNote?.trim();
  if (note) {
    return note.replace(/[.!\s]+$/, "");
  }

  switch (payload.declineReason) {
    case "DATES_UNAVAILABLE":
      return "the dates are no longer available";
    case "GUEST_COUNT_NOT_SUPPORTED":
      return "the guest count does not fit the property";
    case "BOOKING_REQUIREMENTS_NOT_MET":
      return "the booking requirements were not met";
    case "HOST_UNAVAILABLE":
      return "the host is unavailable";
    case "OTHER":
      return "the host could not accept the enquiry";
    default:
      return null;
  }
}

function buildWorkflowSystemMessage(
  eventType: string,
  bookingId: string,
  occurredAt: string,
  payload: InquiryEventPayload,
): SystemMessageInput | null {
  switch (eventType) {
    case "inquiry.created":
      return {
        bookingId,
        senderId: payload.guestId,
        receiverId: payload.hostId,
        text: "Booking request created. The host can now review the enquiry and reply here.",
        createdAt: occurredAt,
        dedupeKey: `${eventType}:${occurredAt}`,
      };
    case "inquiry.status_changed":
      switch (payload.inquiryState) {
        case "APPROVED":
          return {
            bookingId,
            senderId: payload.hostId,
            receiverId: payload.guestId,
            text: "Inquiry approved. Payment is now unlocked. The guest should pay and submit proof before the approval hold expires.",
            createdAt: occurredAt,
            dedupeKey: `${eventType}:${payload.inquiryState}:${occurredAt}`,
          };
        case "DECLINED": {
          const detail = formatDeclineDetail(payload);
          return {
            bookingId,
            senderId: payload.hostId,
            receiverId: payload.guestId,
            text: detail
              ? `Inquiry declined: ${detail}.`
              : "Inquiry declined.",
            createdAt: occurredAt,
            dedupeKey: `${eventType}:${payload.inquiryState}:${occurredAt}`,
          };
        }
        case "EXPIRED":
          return {
            bookingId,
            senderId: payload.hostId,
            receiverId: payload.guestId,
            text: "Inquiry expired. Any approval hold on these dates has now been released.",
            createdAt: occurredAt,
            dedupeKey: `${eventType}:${payload.inquiryState}:${occurredAt}`,
          };
        default:
          return null;
      }
    case "inquiry.payment_submitted":
      return {
        bookingId,
        senderId: payload.guestId,
        receiverId: payload.hostId,
        text: "Payment proof submitted. The host still needs to verify it before the stay becomes booked.",
        createdAt: occurredAt,
        dedupeKey: `${eventType}:${occurredAt}`,
      };
    case "inquiry.payment_changed":
      if (payload.paymentState === "COMPLETED") {
        return {
          bookingId,
          senderId: payload.hostId,
          receiverId: payload.guestId,
          text: "Payment confirmed. The stay is now booked.",
          createdAt: occurredAt,
          dedupeKey: `${eventType}:${payload.paymentState}:${occurredAt}`,
        };
      }

      if (payload.paymentState === "FAILED") {
        return {
          bookingId,
          senderId: payload.hostId,
          receiverId: payload.guestId,
          text: "Payment could not be confirmed. A new proof submission is required before the stay can be booked.",
          createdAt: occurredAt,
          dedupeKey: `${eventType}:${payload.paymentState}:${occurredAt}`,
        };
      }

      return null;
    default:
      return null;
  }
}

async function insertSystemMessage(input: SystemMessageInput) {
  const id = buildSystemMessageId(input.bookingId, input.dedupeKey);

  await messagingDB.exec`
    INSERT INTO messages (id, booking_id, sender_id, receiver_id, text, is_system, created_at)
    VALUES (${id}, ${input.bookingId}, ${input.senderId}, ${input.receiverId}, ${input.text}, ${true}, ${input.createdAt})
    ON CONFLICT (id) DO NOTHING
  `;
}

export const inquiryMessageProjection = new Subscription(
  platformEvents,
  "inquiry-message-projection",
  {
    handler: async (event) => {
      if (!event.type.startsWith("inquiry.")) {
        return;
      }

      const payload = JSON.parse(event.payload) as InquiryEventPayload;
      const message = buildWorkflowSystemMessage(
        event.type,
        event.aggregateId,
        event.occurredAt,
        payload,
      );

      if (!message) {
        return;
      }

      await insertSystemMessage(message);
    },
  },
);
