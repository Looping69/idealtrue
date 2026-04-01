export const DEFAULT_ENCORE_API_URL = "http://127.0.0.1:4000";
export const TOKEN_STORAGE_KEY = "idealstay.encore.token";

export function getEncoreApiUrl() {
  const configuredUrl = (import.meta as any).env?.VITE_ENCORE_API_URL?.trim();

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

    if (!isLocalHost) {
      return "/encore";
    }
  }

  return configuredUrl || DEFAULT_ENCORE_API_URL;
}

function getStorage() {
  if (typeof window === "undefined") {
    throw new Error("Encore session storage is unavailable outside the browser.");
  }

  return window.localStorage;
}

function getStoredToken() {
  return getStorage().getItem(TOKEN_STORAGE_KEY);
}

export function getEncoreSessionToken() {
  return getStoredToken();
}

export function hasEncoreSessionToken() {
  return !!getStoredToken();
}

export function clearEncoreSession() {
  getStorage().removeItem(TOKEN_STORAGE_KEY);
}

export function setEncoreSessionToken(token: string) {
  getStorage().setItem(TOKEN_STORAGE_KEY, token);
}

export async function encoreRequest<T>(
  path: string,
  init: RequestInit = {},
  opts: { auth?: boolean } = {},
): Promise<T> {
  const response = await encoreFetch(path, init, opts);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Encore request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function encoreFetch(
  path: string,
  init: RequestInit = {},
  opts: { auth?: boolean } = {},
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

  if (opts.auth) {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Missing Encore session token.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${getEncoreApiUrl()}${path}`, {
    ...init,
    headers,
  });
}
