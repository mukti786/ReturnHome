import React, { useState, useEffect } from 'react';
import { Clock, User, CheckCircle2, Video, GitCompare, FileText, Search } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import LogoMark from '../components/branding/LogoMark';
import { apiService } from '../services/api';
import { TimelineEvent } from '../types';

export const InvestigationTimelinePage: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiService.getDashboardStats();
        if (res.recentTimeline) setEvents(res.recentTimeline);
      } catch (err) {
        console.warn('Backend server offline');
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <LogoMark size="md" theme="dark" />
            <div>
              <h1 className="text-xl font-bold text-white">ReturnHome Master Investigation Timeline</h1>
              <p className="text-xs text-slate-400">
                Chronological record of case events, video ingestion, AI analysis triggers, and investigator match verification sign-offs.
              </p>
            </div>
          </div>

          <BrandDisclaimer variant="compact" />

          {/* Timeline Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <div className="space-y-6 relative pl-8 border-l-2 border-slate-800">
              {events.map((evt) => (
                <div key={evt.id} className="relative space-y-1.5 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="absolute -left-[41px] top-4 w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 border-4 border-slate-900 shadow-md" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-extrabold text-white text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" /> {evt.action}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {evt.timestamp.replace('T', ' ').slice(0, 19)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{evt.description}</p>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-900">
                    <span>Case: <strong className="text-cyan-400">{evt.caseId}</strong></span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3 text-cyan-400" /> Logged by: <strong className="text-slate-300">{evt.user}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default InvestigationTimelinePage;
