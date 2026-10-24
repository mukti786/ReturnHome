import React from 'react';
import { AlertTriangle, Video } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';

const VideoAnalysisPage: React.FC = () => <div className="flex min-h-screen bg-slate-50 text-slate-900">
  <Sidebar />
  <div className="flex min-w-0 flex-1 flex-col">
    <Navbar />
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-5 sm:p-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf2ed] text-[#356a5a]"><Video size={21} /></div><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#356a5a]">Prototype workflow</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Video analysis</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">The current application does not upload video to the analysis service. This screen is unavailable for processing footage.</p></div></div>
      </header>
      <BrandDisclaimer variant="compact" />
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6" aria-labelledby="unavailable-title">
        <div className="flex items-start gap-3"><AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-700" /><div><h2 id="unavailable-title" className="font-semibold text-amber-950">No footage was analyzed</h2><p className="mt-2 text-sm leading-6 text-amber-900">Earlier prototype screens displayed sample progress and candidate results without processing the selected video. Those simulated results have been removed. Do not upload real case footage to this prototype.</p></div></div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">What is available here</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">This prototype includes an AI microservice, but the investigator interface is not wired to send video files to it or return a verified processing job. A supported upload, secure storage and deletion policy, real processing status, and end-to-end verification are required before this workflow can be used.</p>
      </section>
    </main>
    <Footer />
  </div>
</div>;

export default VideoAnalysisPage;


