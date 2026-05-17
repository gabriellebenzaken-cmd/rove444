import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { toast } from 'sonner';

// The production web URL — Base44 will redirect the token here after login,
// and our appUrlOpen / handleTokenFromUrl listeners will pick it up.
const PRODUCTION_URL = 'https://travelrovr.base44.app';

function isNative() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
}

// Returns the most up-to-date token — prefers localStorage over the snapshot
// taken at app boot, so deep-link token deliveries are picked up correctly.
function getLiveToken() {
  return localStorage.getItem('base44_access_token') || appParams.token;
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();

    // Native iOS: when the deep-link OAuth callback fires (appUrlOpen in main.jsx),
    // it dispatches this event so we re-validate the newly-stored token without
    // needing a full page reload (which would lose React state).
    const onTokenReceived = () => {
      checkAppState();
    };
    window.addEventListener('base44:token-received', onTokenReceived);
    return () => window.removeEventListener('base44:token-received', onTokenReceived);
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // On native Capacitor the app runs from file:// — relative URLs don't reach
      // the Base44 server. Always use the absolute production URL.
      const apiBase = isNative()
        ? `${PRODUCTION_URL}/api/apps/public`
        : `/api/apps/public`;

      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: apiBase,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: getLiveToken(), // Use live token so deep-link tokens are honoured
        interceptResponses: true
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        
        // Use getLiveToken() so deep-link tokens are picked up after initial boot
        if (getLiveToken()) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          // On native with no token, set auth_required immediately so App.jsx
          // triggers the Browser.open login flow without waiting for further API calls.
          if (isNative()) {
            setAuthError({ type: 'auth_required', message: 'Authentication required' });
          }
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      console.log('[Auth] Calling base44.auth.me()...');
      const currentUser = await base44.auth.me();
      console.log('[Auth] base44.auth.me() success:', currentUser);
      
      // HARD STOP: User must have email/id
      if (!currentUser || !currentUser.email || !currentUser.id) {
        console.error('[Auth] HARD STOP: User missing email or id:', currentUser);
        localStorage.removeItem('base44_access_token');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthError({
          type: 'auth_required',
          message: 'Invalid user session. Please sign in again.'
        });
        return;
      }
      
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('[Auth] HARD STOP: User auth check failed:', error);
      // Clear stale token
      localStorage.removeItem('base44_access_token');
      setUser(null);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_required',
        message: 'Authentication required. Please sign in.'
      });
    }
  };

  const logout = (shouldRedirect = true) => {
    console.log('[Auth] Logging out...');
    // Clear token before logout
    localStorage.removeItem('base44_access_token');
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = async () => {
    if (isNative()) {
      // On native iOS, window.location.href redirects inside the Capacitor WebView
      // which can't load Base44's login page properly (wrong origin, no cookies, etc).
      // Instead, open the full Base44 login page in a native SFSafariViewController
      // via the Capacitor Browser plugin. Base44 will redirect back to PRODUCTION_URL
      // after login, and our appUrlOpen listener in main.jsx captures the token.
      try {
        const { Browser } = await import('@capacitor/browser');
        const fromUrl = encodeURIComponent(PRODUCTION_URL + '/');
        const loginUrl = `${PRODUCTION_URL}/login?from_url=${fromUrl}`;
        console.log('[Auth] Opening native browser for login:', loginUrl);
        await Browser.open({ url: loginUrl, presentationStyle: 'fullscreen' });

        // Listen for the token to arrive via the rovr:// deep-link (appUrlOpen in main.jsx)
        const onTokenReceived = async () => {
          window.removeEventListener('base44:token-received', onTokenReceived);
          try { await Browser.close(); } catch (_) {}
          await checkAppState();
        };
        window.addEventListener('base44:token-received', onTokenReceived);
      } catch (err) {
        console.error('[Auth] Native browser open failed, falling back:', err);
        // Last-resort fallback: let Base44 SDK handle it (may open in-app)
        base44.auth.redirectToLogin(PRODUCTION_URL + '/');
      }
    } else {
      // Web: standard redirect — Base44 login page returns user to current URL
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};