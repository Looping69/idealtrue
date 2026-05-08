let googleIdentityScriptPromise: Promise<void> | null = null;

export function getGoogleClientId() {
  return `${import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}`.trim();
}

export async function loadGoogleIdentityScript() {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.google?.accounts?.id) {
    return;
  }

  if (!googleIdentityScriptPromise) {
    googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Google Identity script failed to load.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Identity script failed to load.'));
      document.head.appendChild(script);
    });
  }

  return googleIdentityScriptPromise;
}
