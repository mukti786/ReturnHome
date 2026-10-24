import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CircleAlert, ShieldAlert } from 'lucide-react';
import Logo from '../components/branding/Logo';
import Footer from '../components/layout/Footer';

const PublicReportPage: React.FC = () => (
  <div className="flex min-h-screen flex-col bg-[#f8f8f5] text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" aria-label="ReturnHome home"><Logo variant="full" theme="dark" size="md" showTagline={false} /></Link>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"><ArrowLeft size={16} /> Home</Link>
      </div>
    </header>

    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:px-8 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#356a5a]">Public reporting information</p>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">We can’t receive a report here yet.</h1>
      <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">We’re glad you’re looking for a way to help. This ReturnHome prototype has no public intake form and does not send information to law enforcement. Nothing you enter on this site would create an official report.</p>

      <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-7" aria-labelledby="urgent-guidance">
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800"><CircleAlert size={21} /></div>
          <div>
            <h2 id="urgent-guidance" className="text-base font-semibold text-slate-900">If someone may be in immediate danger</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Contact your local emergency services now. ReturnHome is not monitored and cannot dispatch help.</p>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="next-steps">
        <h2 id="next-steps" className="text-xl font-semibold tracking-tight text-slate-900">For an official report or to share information</h2>
        <ol className="mt-5 space-y-4">
          <li className="flex gap-4 border-t border-slate-200 pt-4"><span className="text-xs font-semibold tracking-wide text-[#356a5a]">01</span><p className="text-sm leading-6 text-slate-600">Contact the appropriate local law-enforcement agency directly and follow its instructions for making a report.</p></li>
          <li className="flex gap-4 border-t border-slate-200 pt-4"><span className="text-xs font-semibold tracking-wide text-[#356a5a]">02</span><p className="text-sm leading-6 text-slate-600">Share any relevant information through that agency’s official contact channels. This prototype does not collect, store, or forward tips.</p></li>
        </ol>
      </section>

      <aside className="mt-10 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
        <ShieldAlert size={18} className="mt-1 shrink-0 text-[#356a5a]" />
        <p>Please don’t enter names, contact details, photographs, precise locations, or other sensitive information into this prototype.</p>
      </aside>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1d5147] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163f37]">Return to ReturnHome <ArrowRight size={16} /></Link>
        <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Investigator Sign In</Link>
      </div>
    </main>
    <Footer />
  </div>
);

export default PublicReportPage;

