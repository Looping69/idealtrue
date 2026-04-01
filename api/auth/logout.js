import { isSecureRequest, serializeClearedSessionCookie } from "../../lib/server/session-cookie.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed." }));
    return;
  }

  const secure = isSecureRequest(req.headers) || process.env.NODE_ENV === "production";
  res.statusCode = 204;
  res.setHeader("Set-Cookie", serializeClearedSessionCookie(secure));
  res.end();
}
