import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, Download, FileText, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Logo from '../components/branding/Logo';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import { apiService } from '../services/api';
import { MissingPersonCase, CandidateMatch, TimelineEvent } from '../types';

export const ReportsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId') || 'MP-2026-0001';

  const [caseItem, setCaseItem] = useState<MissingPersonCase | null>(null);
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    async function loadReportData() {
      try {
        const res = await apiService.getCaseById(caseIdParam);
        if (res.case) setCaseItem(res.case);
        if (res.matches) setMatches(res.matches);
        if (res.timeline) setTimeline(res.timeline);
      } catch (err) {
        console.warn('Backend server offline');
      }
    }
    loadReportData();
  }, [caseIdParam]);

  const handlePrint = () => {
    window.print();
  };

  if (!caseItem) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Generating Official ReturnHome Report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <div className="no-print">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="no-print">
          <Navbar />
        </div>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Print Controls Header */}
          <div className="no-print flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div>
              <h1 className="text-xl font-bold text-white">Official Case Investigation Dossier</h1>
              <p className="text-xs text-slate-400">Case #{caseItem.caseId} • Ready for print or PDF export.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-teal-500 text-white font-semibold text-xs shadow-lg flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print / Export PDF Report
              </button>
            </div>
          </div>

          {/* PRINTABLE DOSSIER SHEET */}
          <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl space-y-6 print:shadow-none print:p-0 print:rounded-none">
            {/* Report Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <Logo variant="full" theme="light" size="lg" showTagline={true} />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 mt-2">
                  OFFICIAL MISSING PERSON INVESTIGATION REPORT
                </h2>
              </div>

              <div className="text-right font-mono text-xs text-slate-600 space-y-1">
                <div><strong>Dossier ID:</strong> {caseItem.caseId}</div>
                <div><strong>Generated Date:</strong> {new Date().toLocaleString()}</div>
                <div><strong>Generating Officer:</strong> Inspector Vikram Singh</div>
              </div>
            </div>

            {/* Disclaimer in Report */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed">
              <strong>OFFICIAL INVESTIGATION NOTICE:</strong> ReturnHome — AI-assisted investigation support platform. All AI-generated face matches contained in this dossier are candidate leads and require independent human verification by authorized law enforcement personnel.
            </div>

            {/* Missing Person Profile Box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 border-b border-slate-300 pb-6">
              <div className="md:col-span-4">
                <img
                  src={caseItem.photos[0] || 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80'}
                  alt={caseItem.name}
                  className="w-full h-48 object-cover rounded-xl border border-slate-400"
                />
              </div>

              <div className="md:col-span-8 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-950">{caseItem.name}</h3>
                  <span className="px-3 py-1 rounded bg-slate-900 text-white font-bold font-mono text-xs">
                    STATUS: {caseItem.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-100 p-3 rounded-lg border border-slate-200">
                  <div><strong>Age:</strong> {caseItem.age} years</div>
                  <div><strong>Gender:</strong> {caseItem.gender}</div>
                  <div><strong>Height:</strong> {caseItem.height}</div>
                  <div><strong>Weight:</strong> {caseItem.weight}</div>
                  <div><strong>Hair Color:</strong> {caseItem.hairColor}</div>
                  <div><strong>Eye Color:</strong> {caseItem.eyeColor}</div>
                </div>

                <div>
                  <strong>Distinguishing Features:</strong> {caseItem.distinguishingFeatures}
                </div>

                <div>
                  <strong>Last Known Location:</strong> {caseItem.lastSeenLocation} (Date: {caseItem.lastSeenDate})
                </div>

                <div>
                  <strong>Clothing Description:</strong> {caseItem.clothingDescription}
                </div>
              </div>
            </div>

            {/* Candidate Matches Section */}
            <div className="space-y-3 border-b border-slate-300 pb-6">
              <h4 className="font-bold text-slate-950 text-sm uppercase tracking-wide border-b border-slate-200 pb-1">
                AI Candidate Face Matches & Human Verification Records
              </h4>

              {matches.map((m) => (
                <div key={m.matchId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-slate-900">Match ID: {m.matchId} (Track: {m.trackingId})</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Similarity Score: {Math.round(m.similarityScore * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Missing Reference</span>
                      <img src={m.missingPersonPhoto} alt="Ref" className="w-full h-24 object-cover rounded border border-slate-300" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">CCTV Detection ({m.cameraId})</span>
                      <img src={m.detectedFrameUrl} alt="CCTV" className="w-full h-24 object-cover rounded border border-slate-300" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Camera: {m.cameraName} ({m.location})</span>
                    <span>Reviewed By: {m.reviewedBy || 'Pending Human Review'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline Stream */}
            <div className="space-y-2 border-b border-slate-300 pb-6">
              <h4 className="font-bold text-slate-950 text-sm uppercase tracking-wide border-b border-slate-200 pb-1">
                Chronological Investigation Log
              </h4>

              <div className="space-y-1.5 text-xs">
                {timeline.map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <strong className="text-slate-900">{evt.action}:</strong> {evt.description}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{evt.timestamp.slice(0, 16)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign-off & Footer */}
            <div className="flex items-end justify-between pt-4 text-xs text-slate-600">
              <div>
                <p><strong>Investigating Authority:</strong> Delhi Police Special Missing Unit</p>
                <p><strong>Contact:</strong> +91-11-23410000</p>
              </div>

              <div className="text-center space-y-8">
                <div className="border-b border-slate-400 w-48 mx-auto" />
                <p className="font-bold text-slate-900">Authorized Investigator Sign-off</p>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-4 border-t border-slate-200 font-mono">
              ReturnHome — AI-assisted investigation support. AI-generated matches require independent human verification.
            </div>
          </div>
        </main>

        <div className="no-print">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
