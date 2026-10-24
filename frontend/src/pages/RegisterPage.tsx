import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Eye, EyeOff, Mail, ShieldCheck, UserRound } from 'lucide-react';
import Logo from '../components/branding/Logo';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', organization: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.password.length < 12) return setError('Choose a password with at least 12 characters.');
    if (form.password !== form.confirmPassword) return setError('The passwords do not match.');
    setLoading(true);
    try {
      setSuccess(await register({ name: form.name, email: form.email, organization: form.organization, password: form.password }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your access request.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="flex min-h-screen flex-col bg-[#f4f5f1] px-5 py-8 sm:justify-center sm:py-12">
    <Link to="/" className="mx-auto flex w-full max-w-5xl items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft size={16} /> Return to home</Link>
    <div className="mx-auto mt-8 w-full max-w-lg sm:mt-10"><div className="text-center"><Link to="/"><Logo variant="full" theme="dark" size="lg" showTagline={false} /></Link><div className="mx-auto mt-7 grid h-11 w-11 place-items-center rounded-xl bg-[#e5ede6] text-[#356a5a]"><UserRound size={20} /></div><h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Request investigator access</h1><p className="mt-2 text-sm leading-6 text-slate-600">Requests are stored for review. An administrator must activate access before you can sign in.</p></div>
      <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_48px_-32px_rgba(15,23,42,.32)] sm:p-8">
        {success ? <div role="status" className="space-y-5"><div className="rounded-lg border border-[#d8e3d9] bg-[#f4f7f2] p-4 text-sm leading-6 text-slate-700"><p className="font-semibold text-slate-900">Request submitted</p><p className="mt-1">{success}</p></div><Link to="/login" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1d5147] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163f37]">Back to sign in</Link></div> : <>
          {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div><label htmlFor="name" className="mb-1.5 block text-sm font-medium">Full name</label><div className="relative"><UserRound size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="name" required maxLength={100} autoComplete="name" value={form.name} onChange={(e) => update('name', e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20" placeholder="Your full name" /></div></div>
            <div><label htmlFor="email" className="mb-1.5 block text-sm font-medium">Work email</label><div className="relative"><Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="email" type="email" required maxLength={254} autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20" placeholder="name@organization.org" /></div></div>
            <div><label htmlFor="organization" className="mb-1.5 block text-sm font-medium">Organization</label><div className="relative"><Building2 size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="organization" required maxLength={160} value={form.organization} onChange={(e) => update('organization', e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20" placeholder="Agency or organization" /></div></div>
            <div><label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password <span className="font-normal text-slate-500">(12 characters minimum)</span></label><div className="relative"><input id="password" type={showPassword ? 'text' : 'password'} required minLength={12} maxLength={128} autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 py-2 pl-3 pr-12 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20" placeholder="Create a password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
            <div><label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">Confirm password</label><input id="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#356a5a] focus:ring-2 focus:ring-[#356a5a]/20" placeholder="Enter the password again" /></div>
            <button type="submit" disabled={loading} className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#1d5147] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163f37] disabled:cursor-wait disabled:opacity-60">{loading ? 'Submitting request…' : 'Submit access request'}</button>
          </form>
        </>}
      </div>
      <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0" /> Requests are created as pending accounts and cannot sign in until approved.</div>
      <p className="mt-6 text-center text-sm text-slate-600">Already have approved access? <Link to="/login" className="font-semibold text-[#245c4c] hover:underline">Sign in</Link></p>
    </div>
  </main>;
};
export default RegisterPage;


