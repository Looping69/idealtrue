import { createHash, randomBytes } from "node:crypto";
import { secret } from "encore.dev/config";

const authTokenPepper = secret("AUTH_TOKEN_SECRET");

type AuthTokenType = "verify_email" | "reset_password";

function getPepper() {
  return authTokenPepper() || "ideal-stay-local-dev-secret";
}

export function createRawAuthToken() {
  return randomBytes(32).toString("base64url");
}

export function hashAuthToken(token: string) {
  return createHash("sha256").update(`${getPepper()}:${token}`).digest("hex");
}

export type { AuthTokenType };
