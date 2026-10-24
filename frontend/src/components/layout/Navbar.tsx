import React, { useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const handleSignOut = async () => {
    setSigningOut(true);
    setError('');
    try {
      await logout();
      navigate('/', { replace: true });
    } catch {
      setError('Could not end your server session. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  return <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6">
    <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf2ed] text-[#356a5a]"><ShieldCheck size={18} /></div><div><p className="text-sm font-semibold text-slate-900">Investigation workspace</p><p className="text-[11px] text-slate-500">Access is tied to your approved account</p></div></div>
    <div className="flex items-center gap-3 sm:gap-5"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{user?.name || 'Investigator'}</p><p className="text-xs text-slate-500">{user?.role || 'Authorized user'}</p></div><button type="button" onClick={handleSignOut} disabled={signingOut} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356a5a] disabled:opacity-60" title="Sign out"><LogOut size={16} /><span className="hidden sm:inline">{signingOut ? 'Signing out…' : 'Sign out'}</span></button></div>
    {error && <p role="alert" className="absolute right-4 top-full mt-2 max-w-xs rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 shadow-lg">{error}</p>}
  </header>;
};
export default Navbar;


