import assert from "node:assert/strict";
import test from "node:test";

import { handleTripPlannerRequest } from "../api/ai/trip-planner.js";

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
