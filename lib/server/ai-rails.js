import { fetchEncoreJson } from "./encore-api.js";

const RATE_LIMIT_STORE_KEY = "__idealStayAiRateLimitStore";

const AI_RATE_LIMITS = {
  tripPlanner: {
    user: { limit: 10, windowMs: 10 * 60 * 1000 },
    guest: { limit: 4, windowMs: 10 * 60 * 1000 },
  },
  reviewSummary: {
    user: { limit: 16, windowMs: 10 * 60 * 1000 },
    guest: { limit: 6, windowMs: 10 * 60 * 1000 },
  },
  socialImage: {
    user: { limit: 3, windowMs: 30 * 60 * 1000 },
    guest: { limit: 0, windowMs: 30 * 60 * 1000 },
  },
};

export class AiRequestError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = "AiRequestError";
    this.statusCode = statusCode;
    this.retryAfterSec = options.retryAfterSec ?? null;
  }
}

function getRateLimitStore() {
  const globalStore = globalThis;
  if (!globalStore[RATE_LIMIT_STORE_KEY]) {
    globalStore[RATE_LIMIT_STORE_KEY] = new Map();
  }
  return globalStore[RATE_LIMIT_STORE_KEY];
}

function normalizeText(value, { maxLength, overflow = "throw" }) {
  const text = `${value || ""}`.replace(/\r/g, "").trim();
  if (!text) {
    return "";
  }
  if (text.length > maxLength) {
    if (overflow === "truncate") {
      return text.slice(0, maxLength);
    }
    throw new AiRequestError(400, `AI request text is too long. Max ${maxLength} characters.`);
  }
  return text;
}

function isValidIpCandidate(value) {
  const candidate = `${value || ""}`.trim();
  if (!candidate || candidate.length > 64) {
    return false;
  }

  const ipv4 =
    /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/.test(candidate);
  const ipv6 = /^[0-9a-fA-F:]+$/.test(candidate) && candidate.includes(":");
  return ipv4 || ipv6;
}

// (|/) Klaasvaakie - prefer trusted proxy headers and ignore spoof-like values.
export function getClientIp(headers = {}) {
  const cfIp = `${headers["cf-connecting-ip"] || ""}`.trim();
  if (isValidIpCandidate(cfIp)) {
    return cfIp;
  }

  const realIp = `${headers["x-real-ip"] || ""}`.trim();
  if (isValidIpCandidate(realIp)) {
    return realIp;
  }

  const forwarded = `${headers["x-forwarded-for"] || ""}`
    .split(",")
    .map((value) => value.trim())
    .find((value) => isValidIpCandidate(value));

  return forwarded || "";
}

export async function resolveAiActor({ headers = {}, cookieHeader, env = process.env, requireAuth = false }) {
  let user = null;

  if (cookieHeader) {
    try {
      const sessionPayload = await fetchEncoreJson("/auth/session", { env, cookieHeader });
      user = sessionPayload?.user ?? null;
    } catch {
      user = null;
    }
  }

  if (requireAuth && !user) {
    throw new AiRequestError(401, "You must be signed in to use this AI feature.");
  }

  const clientIp = getClientIp(headers);
  const rateKey = user?.id ? `user:${user.id}` : clientIp ? `ip:${clientIp}` : "ip:unknown";

  return {
    user,
    rateKey,
    rateTier: user?.id ? "user" : "guest",
  };
}

