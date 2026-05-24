export class AiProviderError extends Error {
  constructor(provider, message, options = {}) {
    super(message);
    this.name = "AiProviderError";
    this.provider = provider;
    this.statusCode = options.statusCode ?? null;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
}

export function isRetryableStatusCode(statusCode) {
  return statusCode === 408 || statusCode === 409 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
}

export function isProviderAuthError(error) {
  if (!(error instanceof AiProviderError)) {
    return false;
  }

  if (![400, 401, 403].includes(error.statusCode ?? 0)) {
    return false;
  }

  const message = `${error.message || ""}`.toLowerCase();
  return (
    message.includes("invalid authentication credential") ||
    message.includes("missing required authentication credential") ||
    message.includes("api key not valid") ||
    message.includes("api key") ||
    message.includes("permission denied")
  );
}
