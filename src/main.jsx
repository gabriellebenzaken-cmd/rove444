import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// ─── Capacitor / OAuth token bootstrap ──────────────────────────────────────
//
// FLOW (native iOS):
//   1. User taps "Sign in with Google"
//   2. navigateToLogin() calls window.open(loginUrl, '_system') → opens Safari
//   3. Google auth completes → Base44 redirects to:
//        https://<app-domain>/?access_token=<token>
//   4. Capacitor intercepts the deep link and fires appUrlOpen with that URL
//   5. handleTokenFromUrl() stores the token in localStorage under the key
//        that app-params.js expects: "base44_access_token"
//   6. We call checkAppState() on the AuthContext to re-validate without
//        a full page reload (which would lose the in-memory React tree).
//
// FLOW (web):
//   The browser navigates to the return URL with ?access_token= in the URL.
//   app-params.js reads it on import (step below).

function handleTokenFromUrl(url) {
  try {
    const u = new URL(url);
    const token = u.searchParams.get('access_token');
    if (token) {
      // Store under the key app-params.js uses (base44_<snake_case(access_token)>)
      localStorage.setItem('base44_access_token', token);
      // Strip from visible URL
      u.searchParams.delete('access_token');
      window.history.replaceState({}, document.title, u.pathname + (u.search || '') + (u.hash || ''));
      return true;
    }
  } catch (_) {}
  return false;
}

// 1. Web flow: check the current URL on every page load
handleTokenFromUrl(window.location.href);

// 2. Native flow: listen for deep-link callbacks via Capacitor App plugin
//    We use window.Capacitor.Plugins.App to avoid a hard npm dependency on
//    @capacitor/app (which isn't installed in this project).
//    When the token arrives we dispatch a custom event so AuthContext can
//    re-run checkAppState() without a full page reload.
if (window.Capacitor?.isNativePlatform?.()) {
  const CapApp = window.Capacitor?.Plugins?.App;
  if (CapApp) {
    CapApp.addListener('appUrlOpen', ({ url }) => {
      if (handleTokenFromUrl(url)) {
        // Signal AuthContext to re-check auth state with the new token
        window.dispatchEvent(new CustomEvent('base44:token-received'));
      }
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)