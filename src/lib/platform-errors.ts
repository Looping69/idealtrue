export function extractPlatformErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const rawMessage = error.message.trim();
  if (!rawMessage) {
    return fallback;
  }

  const normalizedMessage = rawMessage.replace(/\\"/g, '"');
  const embeddedMessage = normalizedMessage.match(/"message":"([^"]+)"/)?.[1]?.trim();
  if (embeddedMessage) {
    return embeddedMessage;
  }

  const jsonStartIndex = normalizedMessage.indexOf('{');
  if (jsonStartIndex >= 0) {
    try {
      const parsed = JSON.parse(normalizedMessage.slice(jsonStartIndex)) as { message?: unknown };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message.trim();
      }
    } catch {
      // Fall back to the original error message below.
    }
  }

  return rawMessage;
}
