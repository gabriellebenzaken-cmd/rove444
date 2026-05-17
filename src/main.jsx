import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// ─── OAuth token bootstrap ────────────────────────────────────────────────────
//
// NATIVE iOS FLOW:
//   1. navigateToLogin() (AuthContext) opens Browser.open() with:
//      https://travelrovr.base44.app/login?from_url=rovr%3A%2F%2Fauth%2Fcallback
//   2. User logs in inside SFSafariViewController
//   3. Base44 redirects to: rovr://auth/callback?access_token=<token>
//   4. iOS intercepts the rovr:// URL → fires appUrlOpen in the Capacitor WebView
//   5. appUrlOpen handler below: stores token, closes Browser sheet, dispatches
//      'base44:token-received' → AuthContext.checkAppState() re-runs → user logged in
//
// WEB FLOW:
//   Google auth finishes → Base44 redirects to https://<app>/?access_token=<t>
//   handleTokenFromUrl() runs immediately on page load and stores the token.

function handleTokenFromUrl(url) {
  try {
    // Normalise rovr://... → parseable URL so URLSearchParams works on it
    const normalised = url.replace(/^rovr:\/\//, 'https://rovr.app/');
    const u = new URL(normalised);
    const token = u.searchParams.get('access_token');
    if (token) {
      localStorage.setItem('base44_access_token', token);
      // Clean token from the visible address bar (web only)
      try {
        const orig = new URL(url);
        orig.searchParams.delete('access_token');
        window.history.replaceState({}, document.title, orig.pathname + (orig.search || '') + (orig.hash || ''));
      } catch (_) {}
      return true;
    }
  } catch (_) {}
  return false;
}

// Web flow: parse token from the landing URL on every page load
handleTokenFromUrl(window.location.href);

// Native flow: iOS fires appUrlOpen when the rovr:// deep-link is intercepted.
// This is the ONLY way the token gets back into the native app after Browser.open().
if (window.Capacitor?.isNativePlatform?.()) {
  const CapApp = window.Capacitor?.Plugins?.App;
  if (CapApp) {
    CapApp.addListener('appUrlOpen', async ({ url }) => {
      console.log('[Auth] appUrlOpen received:', url);
      if (handleTokenFromUrl(url)) {
        console.log('[Auth] Token stored from deep-link, closing browser sheet');
        // Close the SFSafariViewController
        try {
          const { Browser } = await import('@capacitor/browser');
          await Browser.close();
        } catch (_) {}
        // Tell AuthContext to re-run checkAppState() with the new token
        window.dispatchEvent(new CustomEvent('base44:token-received'));
      }
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)