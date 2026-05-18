import assert from "node:assert/strict";
import test from "node:test";

import { generateSocialTemplatePack } from "../lib/server/social-template-engine.js";

const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn14x4AAAAASUVORK5CYII=";

const listing = {
  id: "listing-1",
  title: "Villa del Sol",
  description: "Bright coastal villa with a pool and easy beach access.",
  location: "Margate",
  area: "Uvongo",
  province: "KwaZulu-Natal",
  pricePerNight: 2450,
  discountPercent: 12,
  adults: 4,
  children: 2,
  bedrooms: 3,
  bathrooms: 2,
  amenities: ["pool", "wifi", "beach access"],
  facilities: ["braai area"],
  type: "villa",
  images: [
    "https://cdn.example.com/cover.jpg",
    "https://cdn.example.com/lounge.jpg",
  ],
};

function installFetch(responseFactory = () =>
  new Response(Buffer.from(SAMPLE_PNG_BASE64, "base64"), {
    status: 200,
    headers: { "Content-Type": "image/png" },
  })
) {
  Object.defineProperty(globalThis, "fetch", {
    value: async () => responseFactory(),
    configurable: true,
    writable: true,
  });
}

const publicImageDnsLookup = async () => [{ address: "203.0.113.10", family: 4 }];

function baseCreativeParams(overrides = {}) {
  return {
    listing,
    sourceImageUrl: listing.images[0],
    platform: "instagram",
    tone: "professional",
    templateId: "featured_stay",
    includePrice: true,
    includeSpecialOffer: false,
    customHeadline: "",
    env: { IDEAL_STAY_APP_URL: "https://idealstay.co.za" },
    imageDnsLookup: publicImageDnsLookup,
    ...overrides,
  };
}

test.beforeEach(() => {
  installFetch();
});

test("story pack always returns a 3-story asset set", async () => {
  const creative = await generateSocialTemplatePack({
    listing,
    sourceImageUrl: listing.images[0],
    platform: "instagram_story",
    tone: "luxurious",
    templateId: "story_pack",
    includePrice: true,
    includeSpecialOffer: true,
    customHeadline: "",
    env: { IDEAL_STAY_APP_URL: "https://idealstay.co.za" },
    imageDnsLookup: publicImageDnsLookup,
  });

  assert.equal(creative.templateId, "story_pack");
  assert.equal(creative.assets.length, 3);
  assert.equal(creative.assets[0]?.label, "Story 1");
  assert.equal(creative.assets[2]?.label, "Story 3");
  assert.match(creative.bookingUrl, /\?listingId=listing-1$/);
});

test("stay carousel always returns 5 slides even when the listing has too few photos", async () => {
  const creative = await generateSocialTemplatePack({
    listing,
    sourceImageUrl: listing.images[0],
    platform: "instagram",
    tone: "professional",
    templateId: "stay_carousel",
    includePrice: true,
    includeSpecialOffer: false,
    customHeadline: "",
    env: { IDEAL_STAY_APP_URL: "https://idealstay.co.za" },
    imageDnsLookup: publicImageDnsLookup,
  });

  assert.equal(creative.templateId, "stay_carousel");
  assert.equal(creative.assets.length, 5);
  assert.equal(creative.assets[0]?.label, "Slide 1");
  assert.equal(creative.assets[4]?.label, "Slide 5");
});

test("social template image fetch refuses redirects", async () => {
  installFetch(() =>
    new Response(null, {
      status: 302,
      headers: { Location: "http://127.0.0.1:8080/metadata" },
    })
  );

  await assert.rejects(generateSocialTemplatePack(baseCreativeParams()), /redirects are not allowed/);
});

test("social template image fetch rejects non-image responses", async () => {
  installFetch(() =>
    new Response("INTERNAL_METADATA_TOKEN=secret", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  );

  await assert.rejects(generateSocialTemplatePack(baseCreativeParams()), /must be a PNG, JPEG, WebP, or GIF/);
});

test("social template image fetch rejects DNS results for private addresses", async () => {
  let fetchCalled = false;
  Object.defineProperty(globalThis, "fetch", {
    value: async () => {
      fetchCalled = true;
      return new Response(Buffer.from(SAMPLE_PNG_BASE64, "base64"), {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    },
    configurable: true,
    writable: true,
  });

  await assert.rejects(
    generateSocialTemplatePack(
      baseCreativeParams({
        imageDnsLookup: async () => [{ address: "169.254.169.254", family: 4 }],
      })
    ),
    /host is not allowed/
  );
  assert.equal(fetchCalled, false);
});

test("social template image fetch rejects private IPv6 literal hosts", async () => {
  let fetchCalled = false;
  Object.defineProperty(globalThis, "fetch", {
    value: async () => {
      fetchCalled = true;
      return new Response(Buffer.from(SAMPLE_PNG_BASE64, "base64"), {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    },
    configurable: true,
    writable: true,
  });

  await assert.rejects(
    generateSocialTemplatePack(
      baseCreativeParams({
        listing: { ...listing, images: ["https://[::1]/cover.jpg"] },
        sourceImageUrl: "https://[::1]/cover.jpg",
      })
    ),
    /host is not allowed/
  );
  assert.equal(fetchCalled, false);
});

test("social template image fetch enforces the response size limit", async () => {
  installFetch(() =>
    new Response(Buffer.from(SAMPLE_PNG_BASE64, "base64"), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": `${6 * 1024 * 1024}`,
      },
    })
  );

  await assert.rejects(generateSocialTemplatePack(baseCreativeParams()), /too large/);
});
