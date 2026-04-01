import {
  copyRequestHeaders,
  getSessionTokenFromCookieHeader,
  isJsonResponse,
  isSecureRequest,
  readRawRequestBody,
  resolveEncoreApiUrl,
  sanitizeSessionPayload,
  serializeSessionCookie,
  shouldPersistSessionToken,
} from "../../lib/server/session-cookie.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

function getPathname(req) {
  const segments = Array.isArray(req.query.path)
    ? req.query.path
    : typeof req.query.path === "string" && req.query.path
      ? [req.query.path]
      : [];

  return `/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
}

export default async function handler(req, res) {
  try {
    const pathname = getPathname(req);
    const incomingUrl = new URL(req.url, "http://localhost");
    const encoreApiUrl = resolveEncoreApiUrl(process.env);
    const targetUrl = new URL(`${encoreApiUrl}${pathname}${incomingUrl.search}`);
    const headers = copyRequestHeaders(req.headers);
    const cookieToken = getSessionTokenFromCookieHeader(req.headers.cookie);

    if (cookieToken && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${cookieToken}`);
    }

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

    const secure = isSecureRequest(req.headers) || process.env.NODE_ENV === "production";
    const contentType = upstream.headers.get("content-type");
    res.statusCode = upstream.status;

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
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Encore proxy request failed.",
      }),
    );
  }
}
