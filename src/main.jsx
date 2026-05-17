import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// ─── OAuth token bootstrap ────────────────────────────────────────────────────
//
// FLOWS:
//
// A) Web:
//    Google auth finishes → Base44 redirects to https://<app>/?access_token=<t>
//    handleTokenFromUrl() runs immediately on page load and stores the token.
//
// B) Native iOS (ASWebAuthenticationSession):
//    1. ASWebAuth.swift opens ASWebAuthenticationSession with the Base44 auth URL
//    2. Google auth completes → Base44 redirects to:
//         https://<app>/?access_token=<token>
//    3. Because ASWebAuthenticationSession uses callbackURLScheme="rovr", iOS
//       intercepts any redirect that starts with rovr:// — BUT Base44 returns an
//       https:// redirect, so the session just completes and returns the full URL
//       to our Swift completion handler.
//    4. The Swift resolve({ url }) result lands back in navigateToLogin() in
//       AuthContext, which calls handleTokenFromUrl(result.url) directly.
//
// So for native we handle the token in AuthContext (result.url from the plugin),
// and here we only need the web fallback + the appUrlOpen safety net.

function handleTokenFromUrl(url) {
  try {
    const u = new URL(url);
    const token = u.searchParams.get('access_token');
    if (token) {
      localStorage.setItem('base44_access_token', token);
      // Remove token from visible URL (web only — on native there's no address bar)
      try {
        u.searchParams.delete('access_token');
        window.history.replaceState({}, document.title, u.pathname + (u.search || '') + (u.hash || ''));
      } catch (_) {}
      return true;
    }
  } catch (_) {}
  return false;
}

// Web flow: parse token from current URL on every page load
handleTokenFromUrl(window.location.href);

// Native safety net: if the OS delivers the callback URL via appUrlOpen
// (e.g. a Universal Link or custom scheme fallback), capture it here too.
if (window.Capacitor?.isNativePlatform?.()) {
  const CapApp = window.Capacitor?.Plugins?.App;
  if (CapApp) {
    CapApp.addListener('appUrlOpen', ({ url }) => {
      if (handleTokenFromUrl(url)) {
        window.dispatchEvent(new CustomEvent('base44:token-received'));
      }
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)