import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Logo from '../components/branding/Logo';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('vikram.singh@ReturnHome.gov.in');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Container */}
        <div className="text-center space-y-3">
          <div className="inline-block">
            <Logo variant="full" theme="dark" size="xl" showTagline={true} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white pt-2">
            Investigator Portal Login
          </h2>
          <p className="text-xs text-slate-400">
            Authorized personnel access for missing-person case management & visual evidence review.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ReturnHome.gov.in"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Remember this terminal session</span>
              </label>
              <a href="#forgot" className="text-cyan-400 hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-cyan-900/40 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Investigation Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block">Quick Demo One-Click Login:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setEmail('vikram.singh@ReturnHome.gov.in');
                  setPassword('password123');
                }}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left text-slate-300 transition-all"
              >
                <strong className="block text-cyan-400">Admin/Lead</strong>
                vikram.singh@...
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('ananya.sen@ReturnHome.gov.in');
                  setPassword('password123');
                }}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left text-slate-300 transition-all"
              >
                <strong className="block text-cyan-400">Investigator</strong>
                ananya.sen@...
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <BrandDisclaimer variant="compact" />

        <div className="text-center text-xs text-slate-400">
          Need an investigator account?{' '}
          <Link to="/register" className="text-cyan-400 font-semibold hover:underline">
            Register your agency profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
