const LOCAL_ENCORE_API_URL = "http://127.0.0.1:4000";
const STAGING_ENCORE_HOST = ["staging-ideal-stay-online-gh5i", "encr.app"].join(".");

export const SESSION_COOKIE_NAME = "idealstay_session";

function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "");
}

export function hasStagingEncoreHost(value) {
  return value.includes(STAGING_ENCORE_HOST);
}

export function isProductionLikeEnvironment(env = process.env) {
  const nodeEnv = `${env.NODE_ENV || ""}`.trim().toLowerCase();
  const vercelEnv = `${env.VERCEL_ENV || ""}`.trim().toLowerCase();
  return nodeEnv === "production" || vercelEnv === "preview" || vercelEnv === "production";
}

export function resolveEncoreApiUrl(env = process.env, options = {}) {
  const configuredUrl = `${env.ENCORE_API_URL || ""}`.trim();
  const allowLocalDefault = options.allowLocalDefault === true;
  const productionLike = isProductionLikeEnvironment(env);

  if (!configuredUrl) {
    if (allowLocalDefault && !productionLike) {
      return LOCAL_ENCORE_API_URL;
    }

    throw new Error(
      "Missing ENCORE_API_URL. Preview and production must set an explicit Encore backend URL.",
    );
  }

  const normalizedUrl = trimTrailingSlashes(configuredUrl);
  if (productionLike && hasStagingEncoreHost(normalizedUrl)) {
    throw new Error("Preview or production is configured to use the staging Encore backend. Refusing to start.");
  }

  return normalizedUrl;
}

export function getRequestId(headers = {}) {
  const candidate =
    headers["x-request-id"] ||
    headers["x-vercel-id"] ||
    headers["x-correlation-id"];

  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }

  if (Array.isArray(candidate) && candidate[0]?.trim()) {
    return candidate[0].trim();
  }

  return globalThis.crypto?.randomUUID?.() || `req-${Date.now()}`;
}

export function logEncoreProxyEvent({
  durationMs,
  method,
  proxyPath,
  requestId,
  status,
  targetUrl,
}) {
  console.info(JSON.stringify({
    durationMs,
    event: "encore_proxy_request",
    method,
    proxyPath,
    requestId,
    status,
    targetHost: targetUrl.host,
    upstreamPath: `${targetUrl.pathname}${targetUrl.search}`,
  }));
}

export function logEncoreProxyError({
  durationMs,
  error,
  method,
  proxyPath,
  requestId,
  targetUrl,
}) {
  console.error(JSON.stringify({
    durationMs,
    error: error instanceof Error ? error.message : "Encore proxy request failed.",
    event: "encore_proxy_error",
    method,
    proxyPath,
    requestId,
    targetHost: targetUrl?.host || null,
    upstreamPath: targetUrl ? `${targetUrl.pathname}${targetUrl.search}` : null,
  }));
}

export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.split("=");
    const name = rawName?.trim();
    if (!name) {
      continue;
    }
    cookies[name] = decodeURIComponent(rawValue.join("=").trim());
  }

  return cookies;
}

export function getSessionTokenFromCookieHeader(cookieHeader) {
  return parseCookies(cookieHeader)[SESSION_COOKIE_NAME] || null;
}

export function isSecureRequest(headers = {}) {
  const forwardedProto = headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string") {
    return forwardedProto.split(",").some((value) => value.trim().toLowerCase() === "https");
  }
  if (Array.isArray(forwardedProto)) {
    return forwardedProto.some((value) => `${value}`.trim().toLowerCase() === "https");
  }
  return false;
}

function buildCookieAttributes(maxAgeSeconds, secure) {
  const attributes = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (typeof maxAgeSeconds === "number") {
    attributes.push(`Max-Age=${maxAgeSeconds}`);
  }

  if (secure) {
    attributes.push("Secure");
  }

  return attributes;
}

export function serializeSessionCookie(token, secure) {
  const attributes = buildCookieAttributes(60 * 60 * 24 * 7, secure);
  attributes[0] = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;
  return attributes.join("; ");
}

export function serializeClearedSessionCookie(secure) {
  const attributes = buildCookieAttributes(0, secure);
  attributes.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  return attributes.join("; ");
}

export function shouldPersistSessionToken(pathname, payload) {
  if (!payload || typeof payload !== "object" || typeof payload.token !== "string" || !payload.token) {
    return false;
  }

  return (
    pathname === "/auth/login" ||
    pathname === "/auth/signup" ||
    pathname === "/auth/session" ||
    pathname === "/users/me"
  );
}

export function sanitizeSessionPayload(pathname, payload) {
  if (!shouldPersistSessionToken(pathname, payload)) {
    return payload;
  }

  const { token: _token, ...rest } = payload;
  return rest;
}

export async function readRawRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function copyRequestHeaders(sourceHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(sourceHeaders || {})) {
    if (value == null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        headers.append(name, entry);
      }
      continue;
    }

    headers.set(name, String(value));
  }

  headers.delete("host");
  headers.delete("cookie");
  headers.delete("content-length");
  headers.delete("connection");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-port");
  headers.delete("x-forwarded-proto");

  return headers;
}

export function isJsonResponse(contentType) {
  return `${contentType || ""}`.toLowerCase().includes("application/json");
}
