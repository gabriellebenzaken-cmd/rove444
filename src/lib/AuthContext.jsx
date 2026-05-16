import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
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

  const navigateToLogin = () => {
    console.log('[Auth] navigateToLogin called');
    const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
    console.log('[Auth] isNative:', isNative);

    if (isNative) {
      // ─── CRITICAL for iOS ───────────────────────────────────────────────────
      // Google OAuth BLOCKS requests from embedded web views (WKWebView).
      // We MUST open the login URL in the system Safari browser.
      //
      // Build the Base44 auth URL directly without calling redirectToLogin()
      // to avoid readonly property errors in WKWebView.
      const appPublicUrl = import.meta.env.VITE_APP_PUBLIC_URL;
      const appId = appParams.appId;

      if (!appPublicUrl) {
        console.error('[Auth] VITE_APP_PUBLIC_URL is not set. Set it to your published app domain (e.g., https://rove-travel-mate.base44.app)');
        toast.error('App configuration error. Please contact support.');
        return;
      }

      // Build the Base44 login URL directly
      // The correct auth endpoint is at base44.com (not app.base44.com)
      const loginUrl = `https://base44.com/auth?app_id=${appId}&next=${encodeURIComponent(appPublicUrl)}`;
      console.log('[Auth] Opening auth URL in system Safari:', loginUrl);

      // Open in system Safari — Capacitor intercepts the callback deep link
      try {
        window.open(loginUrl, '_system');
      } catch (err) {
        console.error('[Auth] Failed to open login URL:', err);
        toast.error('Failed to open sign-in. Please try again.');
      }
    } else {
      // Web: standard redirect
      console.log('[Auth] Web platform — redirecting to login');
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