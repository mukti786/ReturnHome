import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import Logo from '../components/branding/Logo';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginDemo, authStartupError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleDemoLogin = async () => {
    setError(''); setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Local demo access is unavailable.');
    } finally { setDemoLoading(false); }
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

  return <main className="flex min-h-screen flex-col bg-[#f4f5f1] px-5 py-8 sm:justify-center sm:py-12">
    <Link to="/" className="mx-auto flex w-full max-w-5xl items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft size={16} /> Return to home</Link>
    <div className="mx-auto mt-8 w-full max-w-md sm:mt-10">
      <div className="text-center"><Link to="/"><Logo variant="full" theme="dark" size="lg" showTagline={false} /></Link><div className="mx-auto mt-7 grid h-11 w-11 place-items-center rounded-xl bg-[#e5ede6] text-[#356a5a]"><LockKeyhole size={20} /></div><h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Investigator sign in</h1><p className="mt-2 text-sm leading-6 text-slate-600">Use an active account approved by your organization.</p></div>
      <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_48px_-32px_rgba(15,23,42,.32)] sm:p-8">
        {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{error}</div>}
        {!error && authStartupError && <div role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-6 text-amber-950">Could not restore the current session: {authStartupError}</div>}
        {notice && <div role="status" className="mb-5 rounded-lg border border-[#d8e3d9] bg-[#f4f7f2] px-3.5 py-3 text-sm text-slate-700">{notice}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-800">Email address</label><div className="relative"><Mail size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="email" name="email" autoComplete="username" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20" placeholder="name@organization.org" /></div></div>
          <div><label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-800">Password</label><div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="password" name="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} required maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-12 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20" placeholder="Your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#356a5a]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
          <div className="flex justify-end"><button type="button" onClick={handleReset} disabled={resetLoading} className="text-sm font-medium text-[#245c4c] underline-offset-2 hover:underline disabled:opacity-60">{resetLoading ? 'Checking availability…' : 'Forgot password?'}</button></div>
          <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#1d5147] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#163f37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5147] disabled:cursor-wait disabled:opacity-60">{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        {devDemoEnabled && <div className="mt-5 border-t border-slate-200 pt-5">
          <button type="button" onClick={handleDemoLogin} disabled={demoLoading} className="min-h-11 w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-60">{demoLoading ? 'Opening local demo…' : 'Enter local demo workspace'}</button>
          <p className="mt-2 text-center text-xs leading-5 text-amber-800">Development only · demo identity is unverified · no MongoDB account</p>
        </div>}
      </div>
      <div className="mt-5 flex items-start gap-2 rounded-xl border border-slate-200 bg-white/70 p-3.5 text-xs leading-5 text-slate-600"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#356a5a]" /> Your session uses a server-issued, HTTP-only cookie. Sign in only on a deployment approved by your organization.</div>
      <p className="mt-6 text-center text-sm text-slate-600">Need access? <Link to="/register" className="font-semibold text-[#245c4c] hover:underline">Request an account</Link></p>
    </div>
  </main>;
};
export default LoginPage;


