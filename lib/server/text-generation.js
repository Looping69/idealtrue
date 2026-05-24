import { generateDeepSeekText } from "./deepseek-api.js";
import { hasDeepSeekConfig } from "./deepseek-config.js";
import { generateGeminiText } from "./gemini-api.js";
import { isProviderAuthError } from "./ai-provider-error.js";

function shouldFallbackToDeepSeek(error) {
  if (!error) {
    return false;
  }

  if (isProviderAuthError(error)) {
    return true;
  }

  if (typeof error === "object" && "retryable" in error) {
    return Boolean(error.retryable);
  }

  return true;
}

export async function generateTextWithFallback(options) {
  try {
    return await generateGeminiText(options);
  } catch (error) {
    if (!hasDeepSeekConfig(options?.env) || !shouldFallbackToDeepSeek(error)) {
      throw error;
    }

    console.warn("Gemini text generation failed, falling back to DeepSeek.", error);
    return generateDeepSeekText(options);
  }
}