export function enforceAiRateLimit(scope, actor, now = Date.now()) {
  const scopePolicy = AI_RATE_LIMITS[scope];
  if (!scopePolicy) {
    throw new Error(`Unknown AI rate-limit scope "${scope}".`);
  }

  const policy = scopePolicy[actor.rateTier] || scopePolicy.guest;
  if (!policy || policy.limit < 1) {
    throw new AiRequestError(401, "You must be signed in to use this AI feature.");
  }

  const store = getRateLimitStore();
  const key = `${scope}:${actor.rateKey}`;
  const existing = store.get(key) ?? [];
  const active = existing.filter((timestamp) => now - timestamp < policy.windowMs);

  if (active.length >= policy.limit) {
    const retryAfterMs = Math.max(1, policy.windowMs - (now - active[0]));
    throw new AiRequestError(
      429,
      `Too many ${scope} AI requests. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds and try again.`,
      { retryAfterSec: Math.ceil(retryAfterMs / 1000) },
    );
  }

  active.push(now);
  store.set(key, active);
}

export function validateTripPlannerMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AiRequestError(400, "At least one trip-planner message is required.");
  }

  const trimmedMessages = messages
    .slice(-12)
    .map((message) => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      // (|/) Klaasvaakie - keep planner resilient by truncating oversized turns instead of failing the whole request.
      content: normalizeText(message?.content, { maxLength: 600, overflow: "truncate" }),
    }))
    .filter((message) => message.content);

  if (trimmedMessages.length === 0) {
    throw new AiRequestError(400, "At least one non-empty trip-planner message is required.");
  }

  const totalCharacters = trimmedMessages.reduce((sum, message) => sum + message.content.length, 0);
  if (totalCharacters > 4000) {
    throw new AiRequestError(400, "Trip-planner context is too large. Keep it under 4,000 characters.");
  }

  return trimmedMessages;
}

export function validateReviewSummaryInput(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    throw new AiRequestError(400, "At least one review is required.");
  }

  return reviews.slice(0, 15).map((review) => {
    const normalizedComment = normalizeText(review?.comment, { maxLength: 500 }) || "No written comment.";
    const scores = ["cleanliness", "accuracy", "communication", "location", "value"].reduce((acc, key) => {
      const value = Number(review?.[key]);
      if (!Number.isFinite(value) || value < 1 || value > 5) {
        throw new AiRequestError(400, `Review field "${key}" must be a score between 1 and 5.`);
      }
      acc[key] = value;
      return acc;
    }, {});

    return {
      ...scores,
      comment: normalizedComment,
    };
  });
}

export function validateSocialCreativeInput(payload) {
  const listingId = normalizeText(payload?.listingId, { maxLength: 120 });
  const sourceImageUrl = normalizeText(payload?.sourceImageUrl, { maxLength: 2000 });
  const brief = normalizeText(payload?.brief, { maxLength: 280 });
  const customHeadline = normalizeText(payload?.customHeadline, { maxLength: 90 });
  const templateId = `${payload?.templateId || ""}`.trim();

  const platform = `${payload?.platform || ""}`.trim();
  const tone = `${payload?.tone || ""}`.trim();
  const validPlatforms = new Set(["instagram", "facebook", "instagram_story", "whatsapp", "twitter", "linkedin"]);
  const validTones = new Set(["professional", "friendly", "adventurous", "luxurious", "urgent"]);
  const validTemplates = new Set([
    "featured_stay",
    "special_offer",
    "lifestyle_escape",
    "stay_carousel",
    "story_pack",
    "quick_facts",
    "weekend_escape",
  ]);

  if (!listingId) {
    throw new AiRequestError(400, "A listing is required for social image generation.");
  }
  if (!sourceImageUrl) {
    throw new AiRequestError(400, "A source listing image is required for social image generation.");
  }
  if (!validPlatforms.has(platform)) {
    throw new AiRequestError(400, "Unsupported social platform.");
  }
  if (!validTones.has(tone)) {
    throw new AiRequestError(400, "Unsupported creative tone.");
  }
  if (!validTemplates.has(templateId)) {
    throw new AiRequestError(400, "Unsupported social template.");
  }

  return {
    listingId,
    sourceImageUrl,
    platform,
    tone,
    templateId,
    includePrice: payload?.includePrice !== false,
    includeSpecialOffer: Boolean(payload?.includeSpecialOffer),
    customHeadline,
    brief,
  };
}
