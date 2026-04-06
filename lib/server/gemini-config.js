export const DEFAULT_GEMINI_TEXT_MODEL = "gemini-2.5-flash";
export const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
const LEGACY_IMAGE_MODEL_ALIASES = new Map([
  ["gemini-2.5-flash-image-preview", "gemini-2.5-flash-image"],
]);

function readEnvValue(env, key) {
  return `${env[key] || ""}`.trim();
}

export function getGeminiConfig(env = process.env) {
  const apiKey = readEnvValue(env, "GEMINI_API_KEY");
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
