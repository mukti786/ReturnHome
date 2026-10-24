import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CircleAlert, ShieldAlert } from 'lucide-react';
import Logo from '../components/branding/Logo';
import Footer from '../components/layout/Footer';

const PublicReportPage: React.FC = () => <div className="flex min-h-screen flex-col bg-[#f8f8f5] text-slate-900">
  <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"><Link to="/" aria-label="ReturnHome home"><Logo variant="full" theme="light" size="md" showTagline={false} /></Link><Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"><ArrowLeft size={16} /> Home</Link></div></header>
  <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-14 sm:px-8">
    <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-800"><CircleAlert size={24} /></div>
    <p className="mt-6 text-xs font-semibold uppercase tracking-[.16em] text-[#356a5a]">Public reporting</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Report intake is not connected.</h1>
    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">This prototype does not send reports to an agency or create a real tracking reference. Do not enter personal details, upload photographs, or share information about a missing person here.</p>
    <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldAlert size={18} className="mt-1 shrink-0 text-amber-700" /><p>If someone may be in immediate danger, contact your local emergency services or the appropriate law-enforcement agency directly.</p></div>
    <Link to="/" className="mt-8 inline-flex min-h-11 w-fit items-center justify-center rounded-lg bg-[#1d5147] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163f37]">Return to ReturnHome</Link>
  </main>
  <Footer />
</div>;

export default PublicReportPage;


