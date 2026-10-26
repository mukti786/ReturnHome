import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ClipboardList, FileSearch, HeartHandshake, MapPinned, Menu, ShieldAlert, UserRoundCheck, X } from 'lucide-react';
import Logo from '../components/branding/Logo';
import Footer from '../components/layout/Footer';

const capabilities = [
  { icon: ClipboardList, title: 'Case records', body: 'Organize missing-person details, reference photos and case updates in the investigator workspace.' },
  { icon: FileSearch, title: 'Candidate review', body: 'Review illustrative candidate records with human judgement. Similarity does not establish identity.' },
  { icon: MapPinned, title: 'Case context', body: 'Use timelines, map views, reports and audit screens to explore investigation workflows.' },
];

const steps = [
  { number: '01', title: 'Public report', body: 'Submit details to this ReturnHome deployment for protected investigator review. It is not an official police report or emergency channel.' },
  { number: '02', title: 'Investigator casework', body: 'Authorized users sign in to manage case records and review the sample investigation screens.' },
  { number: '03', title: 'Human review', body: 'Potential matches are leads for authorized review. They do not confirm a person’s identity.' },
];

export const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const localDemoEnabled = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';
  const investigatorPath = localDemoEnabled ? '/dashboard' : '/login';
  const investigatorAction = localDemoEnabled ? 'Open Local Investigator Demo' : 'Investigator Sign In';

  return (
    <div className="min-h-screen bg-[#f8f8f5] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#f8f8f5]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8" aria-label="Main navigation">
          <Link to="/" aria-label="ReturnHome home"><Logo variant="full" theme="dark" size="md" showTagline={false} /></Link>
          <div className="hidden items-center gap-7 md:flex">
            <a className="text-sm text-slate-600 hover:text-slate-950" href="#about">About</a>
            <a className="text-sm text-slate-600 hover:text-slate-950" href="#workflow">How it works</a>
            <Link className="text-sm text-slate-600 hover:text-slate-950" to="/public-report">Public reporting</Link>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link to={investigatorPath} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">{investigatorAction}</Link>
            <Link to="/public-report" className="inline-flex items-center gap-2 rounded-lg bg-[#1d5147] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#163f37]">Report a Missing Person <ArrowRight size={16} /></Link>
          </div>
          <button type="button" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </nav>
        {menuOpen && <div className="border-t border-slate-200 px-5 py-4 md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-2">
          <a onClick={() => setMenuOpen(false)} className="py-2 text-sm" href="#about">About</a>
          <a onClick={() => setMenuOpen(false)} className="py-2 text-sm" href="#workflow">How it works</a>
          <Link to="/public-report" className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold">Report a Missing Person</Link>
          <Link to={investigatorPath} className="py-2 text-center text-sm font-semibold text-slate-700">{investigatorAction}</Link>
        </div></div>}
      </header>

      <main>
        <section id="about" className="border-b border-slate-200 bg-[#f1f2ec]">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-[#356a5a]"><span className="h-px w-7 bg-[#356a5a]" /> ReturnHome · Public-interest prototype</p>
              <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-[-.045em] text-[#172522] sm:text-6xl lg:text-7xl">Help bring someone home.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Share a missing-person report with this ReturnHome deployment, or open the investigator workspace to review reports and manage casework. Sample investigation records are illustrative and are not operational evidence.</p>
              <a href="#choose-path" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#245c4c] hover:underline">Choose a path <ArrowRight size={16} /></a>
            </div>

            <aside className="border-l border-slate-300 pl-6 sm:pl-8" aria-label="ReturnHome principles">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">Designed around people</p>
              <div className="mt-6 space-y-6">
                <div className="flex gap-4"><HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-[#356a5a]" /><div><h2 className="text-sm font-semibold text-slate-900">A human response comes first</h2><p className="mt-1 text-sm leading-6 text-slate-600">For urgent situations, contact local emergency services directly.</p></div></div>
                <div className="flex gap-4"><UserRoundCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#356a5a]" /><div><h2 className="text-sm font-semibold text-slate-900">Review stays with people</h2><p className="mt-1 text-sm leading-6 text-slate-600">A potential match is only a lead for an authorized reviewer.</p></div></div>
                <div className="flex gap-4"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#356a5a]" /><div><h2 className="text-sm font-semibold text-slate-900">Clear about its limits</h2><p className="mt-1 text-sm leading-6 text-slate-600">Reports are stored here for review when MongoDB is available; nothing is sent to agencies or emergency services.</p></div></div>
              </div>
            </aside>
          </div>
        </section>

        <section id="choose-path" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#356a5a]">Two ways to continue</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Choose the path that fits.</h2></div>
            <div className="grid gap-4 lg:grid-cols-2">
              <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf2ed] text-[#356a5a]"><ClipboardList size={21} /></div><p className="text-xs font-semibold uppercase tracking-[.15em] text-slate-500">Investigator workspace</p></div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">For Investigators</h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Manage missing-person cases, review potential matches, and coordinate investigation workflows in one workspace.</p>
                <div className="mt-auto pt-7"><Link to={investigatorPath} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1d5147] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163f37]">{investigatorAction} <ArrowRight size={16} /></Link>{localDemoEnabled && <p className="mt-3 text-xs font-semibold text-amber-800">Local development only · demo identity is NOT VERIFIED · sample data</p>}<p className="mt-3 text-xs text-slate-500">Need a verified account? <Link to="/login" className="font-semibold text-[#245c4c] hover:underline">Sign in</Link> · <Link to="/register" className="font-semibold text-[#245c4c] hover:underline">Request access</Link></p></div>
              </article>

              <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf2ed] text-[#356a5a]"><HeartHandshake size={21} /></div><p className="text-xs font-semibold uppercase tracking-[.15em] text-slate-500">Public information</p></div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Report a Missing Person</h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Share the details with this deployment for investigator review. For urgent danger, contact your local emergency services directly.</p>
                <div className="mt-auto pt-7"><Link to="/public-report" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1d5147] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163f37]">Report a Missing Person <ArrowRight size={16} /></Link><p className="mt-3 text-xs leading-5 text-amber-700">This form does not create an official report or notify authorities.</p></div>
              </article>
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-24 border-y border-slate-200 bg-white px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#356a5a]">How it works</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Two distinct routes, with honest limits.</h2></div>
            <div className="mt-10 grid gap-0 md:grid-cols-3">{steps.map((step, index) => <article key={step.number} className={index > 0 ? 'border-t border-slate-200 py-6 md:border-l md:pl-8 md:pr-8' : 'border-t border-slate-200 py-6 md:pr-8'}><p className="text-xs font-semibold tracking-[.16em] text-[#356a5a]">{step.number}</p><h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p></article>)}</div>
          </div>
        </section>

        <section id="capabilities" className="px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#356a5a]">Inside the workspace</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Tools for careful casework.</h2></div><p className="max-w-md text-sm leading-6 text-slate-600">These screens are available to authorized investigator accounts. Records shown in this repository are examples.</p></div>
            <div className="mt-9 grid gap-4 md:grid-cols-3">{capabilities.map((item) => <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[#edf2ed] text-[#356a5a]"><item.icon size={20} strokeWidth={1.7} /></div><h3 className="mt-5 text-base font-semibold text-slate-900">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p></article>)}</div>
          </div>
        </section>

        <section id="responsible-use" className="border-y border-[#d8e1d8] bg-[#edf2ed] px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[auto_1fr] md:items-start">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-[#356a5a]"><BadgeCheck size={23} /></div>
            <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#356a5a]">Trust and limitations</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">A potential match is a lead to review, not a finding.</h2><p className="mt-3 text-sm leading-6 text-slate-700">ReturnHome is not an emergency service. Reports are saved to this deployment’s configured MongoDB for authorized review, not forwarded to an agency. Sample records and similarity scores are illustrative only; they do not establish identity or show real investigation outcomes.</p><Link to="/privacy" className="mt-4 inline-flex text-sm font-semibold text-[#245c4c] hover:underline">Read privacy notes <ArrowRight size={15} className="ml-1" /></Link></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;

