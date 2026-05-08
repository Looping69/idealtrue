import { timingSafeEqual } from "node:crypto";
import { secret } from "encore.dev/config";

const googleOauthClientId = secret("GOOGLE_OAUTH_CLIENT_ID");
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

type GoogleJwk = JsonWebKey & { kid?: string; alg?: string; use?: string };

type GoogleJwksResponse = {
  keys?: GoogleJwk[];
};

export interface VerifiedGoogleIdToken {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
  givenName: string | null;
  familyName: string | null;
}

type GoogleJwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

type GoogleJwtClaims = {
  iss?: string;
  aud?: string;
  exp?: number;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  sub?: string;
};

let cachedGoogleKeys: { expiresAt: number; keys: GoogleJwk[] } | null = null;

function readConfiguredGoogleClientId() {
  try {
    const configured = googleOauthClientId().trim();
    if (configured) {
      return configured;
    }
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "secret GOOGLE_OAUTH_CLIENT_ID is not set") {
      throw error;
    }
  }

  const fallback = `${process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || ""}`.trim();
  if (fallback) {
    return fallback;
  }

  throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID for Google sign-in verification.");
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url");
}

function decodeJwtSection<T>(input: string): T {
  return JSON.parse(decodeBase64Url(input).toString("utf8")) as T;
}

function parseMaxAgeSeconds(cacheControl: string | null) {
  if (!cacheControl) {
    return 60 * 60;
  }

  const match = cacheControl.match(/max-age=(\d+)/i);
  if (!match) {
    return 60 * 60;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60 * 60;
}

async function getGoogleSigningKeys() {
  const now = Date.now();
  if (cachedGoogleKeys && cachedGoogleKeys.expiresAt > now && cachedGoogleKeys.keys.length > 0) {
    return cachedGoogleKeys.keys;
  }

  const response = await fetch(GOOGLE_JWKS_URL);
  if (!response.ok) {
    throw new Error(`Failed to load Google signing keys: ${response.status}`);
  }

  const body = await response.json() as GoogleJwksResponse;
  const keys = Array.isArray(body.keys) ? body.keys : [];
  if (!keys.length) {
    throw new Error("Google signing keys response was empty.");
  }

  cachedGoogleKeys = {
    keys,
    expiresAt: now + parseMaxAgeSeconds(response.headers.get("cache-control")) * 1000,
  };

  return keys;
}

async function verifyJwtSignature(
  signingInput: string,
  signatureSegment: string,
  jwk: GoogleJwk,
) {
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decodeBase64Url(signatureSegment),
    Buffer.from(signingInput, "utf8"),
  );

  if (!verified) {
    throw new Error("Google ID token signature verification failed.");
  }
}

function assertKnownIssuer(value: string | undefined) {
  if (value === "accounts.google.com" || value === "https://accounts.google.com") {
    return;
  }
  throw new Error("Google ID token issuer was invalid.");
}

function normalizeEmailVerified(value: boolean | string | undefined) {
  return value === true || value === "true";
}

export async function verifyGoogleIdToken(credential: string): Promise<VerifiedGoogleIdToken> {
  const trimmed = credential.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    throw new Error("Google credential was not a valid JWT.");
  }

  const [headerSegment, claimsSegment, signatureSegment] = parts;
  const header = decodeJwtSection<GoogleJwtHeader>(headerSegment);
  const claims = decodeJwtSection<GoogleJwtClaims>(claimsSegment);

  if (header.alg !== "RS256") {
    throw new Error("Google credential used an unsupported signing algorithm.");
  }
  if (!header.kid) {
    throw new Error("Google credential is missing a signing key id.");
  }

  const keys = await getGoogleSigningKeys();
  const jwk = keys.find((candidate) => candidate.kid === header.kid);
  if (!jwk) {
    cachedGoogleKeys = null;
    const refreshedKeys = await getGoogleSigningKeys();
    const refreshed = refreshedKeys.find((candidate) => candidate.kid === header.kid);
    if (!refreshed) {
      throw new Error("Google signing key could not be resolved.");
    }
    await verifyJwtSignature(`${headerSegment}.${claimsSegment}`, signatureSegment, refreshed);
  } else {
    await verifyJwtSignature(`${headerSegment}.${claimsSegment}`, signatureSegment, jwk);
  }

  const expectedAudience = readConfiguredGoogleClientId();
  assertKnownIssuer(claims.iss);

  const audience = `${claims.aud || ""}`.trim();
  const expectedBytes = Buffer.from(expectedAudience, "utf8");
  const actualBytes = Buffer.from(audience, "utf8");
  if (expectedBytes.length !== actualBytes.length || !timingSafeEqual(expectedBytes, actualBytes)) {
    throw new Error("Google credential audience did not match this app.");
  }

  const exp = typeof claims.exp === "number" ? claims.exp : 0;
  if (!exp || exp * 1000 <= Date.now()) {
    throw new Error("Google credential has expired.");
  }

  const email = `${claims.email || ""}`.trim().toLowerCase();
  if (!email) {
    throw new Error("Google credential did not include an email address.");
  }
  if (!normalizeEmailVerified(claims.email_verified)) {
    throw new Error("Google credential email address is not verified.");
  }

  const sub = `${claims.sub || ""}`.trim();
  if (!sub) {
    throw new Error("Google credential did not include a stable Google subject.");
  }

  return {
    sub,
    email,
    emailVerified: true,
    name: `${claims.name || ""}`.trim() || email.split("@")[0],
    picture: `${claims.picture || ""}`.trim() || null,
    givenName: `${claims.given_name || ""}`.trim() || null,
    familyName: `${claims.family_name || ""}`.trim() || null,
  };
}
