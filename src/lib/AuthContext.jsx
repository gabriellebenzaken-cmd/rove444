import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { Browser } from '@capacitor/browser';
import { toast } from 'sonner';

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
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
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
    console.log('[Auth] navigateToLogin called');
    const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
    console.log('[Auth] isNative:', isNative);

    // For web: fall back to current origin if env var not set
    const appPublicUrl = import.meta.env.VITE_APP_PUBLIC_URL || window.location.origin;

    try {
      if (isNative) {
        const availablePlugins = Object.keys(window.Capacitor?.Plugins || {});
        console.log('[Auth] Available Capacitor plugins:', availablePlugins);

        const ASWebAuth = window.Capacitor?.Plugins?.ASWebAuth;

        // Build auth URL using the SDK's redirect endpoint
        const callbackUrl = `rovr://auth`;
        const authUrl = `https://app.base44.com/auth?app_id=${appParams.appId}&next=${encodeURIComponent(callbackUrl)}`;

        if (!ASWebAuth) {
          // Plugin not compiled in — fall back to Capacitor Browser plugin
          console.warn('[Auth] ASWebAuth not found — falling back to Browser plugin');
          const { Browser } = await import('@capacitor/browser');
          console.log('[Auth] Opening Browser with URL:', authUrl);
          await Browser.open({ url: authUrl, windowName: '_self' });
          return;
        }

        // ASWebAuthenticationSession path — preferred (no 403 disallowed_useragent)
        console.log('[Auth] Opening ASWebAuthenticationSession with URL:', authUrl);
        const result = await ASWebAuth.open({ url: authUrl, callbackScheme: 'rovr' });
        console.log('[Auth] OAuth session completed, callback URL:', result?.url);

        if (result?.url) {
          try {
            const u = new URL(result.url.replace(/^rovr:\/\//, 'https://rovr.app/'));
            const token = u.searchParams.get('access_token');
            if (token) {
              localStorage.setItem('base44_access_token', token);
              await checkUserAuth();
              return;
            }
          } catch (parseErr) {
            console.error('[Auth] Failed to parse callback URL:', parseErr);
          }
        }
        throw new Error('No access_token found in OAuth callback URL: ' + result?.url);
      } else {
        // Web: use SDK method — redirects to Base44 auth, then back to appPublicUrl
        console.log('[Auth] Web platform — using SDK loginWithProvider, redirecting to:', appPublicUrl);
        await base44.auth.loginWithProvider("google", appPublicUrl);
      }
    } catch (err) {
      console.error('[Auth] navigateToLogin error:', err);
      toast.error('Failed to initiate sign-in. Please try again.');
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