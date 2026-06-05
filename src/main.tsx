import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const CANONICAL_HOST = "www.idealstay.co.za";

if (typeof window !== "undefined") {
  const { hostname, protocol, pathname, search, hash } = window.location;
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local");
  const isCanonicalHost = hostname === CANONICAL_HOST;

  if (!isLocalhost && !isCanonicalHost) {
    window.location.replace(`${protocol}//${CANONICAL_HOST}${pathname}${search}${hash}`);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
