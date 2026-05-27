function readEnv(name) {
  return `${process.env[name] || ""}`.trim();
}

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(`${value || ""}`.trim().toLowerCase());
}

function parseUrl(name, options = {}) {
  const value = readEnv(name);
  const { allowLocalhost = false } = options;

  if (!value) {
    return { error: `${name} is required.`, parsed: null };
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { error: `${name} must be a valid absolute URL.`, parsed: null };
  }

  if (!allowLocalhost && ["localhost", "127.0.0.1"].includes(parsed.hostname)) {
    return { error: `${name} cannot point at localhost in GitHub Actions.`, parsed: null };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { error: `${name} must use http or https.`, parsed: null };
  }

  return { error: null, parsed };
}

const requiredValues = [
  "IDEAL_STAY_DEMO_PASSWORD",
  "IDEAL_STAY_SEED_ADMIN_EMAIL",
  "IDEAL_STAY_SEED_ADMIN_PASSWORD",
  "IDEAL_STAY_SMOKE_ADMIN_EMAIL",
  "IDEAL_STAY_SMOKE_ADMIN_PASSWORD",
];

const errors = [];

for (const name of requiredValues) {
  if (!readEnv(name)) {
    errors.push(`${name} is required.`);
  }
}

const encoreApiUrl = parseUrl("ENCORE_API_URL");
const seedApiUrl = parseUrl("IDEAL_STAY_API_URL");
const smokeBaseUrl = parseUrl("IDEAL_STAY_SMOKE_BASE_URL");

for (const result of [encoreApiUrl, seedApiUrl, smokeBaseUrl]) {
  if (result.error) {
    errors.push(result.error);
  }
}

if (!encoreApiUrl.error && !seedApiUrl.error && encoreApiUrl.parsed.toString() !== seedApiUrl.parsed.toString()) {
  errors.push("ENCORE_API_URL and IDEAL_STAY_API_URL must match for the staging workflow.");
}

if (!encoreApiUrl.error && !smokeBaseUrl.error && encoreApiUrl.parsed.origin === smokeBaseUrl.parsed.origin) {
  errors.push("IDEAL_STAY_SMOKE_BASE_URL must point at the deployed frontend host, not the raw Encore API host.");
}

if (!isTruthy(readEnv("IDEAL_STAY_ALLOW_REMOTE_SEED"))) {
  errors.push("IDEAL_STAY_ALLOW_REMOTE_SEED must be true in the staging workflow.");
}

if (readEnv("IDEAL_STAY_SMOKE_GUEST_EMAIL") !== "guest.nomusa@idealstay.demo") {
  errors.push("IDEAL_STAY_SMOKE_GUEST_EMAIL must stay aligned with the seeded smoke guest account.");
}

if (readEnv("IDEAL_STAY_SMOKE_HOST_EMAIL") !== "thandi.mokoena@idealstay.demo") {
  errors.push("IDEAL_STAY_SMOKE_HOST_EMAIL must stay aligned with the seeded smoke host account.");
}

if (readEnv("IDEAL_STAY_SMOKE_GUEST_PASSWORD") !== readEnv("IDEAL_STAY_DEMO_PASSWORD")) {
  errors.push("IDEAL_STAY_SMOKE_GUEST_PASSWORD must match IDEAL_STAY_DEMO_PASSWORD.");
}

if (readEnv("IDEAL_STAY_SMOKE_HOST_PASSWORD") !== readEnv("IDEAL_STAY_DEMO_PASSWORD")) {
  errors.push("IDEAL_STAY_SMOKE_HOST_PASSWORD must match IDEAL_STAY_DEMO_PASSWORD.");
}

if (errors.length > 0) {
  console.error("Staging smoke environment check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Staging smoke environment check passed.");
