export type SearchContextPlace = {
  placeId: string;
  label: string;
  formattedAddress?: string;
  coordinates?: { lat: number; lng: number } | null;
};

const SEARCH_CONTEXT_KEY = "ideal-stay-search-context";

export function persistSearchContext(place: SearchContextPlace | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!place) {
    window.sessionStorage.removeItem(SEARCH_CONTEXT_KEY);
    return;
  }

  window.sessionStorage.setItem(SEARCH_CONTEXT_KEY, JSON.stringify(place));
}

export function readSearchContext(): SearchContextPlace | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(SEARCH_CONTEXT_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SearchContextPlace;
    if (!parsed?.placeId || !parsed?.label) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
