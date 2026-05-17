import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const PRODUCTION_URL = 'https://travelrovr.base44.app';

function isNative() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
}

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
        token: getLiveToken(),
        interceptResponses: true
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        
        if (getLiveToken()) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
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

  const logout = () => {
    localStorage.removeItem('base44_access_token');
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: 'auth_required', message: 'Authentication required' });
    base44.auth.logout();
  };

  const navigateToLogin = () => {
    if (!isNative()) {
      // Web: standard redirect — Base44 login page returns user to current URL
      base44.auth.redirectToLogin(window.location.href);
    }
    // On native: AuthContext consumers check isNative() + !user to show NativeLoginScreen inline.
    // No redirect needed — the in-app login form calls base44.auth.loginViaEmailPassword()
    // directly, which stores the token in localStorage automatically.
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
      checkAppState,
      isNative,
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