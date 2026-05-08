import { getGoogleMapsApiKey, loadGoogleMapsScript } from "@/lib/google-maps";

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!getGoogleMapsApiKey()) {
    console.warn("Google Maps is not configured for this environment. Skipping address lookup for:", address);
    return null;
  }

  try {
    await loadGoogleMapsScript();
  } catch (error) {
    console.warn("Google Maps could not be loaded for geocoding:", error);
    return null;
  }

  if (!window.google?.maps?.Geocoder) {
    return null;
  }

  const geocoder = new window.google.maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status !== "OK" || !results?.[0]?.geometry?.location) {
        console.warn("Google geocoding could not resolve address:", { address, status });
        resolve(null);
        return;
      }

      const location = results[0].geometry.location;
      resolve({
        lat: location.lat(),
        lng: location.lng(),
      });
    });
  });
}
