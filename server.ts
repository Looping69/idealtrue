import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import {
  copyRequestHeaders,
  getSessionTokenFromCookieHeader,
  isJsonResponse,
  readRawRequestBody,
  resolveEncoreApiUrl,
  sanitizeSessionPayload,
  serializeClearedSessionCookie,
  serializeSessionCookie,
  shouldPersistSessionToken,
} from "./lib/server/session-cookie.js";

function getEncoreProxyPath(req: express.Request) {
  const originalUrl = req.originalUrl || req.url;
  const [pathname, search = ""] = originalUrl.split("?");
  const proxyPrefix = "/api/encore";
  const encorePath = pathname.startsWith(proxyPrefix) ? pathname.slice(proxyPrefix.length) || "/" : "/";
  return `${encorePath}${search ? `?${search}` : ""}`;
}

async function proxyEncoreRequest(req: express.Request, res: express.Response) {
  try {
    const encoreApiUrl = resolveEncoreApiUrl(process.env, { allowLocalDefault: true });
    const proxyPath = getEncoreProxyPath(req);
    const targetUrl = new URL(proxyPath, `${encoreApiUrl}/`);
    const headers = copyRequestHeaders(req.headers);
    const sessionToken = getSessionTokenFromCookieHeader(req.headers.cookie);

    if (sessionToken && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${sessionToken}`);
    }

    let body: Buffer | undefined;
    if (!["GET", "HEAD"].includes(req.method)) {
      body = await readRawRequestBody(req);
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    const contentType = upstream.headers.get("content-type");
    res.status(upstream.status);

    const pathname = targetUrl.pathname;
    if (isJsonResponse(contentType)) {
      const payload = await upstream.json();
      if (shouldPersistSessionToken(pathname, payload)) {
        res.setHeader("Set-Cookie", serializeSessionCookie(payload.token, false));
      }
      res.type("application/json");
      res.send(JSON.stringify(sanitizeSessionPayload(pathname, payload)));
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
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Encore proxy request failed.",
    });
  }
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const port = 3000;

  app.post("/api/auth/logout", (_req, res) => {
    res.status(204);
    res.setHeader("Set-Cookie", serializeClearedSessionCookie(false));
    res.end();
  });

  app.use("/api/encore", (req, res) => {
    void proxyEncoreRequest(req, res);
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

void startServer();
