function readEnv(name) {
  return `${process.env[name] || ""}`.trim();
}

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(`${value || ""}`.trim().toLowerCase());
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function parseCookieJar(cookieHeader) {
  const jar = new Map();
  for (const pair of cookieHeader.split(/;\s*/)) {
    if (!pair) {
      continue;
    }
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (!name) {
      continue;
    }
    jar.set(name, value);
  }
  return jar;
}

function mergeCookieJar(existingCookieHeader, setCookieHeaders) {
  const jar = parseCookieJar(existingCookieHeader);

  for (const setCookieHeader of setCookieHeaders) {
    const [cookiePair = ""] = setCookieHeader.split(";");
    const separatorIndex = cookiePair.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const name = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1).trim();
    if (!name) {
      continue;
    }
    if (!value) {
      jar.delete(name);
      continue;
    }
    jar.set(name, value);
  }

  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function getSetCookieHeaders(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const singleHeader = headers.get("set-cookie");
  return singleHeader ? [singleHeader] : [];
}

async function requestJson(baseUrl, path, options = {}) {
  const { method = "GET", body, cookieJar = "" } = options;
  const headers = {
    accept: "application/json",
  };

  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  if (cookieJar) {
    headers.cookie = cookieJar;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });

  const nextCookieJar = mergeCookieJar(cookieJar, getSetCookieHeaders(response.headers));
  const text = await response.text();

  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  return {
    cookieJar: nextCookieJar,
    payload,
    response,
    status: response.status,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function logPass(message) {
  console.log(`[pass] ${message}`);
}

function logInfo(message) {
  console.log(`[info] ${message}`);
}

async function probePublicSurface(baseUrl, expectedListingsMin) {
  const health = await requestJson(baseUrl, "/api/health");
  assert(health.status === 200, `Expected /api/health to return 200, received ${health.status}.`);
  logPass("Health endpoint responded successfully");

  const anonymousSession = await requestJson(baseUrl, "/api/encore/auth/session");
  assert(
    anonymousSession.status === 401,
    `Expected anonymous /api/encore/auth/session to return 401, received ${anonymousSession.status}.`,
  );
  logPass("Anonymous session probe is rejected as expected");

  const publicListings = await requestJson(baseUrl, "/api/encore/listings?status=active");
  assert(
    publicListings.status === 200,
    `Expected public listings probe to return 200, received ${publicListings.status}.`,
  );

  const listings = Array.isArray(publicListings.payload?.listings) ? publicListings.payload.listings : null;
  assert(listings, "Public listings probe did not return a listings array.");
  assert(
    listings.length >= expectedListingsMin,
    `Expected at least ${expectedListingsMin} active public listings, received ${listings.length}.`,
  );
  logPass(`Public listings probe returned ${listings.length} active listing(s)`);
}

async function loginAndProbeRole(baseUrl, roleName, email, password) {
  let cookieJar = "";

  const login = await requestJson(baseUrl, "/api/encore/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
    cookieJar,
  });
  cookieJar = login.cookieJar;

  assert(login.status === 200, `Expected ${roleName} login to return 200, received ${login.status}.`);
  assert(cookieJar, `Expected ${roleName} login to persist a session cookie through the proxy.`);
  logPass(`${roleName} login succeeded`);

  const session = await requestJson(baseUrl, "/api/encore/auth/session", { cookieJar });
  assert(session.status === 200, `Expected ${roleName} session probe to return 200, received ${session.status}.`);

  const sessionUser = session.payload?.user || session.payload;
  assert(sessionUser && typeof sessionUser === "object", `${roleName} session probe did not return a user payload.`);
  assert(
    sessionUser.role === roleName,
    `Expected ${roleName} session role to be ${roleName}, received ${sessionUser.role || "unknown"}.`,
  );
  logPass(`${roleName} session resolved the correct role`);

  let protectedPath = "/api/encore/bookings/me";
  if (roleName === "host") {
    protectedPath = `/api/encore/listings?hostId=${encodeURIComponent(String(sessionUser.id || ""))}`;
  } else if (roleName === "admin") {
    protectedPath = "/api/encore/admin/users";
  }

  const protectedResponse = await requestJson(baseUrl, protectedPath, { cookieJar });
  assert(
    protectedResponse.status === 200,
    `Expected ${roleName} protected probe ${protectedPath} to return 200, received ${protectedResponse.status}.`,
  );
  logPass(`${roleName} protected probe succeeded`);

  const logout = await requestJson(baseUrl, "/api/auth/logout", {
    method: "POST",
    cookieJar,
  });
  cookieJar = logout.cookieJar;
  assert(logout.status === 204, `Expected ${roleName} logout to return 204, received ${logout.status}.`);

  const postLogoutSession = await requestJson(baseUrl, "/api/encore/auth/session", { cookieJar });
  assert(
    postLogoutSession.status === 401,
    `Expected ${roleName} post-logout session probe to return 401, received ${postLogoutSession.status}.`,
  );
  logPass(`${roleName} logout cleared the proxy session cookie`);
}

