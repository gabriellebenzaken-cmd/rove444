import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// On native Capacitor the WebView serves from file:// — relative URLs won't
// reach the Base44 server. Use the absolute production URL instead.
const isNativePlatform = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
const serverUrl = isNativePlatform ? 'https://base44.app' : '';

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl,
  requiresAuth: false,
  appBaseUrl
});