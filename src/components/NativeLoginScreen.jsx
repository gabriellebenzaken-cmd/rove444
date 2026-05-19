import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Small inline legal link — works in both web and native (opens route in same view)
const LegalLink = ({ to, children }) => (
  <Link
    to={to}
    className="underline"
    style={{ color: '#C8A27C', textDecoration: 'underline' }}
  >
    {children}
  </Link>
);

// Screens
const SCREEN = {
  LOGIN: 'login',
  REGISTER: 'register',
  OTP: 'otp',
  FORGOT: 'forgot',
  RESET_SENT: 'reset_sent',
};

export default function NativeLoginScreen({ onSuccess }) {
  const [screen, setScreen] = useState(SCREEN.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const clearError = () => setError('');

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true); clearError();
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      onSuccess();
    } catch (err) {
      setError(err?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullName) { setError('Please fill in all fields.'); return; }
    setLoading(true); clearError();
    try {
      await base44.auth.register({ email, password, full_name: fullName });
      setScreen(SCREEN.OTP);
    } catch (err) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP verify ─────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) { setError('Please enter the verification code.'); return; }
    setLoading(true); clearError();
    try {
      await base44.auth.verifyOtp(email, otp);
      onSuccess();
    } catch (err) {
      setError(err?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true); clearError();
    try { await base44.auth.resendOtp(email); } catch (_) {}
    setLoading(false);
  };

  // ── Forgot password ────────────────────────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true); clearError();
    try {
      await base44.auth.resetPasswordRequest(email);
      setScreen(SCREEN.RESET_SENT);
    } catch (err) {
      setError(err?.message || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared field style ─────────────────────────────────────────────────────
  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
    bg-white dark:bg-[#1e1e2e] border-[#e2d9ce] dark:border-[#2a2a3a]
    text-[#1a1a1a] dark:text-[#f0ead8] placeholder-[#b0a090] dark:placeholder-[#6a6a7a]
    focus:border-[#C8A27C] focus:ring-2 focus:ring-[#C8A27C]/20`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f7f3ee] dark:bg-[#12121a] px-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <p className="text-3xl font-bold tracking-[-0.04em] text-[#1a1a1a] dark:text-[#f0ead8]">
          ROVR
        </p>
        <p className="text-xs tracking-widest uppercase text-[#C8A27C] mt-1">
          Plan together, travel better
        </p>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-[#1a1a26] rounded-2xl shadow-lg p-6">
        {/* ── LOGIN ── */}
        {screen === SCREEN.LOGIN && (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1a1a1a] dark:text-[#f0ead8] mb-1">Sign in</h2>
            <input className={inputCls} type="email" placeholder="Email" value={email}
              onChange={e => { setEmail(e.target.value); clearError(); }} autoComplete="email" />
            <div className="relative">
              <input className={inputCls} type={showPassword ? 'text' : 'password'} placeholder="Password"
                value={password} onChange={e => { setPassword(e.target.value); clearError(); }} autoComplete="current-password" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0a090]"
                onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: '#C8A27C' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
            {/* Legal notice — login */}
            <p className="text-center leading-relaxed" style={{ fontSize: 11, color: '#9a8a7a' }}>
              By continuing, you agree to our{' '}
              <LegalLink to="/terms">Terms of Service</LegalLink>,{' '}
              <LegalLink to="/privacy">Privacy Policy</LegalLink>, and{' '}
              <LegalLink to="/guidelines">Community Guidelines</LegalLink>.
            </p>
            <button type="button" className="w-full text-xs text-[#C8A27C] text-center"
              onClick={() => { setScreen(SCREEN.FORGOT); clearError(); }}>
              Forgot password?
            </button>
            <div className="border-t border-[#e2d9ce] dark:border-[#2a2a3a] pt-4">
              <button type="button"
                className="w-full py-3 rounded-xl font-semibold text-sm border border-[#C8A27C] text-[#C8A27C]"
                onClick={() => { setScreen(SCREEN.REGISTER); clearError(); setAgreedToTerms(false); }}>
                Create account
              </button>
            </div>
          </form>
        )}

        {/* ── REGISTER ── */}
        {screen === SCREEN.REGISTER && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <button type="button" onClick={() => { setScreen(SCREEN.LOGIN); clearError(); }}>
                <ArrowLeft className="w-4 h-4 text-[#9a8a7a]" />
              </button>
              <h2 className="text-lg font-semibold text-[#1a1a1a] dark:text-[#f0ead8]">Create account</h2>
            </div>
            <input className={inputCls} type="text" placeholder="Full name" value={fullName}
              onChange={e => { setFullName(e.target.value); clearError(); }} autoComplete="name" />
            <input className={inputCls} type="email" placeholder="Email" value={email}
              onChange={e => { setEmail(e.target.value); clearError(); }} autoComplete="email" />
            <div className="relative">
              <input className={inputCls} type={showPassword ? 'text' : 'password'} placeholder="Password"
                value={password} onChange={e => { setPassword(e.target.value); clearError(); }} autoComplete="new-password" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0a090]"
                onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}

            {/* Required consent checkbox */}
            <label
              className="flex items-start gap-2.5 cursor-pointer select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => setAgreedToTerms(v => !v)}
                  className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                  style={{
                    borderColor: agreedToTerms ? '#C8A27C' : '#c0b0a0',
                    background: agreedToTerms ? '#C8A27C' : 'transparent',
                  }}
                >
                  {agreedToTerms && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#9a8a7a', lineHeight: 1.5 }}>
                I agree to the{' '}
                <LegalLink to="/terms">Terms of Service</LegalLink>,{' '}
                <LegalLink to="/privacy">Privacy Policy</LegalLink>, and{' '}
                <LegalLink to="/guidelines">Community Guidelines</LegalLink>.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-opacity"
              style={{ background: '#C8A27C', opacity: (!agreedToTerms || loading) ? 0.45 : 1 }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        )}

        {/* ── OTP ── */}
        {screen === SCREEN.OTP && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1a1a1a] dark:text-[#f0ead8] mb-1">Verify email</h2>
            <p className="text-xs text-[#9a8a7a]">We sent a code to <strong>{email}</strong></p>
            <input className={inputCls} type="text" placeholder="Verification code" value={otp}
              onChange={e => { setOtp(e.target.value); clearError(); }} inputMode="numeric" />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: '#C8A27C' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>
            <button type="button" className="w-full text-xs text-[#C8A27C] text-center" onClick={handleResendOtp}>
              Resend code
            </button>
          </form>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {screen === SCREEN.FORGOT && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <button type="button" onClick={() => { setScreen(SCREEN.LOGIN); clearError(); }}>
                <ArrowLeft className="w-4 h-4 text-[#9a8a7a]" />
              </button>
              <h2 className="text-lg font-semibold text-[#1a1a1a] dark:text-[#f0ead8]">Reset password</h2>
            </div>
            <p className="text-xs text-[#9a8a7a]">Enter your email and we'll send a reset link.</p>
            <input className={inputCls} type="email" placeholder="Email" value={email}
              onChange={e => { setEmail(e.target.value); clearError(); }} autoComplete="email" />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: '#C8A27C' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* ── RESET SENT ── */}
        {screen === SCREEN.RESET_SENT && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(200,162,124,0.15)' }}>
              <span className="text-2xl">✉️</span>
            </div>
            <h2 className="text-lg font-semibold text-[#1a1a1a] dark:text-[#f0ead8]">Check your email</h2>
            <p className="text-xs text-[#9a8a7a]">A password reset link was sent to <strong>{email}</strong></p>
            <button type="button"
              className="w-full py-3 rounded-xl font-semibold text-sm border border-[#C8A27C] text-[#C8A27C]"
              onClick={() => { setScreen(SCREEN.LOGIN); clearError(); }}>
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}