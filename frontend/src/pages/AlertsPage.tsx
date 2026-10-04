import React from 'react';
import { Bell, ShieldAlert, CheckCircle2, Video, GitCompare, RefreshCw } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import LogoMark from '../components/branding/LogoMark';

export const AlertsPage: React.FC = () => {
  const alerts = [
    {
      id: 1,
      title: 'High-Score Candidate Lead Surfaced',
      caseId: 'MP-2026-0001',
      camera: 'CAM-01 (Railway Station Gate 3)',
      similarity: 0.91,
      timestamp: '2026-09-07T14:32:10',
      status: 'UNREVIEWED',
      details: 'Face similarity score of 91% calculated against reference profile Aarav Sharma in track TRACK-00021.'
    },
    {
      id: 2,
      title: 'Candidate Lead Surfaced',
      caseId: 'MP-2026-0002',
      camera: 'CAM-02 (Kashmere Gate ISBT)',
      similarity: 0.84,
      timestamp: '2026-09-07T15:10:45',
      status: 'UNREVIEWED',
      details: 'Face similarity score of 84% calculated against reference profile Priya Verma.'
    },
    {
      id: 3,
      title: 'CCTV Video Stream Batch Analysis Complete',
      caseId: 'MP-2026-0001',
      camera: 'CAM-04 (Rajiv Chowk Metro)',
      similarity: 0.87,
      timestamp: '2026-09-07T16:05:00',
      status: 'REVIEWED',
      details: '7,240 frames processed. Generated Candidate Match MATCH-2026-003.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <LogoMark size="md" theme="dark" />
              <div>
                <h1 className="text-xl font-bold text-white">ReturnHome Internal Alert System</h1>
                <p className="text-xs text-slate-400">
                  Role-scoped Socket.IO notification channel dispatches candidate match alerts for investigator verification.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-3 py-1 rounded-xl">
              Socket.IO Active
            </span>
          </div>

          <BrandDisclaimer variant="warning" />

          <div className="space-y-4">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`bg-slate-900 border ${
                  a.status === 'UNREVIEWED' ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800'
                } rounded-2xl p-5 shadow-lg space-y-2`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" /> {a.title}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    a.status === 'UNREVIEWED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {a.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300">{a.details}</p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>Case: <strong className="text-cyan-400">{a.caseId}</strong> • Camera: <strong className="text-slate-200">{a.camera}</strong></span>
                  <span className="font-mono text-[11px]">{a.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default AlertsPage;
