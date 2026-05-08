let googleMapsScriptPromise: Promise<void> | null = null;

export interface GoogleMapsWindow {
  accounts?: any;
  maps?: any;
}

declare global {
  interface Window {
    google?: GoogleMapsWindow;
  }
}

export function getGoogleMapsApiKey() {
  return `${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`.trim();
}

export async function loadGoogleMapsScript(libraries: string[] = []) {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.google?.maps) {
    return;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY.');
  }

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Google Maps script failed to load.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      const params = new URLSearchParams({
        key: apiKey,
        v: 'weekly',
      });

      if (libraries.length > 0) {
        params.set('libraries', libraries.join(','));
      }

      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Maps script failed to load.'));
      document.head.appendChild(script);
    });
  }

  return googleMapsScriptPromise;
}
