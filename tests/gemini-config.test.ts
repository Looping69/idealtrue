import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_GEMINI_IMAGE_MODEL,
  DEFAULT_GEMINI_TEXT_MODEL,
  getGeminiConfig,
} from "../lib/server/gemini-config.js";

test("getGeminiConfig defaults to Gemini 2.5 Flash and the stable image model", () => {
  const config = getGeminiConfig({ GEMINI_API_KEY: "test-key" });

  assert.equal(config.textModel, DEFAULT_GEMINI_TEXT_MODEL);
  assert.equal(config.imageModel, DEFAULT_GEMINI_IMAGE_MODEL);
});

test("getGeminiConfig remaps the retired image preview alias to the stable model", () => {
  const config = getGeminiConfig({
    GEMINI_API_KEY: "test-key",
    GEMINI_IMAGE_MODEL: "gemini-2.5-flash-image-preview",
  });

  assert.equal(config.imageModel, "gemini-2.5-flash-image");
});
