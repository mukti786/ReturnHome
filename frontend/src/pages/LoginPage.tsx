import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import Logo from '../components/branding/Logo';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginGoogle, loginDemo, authStartupError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const devDemoEnabled = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await login(email, password);
      const requestedPath = (location.state as { from?: string } | null)?.from;
      const destination = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setNotice('');
    setGoogleLoading(true);
    try {
      // In local dev/test, provide a simulated token if Google Client ID is not populated
      const simulatedCredential = prompt('Google OAuth Token / Credential (leave empty or type test:email@example.com for dev test):') || '';
      if (!simulatedCredential) {
        setGoogleLoading(false);
        return;
      }
      const message = await loginGoogle(simulatedCredential);
      if (message) {
        setNotice(message);
      } else {
        const requestedPath = (location.state as { from?: string } | null)?.from;
        const destination = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/dashboard';
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google OAuth is unavailable or not configured.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Local demo access is unavailable.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Enter your email address first, then request a password reset.');
      return;
    }
    setError('');
    setNotice('');
    setResetLoading(true);
    try {
      const result = await apiService.requestPasswordReset(email);
      setNotice(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password recovery is unavailable.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#f4f5f1] px-5 py-8 sm:justify-center sm:py-12">
      <Link to="/" className="mx-auto flex w-full max-w-5xl items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Return to home
      </Link>
      <div className="mx-auto mt-8 w-full max-w-md sm:mt-10">
        <div className="text-center">
          <Link to="/">
            <Logo variant="full" theme="dark" size="lg" showTagline={false} />
          </Link>
          <div className="mx-auto mt-7 grid h-11 w-11 place-items-center rounded-xl bg-[#e5ede6] text-[#356a5a]">
            <LockKeyhole size={20} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Sign in to ReturnHome</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Access citizen reporting or authorized investigator cases.
          </p>
        </div>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_48px_-32px_rgba(15,23,42,.32)] sm:p-8">
          {error && (
            <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {!error && authStartupError && (
            <div role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-6 text-amber-950">
              Could not restore the current session: {authStartupError}
            </div>
          )}
          {notice && (
            <div role="status" className="mb-5 rounded-lg border border-[#d8e3d9] bg-[#f4f7f2] px-3.5 py-3 text-sm text-slate-700">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-800">
                Email address
              </label>
              <div className="relative">
                <Mail size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  autoComplete="username"
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-800">
                Password
              </label>
              <div className="relative">
                <LockKeyhole size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-12 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#356a5a]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                disabled={resetLoading}
                className="text-xs font-medium text-[#245c4c] underline-offset-2 hover:underline disabled:opacity-60"
              >
                {resetLoading ? 'Checking availability…' : 'Forgot password?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1d5147] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163f37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5147] disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Google OAuth Section */}
          <div className="mt-5 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 shadow-xs"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting…' : 'Sign in with Google'}</span>
            </button>
          </div>

          {devDemoEnabled && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="min-h-10 w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-60"
              >
                {demoLoading ? 'Opening local demo…' : 'Enter local demo workspace'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl border border-slate-200 bg-white/70 p-3.5 text-xs leading-5 text-slate-600">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#356a5a]" />
          Protected session using secure HTTP-only cookies. Never share your credentials.
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-[#245c4c] hover:underline">
            Register as Citizen or Investigator
          </Link>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
