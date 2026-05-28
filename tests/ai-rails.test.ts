import assert from "node:assert/strict";
import test from "node:test";

import {
  AiRequestError,
  enforceAiRateLimit,
  getClientIp,
  validateReviewSummaryInput,
  validateSocialCreativeInput,
  validateTripPlannerMessages,
} from "../lib/server/ai-rails.js";

test("validateTripPlannerMessages trims and caps the visible chat history", () => {
  const messages = validateTripPlannerMessages(
    Array.from({ length: 14 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      content: ` message ${index} `,
    })),
  );

  assert.equal(messages.length, 12);
  assert.equal(messages[0]?.content, "message 2");
  assert.equal(messages.at(-1)?.content, "message 13");
});

test("validateTripPlannerMessages truncates oversized turns instead of failing", () => {
  const oversized = "x".repeat(700);
  const messages = validateTripPlannerMessages([
    { role: "user", content: oversized },
    { role: "assistant", content: oversized },
  ]);

  assert.equal(messages.length, 2);
  assert.equal(messages[0]?.content.length, 600);
  assert.equal(messages[1]?.content.length, 600);
});

test("validateTripPlannerMessages can accept truncated turns when total history stays under the guard", () => {
  const oversized = "x".repeat(700);
  const messages = validateTripPlannerMessages(
    Array.from({ length: 6 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      content: oversized,
    })),
  );

  assert.equal(messages.length, 6);
  assert.equal(messages[0]?.content.length, 600);
  assert.equal(messages[5]?.content.length, 600);
});

test("validateTripPlannerMessages still rejects total history above 4000 characters", () => {
  assert.throws(
    () =>
      validateTripPlannerMessages(
        Array.from({ length: 8 }, (_, index) => ({
          role: index % 2 === 0 ? "user" : "assistant",
          content: "x".repeat(550),
        })),
      ),
    (error: unknown) =>
      error instanceof AiRequestError &&
      error.statusCode === 400 &&
      /context is too large/i.test(error.message),
  );
});

test("validateReviewSummaryInput rejects invalid score ranges", () => {
  assert.throws(
    () =>
      validateReviewSummaryInput([
        {
          cleanliness: 9,
          accuracy: 5,
          communication: 5,
          location: 5,
          value: 5,
          comment: "Too good to be true",
        },
      ]),
    (error: unknown) =>
      error instanceof AiRequestError &&
      error.statusCode === 400 &&
      /cleanliness/i.test(error.message),
  );
});

test("validateSocialCreativeInput accepts supported payloads and trims the brief", () => {
  const payload = validateSocialCreativeInput({
    listingId: "listing-123",
    sourceImageUrl: "https://cdn.example.com/image.jpg",
    platform: "instagram",
    tone: "luxurious",
    templateId: "featured_stay",
    includePrice: true,
    includeSpecialOffer: false,
    customHeadline: "  Stay at Villa del Sol  ",
    brief: "  Premium launch creative  ",
  });

  assert.equal(payload.listingId, "listing-123");
  assert.equal(payload.templateId, "featured_stay");
  assert.equal(payload.customHeadline, "Stay at Villa del Sol");
  assert.equal(payload.brief, "Premium launch creative");
});

test("getClientIp prefers Cloudflare and real-ip headers over forwarded chains", () => {
  assert.equal(
    getClientIp({
      "cf-connecting-ip": "198.51.100.42",
      "x-forwarded-for": "198.51.100.10, 10.0.0.2",
      "x-real-ip": "203.0.113.7",
    }),
    "198.51.100.42",
  );

  assert.equal(
    getClientIp({
      "x-forwarded-for": "198.51.100.10, 10.0.0.2",
      "x-real-ip": "203.0.113.7",
    }),
    "203.0.113.7",
  );
});

// (|/) Klaasvaakie - invalid IP-like header values should not create unique rate-limit buckets.
test("getClientIp ignores invalid spoof-like values", () => {
  assert.equal(
    getClientIp({
      "x-forwarded-for": "not-an-ip, also-bad",
      "x-real-ip": "definitely-not-ip",
    }),
    "",
  );

  assert.equal(
    getClientIp({
      "x-forwarded-for": "198.51.100.10, not-an-ip",
    }),
    "198.51.100.10",
  );
});

test("enforceAiRateLimit blocks callers that exceed the endpoint window", () => {
  const actor = { rateKey: "user:test-user", rateTier: "user" as const };
  const now = Date.now();

  for (let index = 0; index < 10; index += 1) {
    enforceAiRateLimit("tripPlanner", actor, now + index);
  }

  assert.throws(
    () => enforceAiRateLimit("tripPlanner", actor, now + 11),
    (error: unknown) =>
      error instanceof AiRequestError &&
      error.statusCode === 429 &&
      /Too many tripPlanner AI requests/i.test(error.message),
  );
});
