import assert from "node:assert/strict";
import test from "node:test";

import { buildPlannerSystemInstruction, buildTripPlannerEnv } from "../lib/server/trip-planner.js";

test("buildTripPlannerEnv prefers the dedicated search AI key and flash-lite model", () => {
  const env = buildTripPlannerEnv({
    SEARCH_AI_GEMINI_API_KEY: "search-key",
    SEARCH_AI_MODEL: "gemini-2.5-flash-lite",
    GEMINI_API_KEY: "fallback-key",
    GEMINI_TEXT_MODEL: "gemini-2.5-flash",
  });

  assert.equal(env.GEMINI_API_KEY, "search-key");
  assert.equal(env.GEMINI_TEXT_MODEL, "gemini-2.5-flash-lite");
});

test("buildPlannerSystemInstruction includes safe logged-in user context", () => {
  const instruction = buildPlannerSystemInstruction({
    displayName: "Willi",
    role: "host",
    hostPlan: "premium",
    emailVerified: true,
    email: "hidden@example.com",
  });

  assert.match(instruction, /Name: Willi/);
  assert.match(instruction, /Account role: host/);
  assert.match(instruction, /Host plan: premium/);
  assert.doesNotMatch(instruction, /hidden@example\.com/);
});
