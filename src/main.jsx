import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// ─── Capacitor deep-link / OAuth callback handler ───────────────────────────
// When the OAuth flow completes, Base44 redirects to:
//   https://<app-domain>/?access_token=<token>   OR
//   rovr://callback?access_token=<token>          (custom scheme)
//
// In a Capacitor WKWebView the page either reloads with the token in the URL
// (web flow) OR the native App plugin fires 'appUrlOpen' (custom-scheme flow).
// Both paths below store the token in localStorage so app-params.js picks it up.

function handleTokenFromUrl(url) {
  try {
    const u = new URL(url);
    const token = u.searchParams.get('access_token');
    if (token) {
      localStorage.setItem('base44_access_token', token);
      // Strip the token from the visible URL to keep things clean
      u.searchParams.delete('access_token');
      window.history.replaceState({}, document.title, u.pathname + (u.search || '') + (u.hash || ''));
      return true;
    }
  } catch (_) {}
  return false;
}

// 1. Check the current URL on every page load (handles web-based OAuth callback)
handleTokenFromUrl(window.location.href);

// 2. Capacitor App plugin — handles custom-scheme deep links (rovr://...)
//    Only runs when the Capacitor runtime is present (native iOS/Android build).
//    We access it via window.Capacitor.Plugins to avoid a hard npm dependency.
if (window.Capacitor?.isNativePlatform?.()) {
  const CapApp = window.Capacitor?.Plugins?.App;
  if (CapApp) {
    CapApp.addListener('appUrlOpen', ({ url }) => {
      if (handleTokenFromUrl(url)) {
        window.location.reload();
      }
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)