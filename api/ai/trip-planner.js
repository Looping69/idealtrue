import { AiRequestError, enforceAiRateLimit, resolveAiActor } from "../../lib/server/ai-rails.js";
import { generateTripPlannerReply } from "../../lib/server/trip-planner.js";
import { AiProviderError, isProviderAuthError } from "../../lib/server/ai-provider-error.js";

export async function handleTripPlannerRequest(
  req,
  res,
  deps = {
    resolveAiActor,
    enforceAiRateLimit,
    generateTripPlannerReply,
  },
) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end(JSON.stringify({ error: "Method not allowed." }));
    return;
  }

  try {
    const actor = await deps.resolveAiActor({
      headers: req.headers,
      cookieHeader: req.headers.cookie,
      env: process.env,
    });
    deps.enforceAiRateLimit("tripPlanner", actor);
    const reply = await deps.generateTripPlannerReply(req.body?.messages, {
      user: actor.user,
      env: process.env,
    });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ reply }));
  } catch (error) {
    if (error instanceof AiRequestError) {
      res.statusCode = error.statusCode;
    } else if (error instanceof AiProviderError) {
      res.statusCode = 502;
    } else {
      res.statusCode = 400;
    }
    if (error instanceof AiRequestError && error.retryAfterSec) {
      res.setHeader("Retry-After", String(error.retryAfterSec));
    }
    res.setHeader("Content-Type", "application/json");
    const message =
      isProviderAuthError(error)
        ? "AI provider authentication is misconfigured on the server. Verify GEMINI_API_KEY or SEARCH_AI_GEMINI_API_KEY and allowed API-key restrictions in Google AI Studio."
        : error instanceof Error
          ? error.message
          : "Trip planner request failed.";
    res.end(JSON.stringify({ error: message }));
  }
}

export default async function handler(req, res) {
  return handleTripPlannerRequest(req, res);
}
