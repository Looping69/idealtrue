export const DEFAULT_ENCORE_API_URL = "/api/encore";

export function getEncoreApiUrl() {
  return DEFAULT_ENCORE_API_URL;
}

export function clearEncoreSession() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => undefined);
}

export async function encoreRequest<T>(
  path: string,
  init: RequestInit = {},
  _opts: { auth?: boolean } = {},
): Promise<T> {
  const response = await encoreFetch(path, init);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Encore request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function encoreFetch(
  path: string,
  init: RequestInit = {},
  _opts: { auth?: boolean } = {},
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const body = init.body;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isBlob = typeof Blob !== "undefined" && body instanceof Blob;
  const isBinaryBody =
    isFormData ||
    isBlob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body as ArrayBufferView | null);

  if (body && !headers.has("Content-Type") && !isBinaryBody) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${getEncoreApiUrl()}${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });
}
