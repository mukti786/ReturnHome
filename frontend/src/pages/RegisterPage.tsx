import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Eye, EyeOff, Mail, ShieldCheck, UserRound, Phone, UserPlus } from 'lucide-react';
import Logo from '../components/branding/Logo';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, registerCitizen, loginGoogle } = useAuth();

  const [accountType, setAccountType] = useState<'Citizen' | 'Investigator'>('Citizen');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 12) return setError('Choose a password with at least 12 characters.');
    if (form.password !== form.confirmPassword) return setError('The passwords do not match.');

    setLoading(true);
    try {
      if (accountType === 'Citizen') {
        const msg = await registerCitizen({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone
        });
        setSuccess(msg || 'Citizen account created! You can now sign in to file reports and track sightings.');
      } else {
        const msg = await register({
          name: form.name,
          email: form.email,
          organization: form.organization,
          password: form.password,
          phone: form.phone
        });
        setSuccess(msg || 'Access request received. An administrator must activate the account before sign-in.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setSuccess('');
    setGoogleLoading(true);
    try {
      const simulatedCredential = prompt('Google OAuth Token / Credential (or test:email@example.com for dev test):') || '';
      if (!simulatedCredential) {
        setGoogleLoading(false);
        return;
      }
      const message = await loginGoogle(simulatedCredential, accountType, form.organization);
      if (message) {
        setSuccess(message);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google OAuth registration failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#f4f5f1] px-5 py-8 sm:justify-center sm:py-12">
      <Link to="/" className="mx-auto flex w-full max-w-5xl items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Return to home
      </Link>
      <div className="mx-auto mt-8 w-full max-w-lg sm:mt-10">
        <div className="text-center">
          <Link to="/">
            <Logo variant="full" theme="dark" size="lg" showTagline={false} />
          </Link>
          <div className="mx-auto mt-7 grid h-11 w-11 place-items-center rounded-xl bg-[#e5ede6] text-[#356a5a]">
            <UserPlus size={20} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            Create an Account on ReturnHome
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Register as a Citizen or apply for verified Investigator access.
          </p>
        </div>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_48px_-32px_rgba(15,23,42,.32)] sm:p-8">
          {/* Account Type Toggle */}
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => { setAccountType('Citizen'); setError(''); }}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                accountType === 'Citizen'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Citizen Account
            </button>
            <button
              type="button"
              onClick={() => { setAccountType('Investigator'); setError(''); }}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                accountType === 'Investigator'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Investigator Access
            </button>
          </div>

          {accountType === 'Citizen' ? (
            <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <strong>Citizen Account:</strong> File missing person reports, upload photos, track investigation status, and submit sighting reports directly. Immediate access.
            </div>
          ) : (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <strong>Investigator Account:</strong> Access live detection feeds, review video evidence, verify potential matches, and manage cases. Requires administrator approval.
            </div>
          )}

          {success ? (
            <div role="status" className="space-y-5">
              <div className="rounded-lg border border-[#d8e3d9] bg-[#f4f7f2] p-4 text-sm leading-6 text-slate-700">
                <p className="font-semibold text-slate-900">Registration Complete</p>
                <p className="mt-1">{success}</p>
              </div>
              <Link
                to="/login"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1d5147] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163f37]"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserRound size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="name"
                      required
                      maxLength={100}
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      className="min-h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {accountType === 'Investigator' ? 'Agency Email' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className="min-h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Contact Phone Number <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="phone"
                      type="tel"
                      maxLength={40}
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      className="min-h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20"
                      placeholder="+1 (555) 019-2834"
                    />
                  </div>
                </div>

                {accountType === 'Investigator' && (
                  <div>
                    <label htmlFor="organization" className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Law Enforcement / Investigation Agency
                    </label>
                    <div className="relative">
                      <Building2 size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="organization"
                        required
                        maxLength={160}
                        value={form.organization}
                        onChange={(e) => update('organization', e.target.value)}
                        className="min-h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20"
                        placeholder="Agency Name or Police Department"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password <span className="font-normal text-slate-400">(12+ characters)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      className="min-h-10 w-full rounded-lg border border-slate-300 py-2 pl-3 pr-12 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20"
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-100"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    className="min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20"
                    placeholder="Enter password again"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1d5147] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#163f37] disabled:cursor-wait disabled:opacity-60 transition-colors"
                >
                  {loading
                    ? 'Submitting…'
                    : accountType === 'Citizen'
                    ? 'Create Citizen Account'
                    : 'Submit Investigator Request'}
                </button>
              </form>

              {/* Google OAuth Option */}
              <div className="mt-4 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading}
                  className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 shadow-xs"
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
                  <span>
                    {googleLoading ? 'Connecting…' : `Register with Google as ${accountType}`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#245c4c] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default RegisterPage;
