import { getGoogleMapsApiKey } from "./google-maps";

export type GooglePlacePrediction = {
  placeId: string;
  label: string;
  primaryText: string;
  secondaryText: string;
};

export type GooglePlaceDetails = {
  placeId: string;
  label: string;
  formattedAddress: string;
  coordinates: { lat: number; lng: number } | null;
  addressComponents: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
  types: string[];
};

export type GoogleDriveRouteSummary = {
  distanceMeters: number;
  durationSeconds: number;
  distanceLabel: string;
  durationLabel: string;
};

type PlacesAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
};

type PlaceDetailsResponse = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  types?: string[];
};

type RoutesResponse = {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
  }>;
};

function assertGoogleMapsKey() {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY.");
  }
  return apiKey;
}

function buildPlacesHeaders(fieldMask: string) {
  return {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": assertGoogleMapsKey(),
    "X-Goog-FieldMask": fieldMask,
  };
}

export async function fetchPlaceAutocomplete(
  input: string,
  options?: { regionCodes?: string[]; limit?: number },
): Promise<GooglePlacePrediction[]> {
  const query = `${input || ""}`.trim();
  if (!query) {
    return [];
  }

  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: buildPlacesHeaders(
      "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
    ),
    body: JSON.stringify({
      input: query,
      includedRegionCodes: options?.regionCodes?.length ? options.regionCodes : ["za"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Google autocomplete failed with status ${response.status}`);
  }

  const payload = (await response.json()) as PlacesAutocompleteResponse;
  return (payload.suggestions ?? [])
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction): prediction is NonNullable<typeof prediction> => Boolean(prediction?.placeId && prediction.text?.text))
    .slice(0, options?.limit ?? 6)
    .map((prediction) => ({
      placeId: `${prediction.placeId}`,
      label: `${prediction.text?.text || ""}`.trim(),
      primaryText: `${prediction.structuredFormat?.mainText?.text || prediction.text?.text || ""}`.trim(),
      secondaryText: `${prediction.structuredFormat?.secondaryText?.text || ""}`.trim(),
    }));
}

export async function fetchPlaceDetails(placeId: string): Promise<GooglePlaceDetails> {
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: buildPlacesHeaders("id,displayName,formattedAddress,location,addressComponents,types"),
  });

  if (!response.ok) {
    throw new Error(`Google place details failed with status ${response.status}`);
  }

  const payload = (await response.json()) as PlaceDetailsResponse;
  return {
    placeId: `${payload.id || placeId}`,
    label: `${payload.displayName?.text || payload.formattedAddress || ""}`.trim(),
    formattedAddress: `${payload.formattedAddress || ""}`.trim(),
    coordinates:
      typeof payload.location?.latitude === "number" && typeof payload.location?.longitude === "number"
        ? {
            lat: payload.location.latitude,
            lng: payload.location.longitude,
          }
        : null,
    addressComponents: (payload.addressComponents ?? []).map((component) => ({
      longText: `${component.longText || ""}`.trim(),
      shortText: `${component.shortText || ""}`.trim(),
      types: component.types ?? [],
    })),
    types: payload.types ?? [],
  };
}

function parseDurationSeconds(duration: string) {
  const match = /^(\d+)s$/.exec(duration.trim());
  return match ? Number(match[1]) : 0;
}

function formatDurationLabel(totalSeconds: number) {
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours < 1) {
    return `${totalMinutes} min`;
  }

  if (!minutes) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

function formatDistanceLabel(distanceMeters: number) {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(distanceMeters >= 100000 ? 0 : 1)} km`;
  }

  return `${distanceMeters} m`;
}

export async function computeDriveRouteSummary(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<GoogleDriveRouteSummary | null> {
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: buildPlacesHeaders("routes.distanceMeters,routes.duration"),
    body: JSON.stringify({
      origin: {
        location: {
          latLng: {
            latitude: origin.lat,
            longitude: origin.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.lat,
            longitude: destination.lng,
          },
        },
      },
      travelMode: "DRIVE",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google routes failed with status ${response.status}`);
  }

  const payload = (await response.json()) as RoutesResponse;
  const route = payload.routes?.[0];
  if (!route?.distanceMeters || !route.duration) {
    return null;
  }

  const durationSeconds = parseDurationSeconds(route.duration);
  return {
    distanceMeters: route.distanceMeters,
    durationSeconds,
    distanceLabel: formatDistanceLabel(route.distanceMeters),
    durationLabel: formatDurationLabel(durationSeconds),
  };
}

function findAddressComponent(details: GooglePlaceDetails, type: string) {
  return details.addressComponents.find((component) => component.types.includes(type));
}

export function resolveAreaFromPlace(details: GooglePlaceDetails) {
  return (
    findAddressComponent(details, "locality")?.longText ||
    findAddressComponent(details, "sublocality")?.longText ||
    findAddressComponent(details, "administrative_area_level_2")?.longText ||
    ""
  );
}

export function resolveProvinceFromPlace(details: GooglePlaceDetails) {
  return findAddressComponent(details, "administrative_area_level_1")?.longText || "";
}
