import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// ─── Token bootstrap (web only) ──────────────────────────────────────────────
//
// WEB FLOW: Base44 login redirects back to https://<app>/?access_token=<t>
// Parse and store it immediately so the SDK picks it up.
//
// NATIVE FLOW: auth is handled entirely in-app via NativeLoginScreen using
// base44.auth.loginViaEmailPassword() / register() / verifyOtp() — the SDK
// stores the token directly in localStorage with no redirect needed.

function handleTokenFromUrl(url) {
  try {
    const u = new URL(url);
    const token = u.searchParams.get('access_token');
    if (token) {
      localStorage.setItem('base44_access_token', token);
      u.searchParams.delete('access_token');
      window.history.replaceState({}, document.title, u.pathname + (u.search || '') + (u.hash || ''));
      return true;
    }
  } catch (_) {}
  return false;
}

// Parse token from landing URL on web page load
if (!window.Capacitor?.isNativePlatform?.()) {
  handleTokenFromUrl(window.location.href);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)