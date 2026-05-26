const API_BASE = process.env.IDEAL_STAY_API_URL || "http://127.0.0.1:4000";
const DEMO_PASSWORD = process.env.IDEAL_STAY_DEMO_PASSWORD || "IdealStayDemo123!";
const REMOTE_ADMIN_EMAIL = process.env.IDEAL_STAY_SEED_ADMIN_EMAIL || "";
const REMOTE_ADMIN_PASSWORD = process.env.IDEAL_STAY_SEED_ADMIN_PASSWORD || "";

function isLocalApi(url) {
  try {
    const parsed = new URL(url);
    return ["127.0.0.1", "localhost"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function shouldUseLocalBootstrap() {
  return isLocalApi(API_BASE) && !REMOTE_ADMIN_EMAIL && !REMOTE_ADMIN_PASSWORD;
}

if (!isLocalApi(API_BASE) && process.env.IDEAL_STAY_ALLOW_REMOTE_SEED !== "true") {
  throw new Error(
    `Refusing to seed non-local API target ${API_BASE}. Set IDEAL_STAY_ALLOW_REMOTE_SEED=true if you really mean it.`,
  );
}

const guests = [
  {
    email: "guest.nomusa@idealstay.demo",
    displayName: "Nomusa Khumalo",
    role: "guest",
  },
];

const hosts = [
  {
    email: "thandi.mokoena@idealstay.demo",
    displayName: "Thandi Mokoena",
    role: "host",
    hostPlan: "standard",
    kycStatus: "verified",
    listings: [
      {
        title: "Sea Glass Guesthouse",
        description:
          "A bright coastal guesthouse two streets from the beach, built for weekend escapes and small family stays. Expect crisp interiors, a braai patio, fast WiFi, and easy access to Ballito's cafes and tidal pools.",
        location: "42 Ocean Drive, Ballito",
        area: "Ballito",
        province: "KwaZulu-Natal",
        category: "coastal_beach",
        type: "coastal_guesthouses",
        pricePerNight: 2450,
        discountPercent: 10,
        adults: 4,
        children: 2,
        bedrooms: 2,
        bathrooms: 2,
        amenities: ["Wifi", "Air conditioning", "Parking", "TV", "BBQ grill"],
        facilities: ["Swimming Pool", "Communal Braai area and Boma"],
        restaurantOffers: [],
        images: [
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1400&q=80",
        ],
        videoUrl: null,
        isSelfCatering: true,
        hasRestaurant: false,
        isOccupied: false,
        latitude: -29.5383,
        longitude: 31.2146,
        blockedDates: [],
        status: "active",
      },
    ],
  },
  {
    email: "johan.viljoen@idealstay.demo",
    displayName: "Johan Viljoen",
    role: "host",
    hostPlan: "professional",
    kycStatus: "verified",
    listings: [
      {
        title: "Maroela Ridge Bush Lodge",
        description:
          "A polished bush lodge overlooking private game-viewing plains near Hoedspruit. Designed for couples and small groups who want sunrise coffee on the deck, evening boma fires, and serious quiet between drives.",
        location: "R40, Hoedspruit Wildlife Estate",
        area: "Hoedspruit",
        province: "Limpopo",
        category: "safari_bush",
        type: "luxury_safari_lodge",
        pricePerNight: 6800,
        discountPercent: 0,
        adults: 6,
        children: 2,
        bedrooms: 3,
        bathrooms: 3,
        amenities: ["Wifi", "Air conditioning", "Parking", "Workspace", "Fireplace"],
        facilities: ["Swimming Pool", "Game Drives", "Game View Points", "Communal Braai area and Boma"],
        restaurantOffers: ["Breakfast", "Dinner"],
        images: [
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=80",
        ],
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        isSelfCatering: false,
        hasRestaurant: true,
        isOccupied: false,
        latitude: -24.3514,
        longitude: 30.9533,
        blockedDates: ["2026-04-10", "2026-04-11", "2026-05-01"],
        status: "active",
      },
      {
        title: "Bosveld Canopy Cabins",
        description:
          "A compact, design-forward cabin set with mountain views, wood-fired hot tubs, and a slower pace. The stay is aimed at remote workers and couples who want a clean, premium nature retreat without the resort noise.",
        location: "12 Blyde Canyon Road, Kampersrus",
        area: "Kampersrus",
        province: "Limpopo",
        category: "nature_country",
        type: "mountain_cabins_lodges",
        pricePerNight: 3900,
        discountPercent: 12,
        adults: 2,
        children: 0,
        bedrooms: 1,
        bathrooms: 1,
        amenities: ["Wifi", "Kitchen", "Hot tub", "Parking", "Workspace", "BBQ grill"],
        facilities: ["Hiking Trails", "Other"],
        restaurantOffers: [],
        images: [
          "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
        ],
        videoUrl: null,
        isSelfCatering: true,
        hasRestaurant: false,
        isOccupied: false,
        latitude: -24.2871,
        longitude: 30.8181,
        blockedDates: ["2026-04-18", "2026-04-19"],
        status: "active",
      },
    ],
  },
];

async function apiRequest(path, init = {}, token) {
  const headers = new Headers(init.headers || {});
  const method = init.method || "GET";
  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    method,
    headers,
  });

  const text = await response.text();
  const payload = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : {};

  if (!response.ok) {
    const error = new Error(`${method} ${path} failed: ${response.status} ${text}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function devLogin({ email, displayName, role, referredByCode, photoUrl }) {
  return apiRequest("/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({ email, displayName, role, referredByCode, photoUrl }),
  });
}

async function signup({ email, displayName, role, password, referredByCode, photoUrl }) {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, displayName, role, password, referredByCode, photoUrl }),
  });
}

async function login(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

async function listAdminUsers(adminToken) {
  const response = await apiRequest("/admin/users", {}, adminToken);
  if (Array.isArray(response?.users)) {
    return response.users;
  }
  if (Array.isArray(response)) {
    return response;
  }
  return [];
}

async function findUserByEmail(adminToken, email) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = await listAdminUsers(adminToken);
  return users.find((user) => `${user.email || ""}`.trim().toLowerCase() === normalizedEmail) || null;
}

async function setPassword(adminToken, userId, password) {
  await apiRequest(
    "/admin/users/password",
    {
      method: "POST",
      body: JSON.stringify({ userId, password }),
    },
    adminToken,
  );
}

async function updateUser(adminToken, userId, { displayName, role, hostPlan, kycStatus }) {
  await apiRequest(
    `/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ userId, displayName, role, hostPlan }),
    },
    adminToken,
  );

  if (kycStatus) {
    await apiRequest(
      "/admin/users/kyc-status",
      {
        method: "POST",
        body: JSON.stringify({ userId, kycStatus }),
      },
      adminToken,
    );
  }
}

