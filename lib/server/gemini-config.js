export const DEFAULT_GEMINI_TEXT_MODEL = "gemini-2.5-flash";
export const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
const LEGACY_IMAGE_MODEL_ALIASES = new Map([
  ["gemini-2.5-flash-image-preview", "gemini-2.5-flash-image"],
]);

function readEnvValue(env, key) {
  return `${env[key] || ""}`.trim();
}

function readGeminiApiKey(env) {
  const candidates = [
    "SEARCH_AI_GEMINI_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_AI_API_KEY",
    "GOOGLE_API_KEY",
  ];

  for (const key of candidates) {
    const value = readEnvValue(env, key);
    if (value) {
      return value;
    }
  }

  return "";
}

export function getGeminiConfig(env = process.env) {
  const apiKey = readGeminiApiKey(env);
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const requestedImageModel = readEnvValue(env, "GEMINI_IMAGE_MODEL");
  const normalizedImageModel = LEGACY_IMAGE_MODEL_ALIASES.get(requestedImageModel) || requestedImageModel || DEFAULT_GEMINI_IMAGE_MODEL;

  return {
    apiKey,
    textModel: readEnvValue(env, "GEMINI_TEXT_MODEL") || DEFAULT_GEMINI_TEXT_MODEL,
    imageModel: normalizedImageModel,
  };
}
