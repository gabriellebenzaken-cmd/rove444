import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// ─── Native iOS token refresh ────────────────────────────────────────────────
// When a user completes Google OAuth in Safari and the deep-link callback fires,
// main.jsx stores the token in localStorage and dispatches 'base44:token-received'.
// The SDK client was created with the old (null) token, so we must update it.
// The SDK exposes setToken() on the client — if it doesn't, we patch the internal
// axios headers directly as a fallback.
window.addEventListener('base44:token-received', () => {
  const newToken = localStorage.getItem('base44_access_token');
  if (!newToken) return;
  if (typeof base44.setToken === 'function') {
    base44.setToken(newToken);
  } else if (base44.client?.defaults?.headers) {
    // Patch axios Authorization header directly
    base44.client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }
});