async function ensureSharedUser(user, adminToken) {
  const existingUser = await findUserByEmail(adminToken, user.email);

  if (existingUser) {
    await updateUser(adminToken, existingUser.id, user);
    await setPassword(adminToken, existingUser.id, DEMO_PASSWORD);
    return login(user.email, DEMO_PASSWORD);
  }

  const createdSession = await signup({
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    password: DEMO_PASSWORD,
    referredByCode: user.referredByCode,
    photoUrl: user.photoUrl,
  });

  await updateUser(adminToken, createdSession.user.id, user);
  await setPassword(adminToken, createdSession.user.id, DEMO_PASSWORD);
  return login(user.email, DEMO_PASSWORD);
}

async function ensureSeedUser(user, adminToken, bootstrapMode) {
  if (bootstrapMode === "dev-login") {
    return devLogin(user);
  }

  return ensureSharedUser(user, adminToken);
}

async function listHostListings(hostId) {
  const response = await apiRequest(`/listings?hostId=${encodeURIComponent(hostId)}`);
  return response.listings || [];
}

async function saveListing(hostToken, listing, existingId) {
  const payload = {
    id: existingId,
    ...listing,
  };

  const method = existingId ? "PUT" : "POST";
  return apiRequest(
    "/host/listings",
    {
      method,
      body: JSON.stringify(payload),
    },
    hostToken,
  );
}

async function bootstrapAdminSession(bootstrapMode) {
  if (bootstrapMode === "dev-login") {
    const adminSession = await devLogin({
      email: "admin@idealstay.demo",
      displayName: "Ideal Stay Admin",
      role: "admin",
    });
    await setPassword(adminSession.token, adminSession.user.id, DEMO_PASSWORD);
    return {
      ...adminSession,
      bootstrapEmail: adminSession.user.email,
    };
  }

  if (!REMOTE_ADMIN_EMAIL || !REMOTE_ADMIN_PASSWORD) {
    throw new Error(
      "Shared-environment seeding requires IDEAL_STAY_SEED_ADMIN_EMAIL and IDEAL_STAY_SEED_ADMIN_PASSWORD.",
    );
  }

  const adminSession = await login(REMOTE_ADMIN_EMAIL, REMOTE_ADMIN_PASSWORD);
  return {
    ...adminSession,
    bootstrapEmail: REMOTE_ADMIN_EMAIL,
  };
}

async function main() {
  const bootstrapMode = shouldUseLocalBootstrap() ? "dev-login" : "shared-auth";
  console.log(`Seeding demo data into ${API_BASE} using ${bootstrapMode}`);

  const adminSession = await bootstrapAdminSession(bootstrapMode);
  const adminToken = adminSession.token;
  const guestSummary = [];
  const hostSummary = [];

  for (const guest of guests) {
    const guestSession = await ensureSeedUser(guest, adminToken, bootstrapMode);
    guestSummary.push({
      id: guestSession.user.id,
      email: guest.email,
      displayName: guest.displayName,
      role: guestSession.user.role,
    });
  }

  for (const host of hosts) {
    const hostSession = await ensureSeedUser(host, adminToken, bootstrapMode);
    const existingListings = await listHostListings(hostSession.user.id);

    const seededListings = [];
    for (const listing of host.listings) {
      const existing = existingListings.find((item) => item.title === listing.title);
      const saved = await saveListing(hostSession.token, listing, existing?.id);
      seededListings.push({
        id: saved.listing.id,
        title: saved.listing.title,
        status: saved.listing.status,
      });
    }

    hostSummary.push({
      host: host.displayName,
      email: host.email,
      plan: host.hostPlan,
      kycStatus: host.kycStatus,
      listings: seededListings,
    });
  }

  console.log(
    JSON.stringify(
      {
        apiBase: API_BASE,
        bootstrapMode,
        adminBootstrapEmail: adminSession.bootstrapEmail,
        demoPassword: DEMO_PASSWORD,
        guests: guestSummary,
        hosts: hostSummary,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});