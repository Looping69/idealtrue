import {
  copyRequestHeaders,
  getRequestId,
  getSessionTokenFromCookieHeader,
  isJsonResponse,
  isSecureRequest,
  logEncoreProxyError,
  logEncoreProxyEvent,
  readRawRequestBody,
  resolveEncoreApiUrl,
  sanitizeSessionPayload,
  serializeSessionCookie,
  shouldPersistSessionToken,
} from "../lib/server/session-cookie.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

function normalizePathSegments(value) {
  const rawSegments = Array.isArray(value) ? value : [value];

  return rawSegments
    .flatMap((segment) => `${segment || ""}`.split("/"))
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
}

function getProxyPath(req) {
  const incomingUrl = new URL(req.url, "http://localhost");
  const pathSegments = normalizePathSegments(req.query.path);
  const pathname = pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "/";

  incomingUrl.searchParams.delete("path");
  const search = incomingUrl.searchParams.toString();

  return {
    pathname,
    proxyPath: `${pathname}${search ? `?${search}` : ""}`,
  };
}

export default async function handler(req, res) {
  const startedAt = Date.now();
  const requestId = getRequestId(req.headers);
  const { pathname, proxyPath } = getProxyPath(req);
  let targetUrl;

  try {
    const encoreApiUrl = resolveEncoreApiUrl(process.env);
    targetUrl = new URL(proxyPath, `${encoreApiUrl}/`);
    const headers = copyRequestHeaders(req.headers);
    const cookieToken = getSessionTokenFromCookieHeader(req.headers.cookie);

    if (cookieToken && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${cookieToken}`);
    }
    headers.set("x-request-id", requestId);

    let body;
    if (!["GET", "HEAD"].includes(req.method || "GET")) {
      body = await readRawRequestBody(req);
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });
    logEncoreProxyEvent({
      durationMs: Date.now() - startedAt,
      method: req.method,
      proxyPath,
      requestId,
      status: upstream.status,
      targetUrl,
    });

    const secure = isSecureRequest(req.headers) || process.env.NODE_ENV === "production";
    const contentType = upstream.headers.get("content-type");
    res.statusCode = upstream.status;
    res.setHeader("X-Request-Id", requestId);

    if (isJsonResponse(contentType)) {
      const payload = await upstream.json();
      if (shouldPersistSessionToken(pathname, payload)) {
        res.setHeader("Set-Cookie", serializeSessionCookie(payload.token, secure));
      }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(sanitizeSessionPayload(pathname, payload)));
      return;
    }

    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const location = upstream.headers.get("location");
    if (location) {
      res.setHeader("Location", location);
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    logEncoreProxyError({
      durationMs: Date.now() - startedAt,
      error,
      method: req.method,
      proxyPath,
      requestId,
      targetUrl,
    });
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Encore proxy request failed.",
      }),
    );
  }
}
