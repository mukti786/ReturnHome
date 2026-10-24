import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Camera, ChevronDown, ClipboardList, Eye, FileSearch, LockKeyhole, Map, Menu, ScanFace, ShieldCheck, UserRoundCheck, Workflow, X } from 'lucide-react';
import Logo from '../components/branding/Logo';
import Footer from '../components/layout/Footer';

const capabilities = [
  { icon: ClipboardList, title: 'Case records', body: 'Keep missing-person details, reference photos and case updates together in one workspace.' },
  { icon: Camera, title: 'Video-analysis screen', body: 'The screen is a prototype only; it does not upload footage or return real analysis results.' },
  { icon: FileSearch, title: 'Human review', body: 'Explore the sample candidate-review layout. The repository includes demonstration records, not operational case evidence.' },
  { icon: Map, title: 'Case context', body: 'Explore case timelines, map views, reports and audit activity from the investigator workspace.' },
];

const steps = [
  { icon: ClipboardList, title: 'Create a case', body: 'Explore the case-record screens and sample missing-person profiles.' },
  { icon: ScanFace, title: 'Explore the analysis screen', body: 'The prototype does not upload or process video, and it generates no real analysis results.' },
  { icon: UserRoundCheck, title: 'Verify every lead', body: 'Review the illustrative candidate layout. No sample result represents a real investigation.' },
];

export const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f8f8f5] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#f8f8f5]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8" aria-label="Main navigation">
          <Link to="/" aria-label="ReturnHome home"><Logo variant="full" theme="light" size="md" showTagline={false} /></Link>
          <div className="hidden items-center gap-8 md:flex">
            <a className="text-sm text-slate-600 hover:text-slate-950" href="#workflow">Workflow</a>
            <a className="text-sm text-slate-600 hover:text-slate-950" href="#capabilities">Capabilities</a>
            <a className="text-sm text-slate-600 hover:text-slate-950" href="#responsible-use">Responsible use</a>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Log in</Link>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-[#1d5147] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#163f37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5147]">Request access <ArrowRight size={16} /></Link>
          </div>
          <button type="button" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </nav>
        {menuOpen && <div className="border-t border-slate-200 px-5 py-4 md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-3"><a onClick={() => setMenuOpen(false)} className="py-2 text-sm" href="#workflow">Workflow</a><a onClick={() => setMenuOpen(false)} className="py-2 text-sm" href="#capabilities">Capabilities</a><a onClick={() => setMenuOpen(false)} className="py-2 text-sm" href="#responsible-use">Responsible use</a><Link to="/login" className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold">Log in</Link><Link to="/register" className="rounded-lg bg-[#1d5147] px-4 py-3 text-center text-sm font-semibold text-white">Request access</Link></div></div>}
      </header>

      <main>
        <section className="overflow-hidden border-b border-slate-200 bg-[#f1f2ec]">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.02fr_.98fr] lg:py-28">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cbd9ce] bg-white/70 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#245c4c]"><ShieldCheck size={15} /> INVESTIGATOR CASEWORK</div>
              <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-[-.045em] text-[#172522] sm:text-5xl lg:text-[3.8rem]">Explore an investigator workspace for missing-person casework.</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">ReturnHome is an investigator-workspace prototype for organizing case records and exploring evidence-review screens. Its video-analysis interface is not connected to video upload or processing.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1d5147] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#163f37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5147]">Request investigator access <ArrowRight size={17} /></Link>
                <Link to="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"><LockKeyhole size={16} /> Investigator log in</Link>
              </div>
              <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><BadgeCheck size={15} className="mt-0.5 shrink-0 text-[#356a5a]" /> Sample match views are illustrative only. Similarity scores do not establish identity.</p>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-8 rounded-[2rem] bg-[#e2e8df]" aria-hidden="true" />
              <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_64px_-32px_rgba(21,43,35,.28)] sm:p-7">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-slate-500">Case review</p><p className="mt-1 text-base font-semibold text-slate-900">Evidence workspace</p></div>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-900">Review required</span>
                </div>
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
                  <div className="rounded-xl border border-slate-200 bg-[#f7f8f5] p-3 sm:p-4"><div className="mb-5 flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-400 sm:h-36"><ClipboardList size={30} strokeWidth={1.5} /></div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Reference material</p><p className="mt-1 text-sm font-semibold text-slate-800">Case record</p></div>
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf0e9] text-[#356a5a]"><Workflow size={18} /></div>
                  <div className="rounded-xl border border-slate-200 bg-[#f7f8f5] p-3 sm:p-4"><div className="mb-5 flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-400 sm:h-36"><Eye size={30} strokeWidth={1.5} /></div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Submitted evidence</p><p className="mt-1 text-sm font-semibold text-slate-800">Frame for review</p></div>
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#d8e3d9] bg-[#f4f7f2] p-3.5 text-xs leading-5 text-slate-600"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#356a5a]" /><p><span className="font-semibold text-slate-800">Human decision required.</span> The system presents candidate results for investigation; an authorized reviewer evaluates the evidence.</p></div>
                <p className="mt-4 text-center text-[10px] text-slate-400">Illustrative interface · No live case or person data</p>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-24 border-b border-slate-200 bg-white px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#356a5a]">A clear review process</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">From case record to documented review.</h2><p className="mt-4 text-base leading-7 text-slate-600">The workspace keeps evidence and investigation activity connected without turning an automated result into a final decision.</p></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">{steps.map((step, i) => <article key={step.title} className="rounded-xl border border-slate-200 bg-[#fbfbf8] p-6"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#356a5a]">0{i + 1}</span><step.icon size={20} className="text-[#356a5a]" strokeWidth={1.7} /></div><h3 className="mt-7 text-lg font-semibold text-slate-900">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p></article>)}</div>
          </div>
        </section>

        <section id="capabilities" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#356a5a]">Investigation workspace</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Tools for the work around a lead.</h2></div><p className="max-w-md text-sm leading-6 text-slate-600">Case management, review and reporting features are available in the authenticated application.</p></div>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{capabilities.map((item) => <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_4px_16px_-12px_rgba(15,23,42,.18)]"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[#edf2ed] text-[#356a5a]"><item.icon size={20} strokeWidth={1.7} /></div><h3 className="mt-5 text-base font-semibold text-slate-900">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p></article>)}</div>
          </div>
        </section>

        <section id="responsible-use" className="scroll-mt-24 border-y border-[#d8e1d8] bg-[#edf2ed] px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[auto_1fr_auto] md:items-start">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-[#356a5a]"><ShieldCheck size={24} /></div>
            <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#356a5a]">Responsible use</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">A potential match is a lead to review, not a finding.</h2><p className="mt-3 text-sm leading-6 text-slate-700">Automated visual analysis can be wrong. Similarity scores do not confirm a person’s identity, and every result requires independent review by authorized personnel. Access should be limited to lawful, authorized investigations.</p></div>
            <Link to="/privacy" className="inline-flex items-center gap-1 text-sm font-semibold text-[#245c4c] hover:underline">Read privacy notes <ChevronDown size={16} className="-rotate-90" /></Link>
          </div>
        </section>

        <section className="bg-[#1a332e] px-5 py-14 text-white sm:px-8 sm:py-16">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#b7d2c2]">For authorized teams</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">Keep casework organized. Keep decisions with people.</h2><p className="mt-3 text-sm text-slate-300">Access is subject to administrator approval.</p></div><Link to="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#1a332e] hover:bg-[#edf2ed]">Request access <ArrowRight size={16} /></Link></div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;