async function runSignupProbe(baseUrl) {
  const signupEmail = readEnv("IDEAL_STAY_SMOKE_SIGNUP_EMAIL");
  const signupPassword = readEnv("IDEAL_STAY_SMOKE_SIGNUP_PASSWORD");
  const signupDisplayName = readEnv("IDEAL_STAY_SMOKE_SIGNUP_DISPLAY_NAME");
  const signupRole = readEnv("IDEAL_STAY_SMOKE_SIGNUP_ROLE") || "guest";

  const providedValues = [signupEmail, signupPassword, signupDisplayName].filter(Boolean).length;
  if (providedValues === 0) {
    return;
  }

  assert(
    providedValues === 3,
    "Provide IDEAL_STAY_SMOKE_SIGNUP_EMAIL, IDEAL_STAY_SMOKE_SIGNUP_PASSWORD, and IDEAL_STAY_SMOKE_SIGNUP_DISPLAY_NAME together.",
  );
  assert(["guest", "host"].includes(signupRole), "IDEAL_STAY_SMOKE_SIGNUP_ROLE must be either guest or host.");

  let cookieJar = "";
  const signup = await requestJson(baseUrl, "/api/encore/auth/signup", {
    method: "POST",
    body: {
      email: signupEmail,
      password: signupPassword,
      displayName: signupDisplayName,
      role: signupRole,
    },
    cookieJar,
  });
  cookieJar = signup.cookieJar;

  assert(signup.status === 200, `Expected signup probe to return 200, received ${signup.status}.`);
  assert(cookieJar, "Expected signup probe to establish a proxy session cookie.");
  logPass(`Signup probe created a ${signupRole} session for ${signupEmail}`);

  const logout = await requestJson(baseUrl, "/api/auth/logout", {
    method: "POST",
    cookieJar,
  });
  assert(logout.status === 204, `Expected signup cleanup logout to return 204, received ${logout.status}.`);
  logPass("Signup probe cleanup logout succeeded");
}

async function main() {
  const baseUrl = stripTrailingSlash(
    readEnv("IDEAL_STAY_SMOKE_BASE_URL") || readEnv("IDEAL_STAY_APP_URL") || "http://127.0.0.1:3000",
  );
  const requireRoleCredentials = isTruthy(readEnv("IDEAL_STAY_SMOKE_REQUIRE_ROLE_CREDENTIALS"));
  const expectedListingsMinRaw = readEnv("IDEAL_STAY_SMOKE_EXPECT_LISTINGS_MIN");
  const expectedListingsMin = expectedListingsMinRaw ? Number(expectedListingsMinRaw) : 0;

  assert(Number.isFinite(expectedListingsMin) && expectedListingsMin >= 0, "IDEAL_STAY_SMOKE_EXPECT_LISTINGS_MIN must be a non-negative number.");

  const roles = [
    {
      roleName: "guest",
      email: readEnv("IDEAL_STAY_SMOKE_GUEST_EMAIL"),
      password: readEnv("IDEAL_STAY_SMOKE_GUEST_PASSWORD"),
    },
    {
      roleName: "host",
      email: readEnv("IDEAL_STAY_SMOKE_HOST_EMAIL"),
      password: readEnv("IDEAL_STAY_SMOKE_HOST_PASSWORD"),
    },
    {
      roleName: "admin",
      email: readEnv("IDEAL_STAY_SMOKE_ADMIN_EMAIL"),
      password: readEnv("IDEAL_STAY_SMOKE_ADMIN_PASSWORD"),
    },
  ];

  logInfo(`Running live smoke against ${baseUrl}`);
  await probePublicSurface(baseUrl, expectedListingsMin);
  await runSignupProbe(baseUrl);

  const missingRoleCredentials = roles.filter((role) => !role.email || !role.password).map((role) => role.roleName);
  if (missingRoleCredentials.length > 0) {
    if (requireRoleCredentials) {
      throw new Error(
        `Missing required role credentials for: ${missingRoleCredentials.join(", ")}. Set IDEAL_STAY_SMOKE_REQUIRE_ROLE_CREDENTIALS=false to allow skipping them.`,
      );
    }

    logInfo(
      `Skipping authenticated role probes for: ${missingRoleCredentials.join(", ")}. Set IDEAL_STAY_SMOKE_REQUIRE_ROLE_CREDENTIALS=true and provide role credentials to enforce them.`,
    );
  }

  for (const role of roles) {
    if (!role.email || !role.password) {
      continue;
    }
    await loginAndProbeRole(baseUrl, role.roleName, role.email, role.password);
  }

  logPass("Live smoke verification completed");
}

await main().catch((error) => {
  console.error(`[fail] ${error instanceof Error ? error.message : "Live smoke verification failed."}`);
  process.exit(1);
});
