import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { initializeTheme } from '@/lib/theme';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Trips from './pages/Trips';
import Groups from './pages/Groups';
import Friends from './pages/Friends';
import Costs from './pages/Costs';
import Profile from './pages/Profile';
import TripDetail from './pages/TripDetail';
import GroupDetail from './pages/GroupDetail';
import JoinInvite from './pages/JoinInvite';
import Notifications from './pages/Notifications';
import OnboardingModal from './components/OnboardingModal';
import RoveSplash from './components/RoveSplash';
import { motion } from 'framer-motion';

const MotionPage = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingOnboard, setCheckingOnboard] = useState(true);
  const [onboardingError, setOnboardingError] = useState(false);
  const [isProfileReady, setIsProfileReady] = useState(false);


  // Initialize theme from preference or system on app load
  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && !authError) {
      base44.auth.me().then(async (me) => {
        setCurrentUser(me);
        // Ensure UserProfile exists before rendering app
        await ensureUserProfile(me);
        setIsProfileReady(true);
        setCheckingOnboard(false);
        window.__roveSplashShown = true;
      }).catch(() => {
        setCheckingOnboard(false);
        setIsProfileReady(true);
        toast.error("Failed to load profile");
      });
    } else if (authError) {
      setCheckingOnboard(false);
      setIsProfileReady(true);
    }
  }, [isLoadingAuth, authError]);

  async function ensureUserProfile(me) {
    try {
      const existing = await base44.entities.UserProfile.filter({ user_id: me.id }, "-created_date", 1);
      const defaultUsername = me.data?.username || me.email.split("@")[0];
      const defaultUsernameLower = defaultUsername.toLowerCase();
      if (existing.length === 0) {
        await base44.entities.UserProfile.create({
          user_id: me.id,
          user_email: me.email,
          username: defaultUsername,
          username_lower: defaultUsernameLower,
          full_name: me.full_name || "",
          display_name: me.full_name || "",
        });
        console.log("[App] UserProfile created for:", me.email);
      } else {
        // Backfill username_lower if missing
        const p = existing[0];
        if (p.username && !p.username_lower) {
          await base44.entities.UserProfile.update(p.id, {
            username_lower: p.username.toLowerCase(),
            full_name: p.full_name || me.full_name || "",
          });
          console.log("[App] Backfilled username_lower for:", me.email);
        }
      }
    } catch (err) {
      console.error("[App] UserProfile ensure failed:", err);
    }
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth || checkingOnboard || !isProfileReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
    {currentUser && !currentUser.onboarded && !onboardingError && (
      <OnboardingModal user={currentUser} onComplete={() => base44.auth.me().then(setCurrentUser).catch(() => setOnboardingError(true))} />
    )}
    {onboardingError && (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="mb-4">Setup encountered an issue.</p>
          <button onClick={() => { setOnboardingError(false); setCurrentUser(null); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    )}
    {!onboardingError && (
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MotionPage><Trips /></MotionPage>} />
        <Route path="/groups" element={<MotionPage><Groups /></MotionPage>} />
        <Route path="/friends" element={<MotionPage><Friends /></MotionPage>} />
        <Route path="/costs" element={<MotionPage><Costs /></MotionPage>} />
        <Route path="/profile" element={<MotionPage><Profile /></MotionPage>} />
        <Route path="/trip/:id" element={<MotionPage><TripDetail /></MotionPage>} />
        <Route path="/group/:id" element={<MotionPage><GroupDetail /></MotionPage>} />
      </Route>
      <Route path="/notifications" element={<MotionPage><Notifications /></MotionPage>} />
      <Route path="/join/:type/:code" element={<MotionPage><JoinInvite /></MotionPage>} />
      <Route path="*" element={<PageNotFound />} />
      </Routes>
      )}
      </>
  );
};


function App() {
  const [showStartupSplash, setShowStartupSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStartupSplash(false);
      window.__roveSplashShown = true;
    }, 1300);
    return () => clearTimeout(timer);
  }, []);

  if (showStartupSplash) {
    return <RoveSplash onFinish={() => setShowStartupSplash(false)} duration={1300} />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="text-center max-w-sm">
            <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-4">Please refresh the page to try again.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App