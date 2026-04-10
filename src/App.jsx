import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingOnboard, setCheckingOnboard] = useState(true);
  const [onboardingError, setOnboardingError] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && !authError) {
      base44.auth.me().then((me) => {
        setCurrentUser(me);
        setCheckingOnboard(false);
      }).catch(() => {
        setCheckingOnboard(false);
        toast.error("Failed to load profile");
      });
    } else if (authError) {
      setCheckingOnboard(false);
    }
  }, [isLoadingAuth, authError]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth || checkingOnboard) {
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
        <Route path="/" element={<Trips />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/costs" element={<Costs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/trip/:id" element={<TripDetail />} />
        <Route path="/group/:id" element={<GroupDetail />} />
      </Route>
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/join/:type/:code" element={<JoinInvite />} />
      <Route path="*" element={<PageNotFound />} />
      </Routes>
      )}
      </>
  );
};


function App() {
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