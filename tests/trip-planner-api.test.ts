import assert from "node:assert/strict";
import test from "node:test";

import { handleTripPlannerRequest } from "../api/ai/trip-planner.js";
import { AiProviderError } from "../lib/server/ai-provider-error.js";

function createResponseRecorder() {
  const headers = new Map();

  return {
    statusCode: 200,
    body: "",
    headers,
    setHeader(name, value) {
      headers.set(name, value);
    },
    end(payload) {
      this.body = payload;
    },
  };
}

test("handleTripPlannerRequest passes resolved user context and env into the planner", async () => {
  const req = {
    method: "POST",
    headers: {
      cookie: "session=abc",
      "x-forwarded-for": "203.0.113.8",
    },
    body: {
      messages: [{ role: "user", content: "Plan a Cape Town weekend." }],
    },
  };
  const res = createResponseRecorder();
  const actor = {
    user: {
      id: "user-1",
      displayName: "Willi",
      role: "guest",
      emailVerified: true,
    },
    rateKey: "user:user-1",
    rateTier: "user",
  };

  let rateLimitScope = null;
  let rateLimitActor = null;
  let plannerArgs = null;

  await handleTripPlannerRequest(req, res, {
    resolveAiActor: async () => actor,
    enforceAiRateLimit: (scope, nextActor) => {
      rateLimitScope = scope;
      rateLimitActor = nextActor;
    },
    generateTripPlannerReply: async (messages, options) => {
      plannerArgs = { messages, options };
      return "# Trip brief\nCape Town is a good fit.";
    },
  });

  assert.equal(rateLimitScope, "tripPlanner");
  assert.equal(rateLimitActor, actor);
  assert.deepEqual(plannerArgs, {
    messages: [{ role: "user", content: "Plan a Cape Town weekend." }],
    options: {
      user: actor.user,
      env: process.env,
    },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers.get("Content-Type"), "application/json");
  assert.deepEqual(JSON.parse(res.body), {
    reply: "# Trip brief\nCape Town is a good fit.",
  });
});

test("handleTripPlannerRequest allows guest actors and does not force auth", async () => {
  const req = {
    method: "POST",
    headers: {
      "x-forwarded-for": "203.0.113.8",
    },
    body: {
      messages: [{ role: "user", content: "Plan a low-budget weekend." }],
    },
  };
  const res = createResponseRecorder();
  const actor = {
    user: null,
    rateKey: "ip:203.0.113.8",
    rateTier: "guest",
  };

  let resolveArgs = null;

  await handleTripPlannerRequest(req, res, {
    resolveAiActor: async (options) => {
      resolveArgs = options;
      return actor;
    },
    enforceAiRateLimit: () => {},
    generateTripPlannerReply: async () => "Guest plan reply",
  });

  assert.deepEqual(resolveArgs, {
    headers: req.headers,
    cookieHeader: req.headers.cookie,
    env: process.env,
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), {
    reply: "Guest plan reply",
  });
});

test("handleTripPlannerRequest returns 502 with actionable guidance when Gemini auth is misconfigured", async () => {
  const req = {
    method: "POST",
    headers: {
      cookie: "session=abc",
      "x-forwarded-for": "203.0.113.8",
    },
    body: {
      messages: [{ role: "user", content: "Plan a Cape Town weekend." }],
    },
  };
  const res = createResponseRecorder();
  const actor = {
    user: {
      id: "user-1",
      displayName: "Willi",
      role: "guest",
      emailVerified: true,
    },
    rateKey: "user:user-1",
    rateTier: "user",
  };

  await handleTripPlannerRequest(req, res, {
    resolveAiActor: async () => actor,
    enforceAiRateLimit: () => {},
    generateTripPlannerReply: async () => {
      throw new AiProviderError(
        "gemini",
        "Request had invalid authentication credentials. Expected OAuth 2 access token.",
        { statusCode: 401, retryable: false },
      );
    },
  });

  assert.equal(res.statusCode, 502);
  assert.equal(res.headers.get("Content-Type"), "application/json");
  const body = JSON.parse(res.body);
  assert.match(body.error, /authentication is misconfigured on the server/i);
  assert.match(body.error, /GEMINI_API_KEY|SEARCH_AI_GEMINI_API_KEY/i);
});
