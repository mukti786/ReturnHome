import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GitCompare, Filter, CheckCircle2, XCircle, ShieldAlert, Eye, Search, ArrowRight } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import LogoMark from '../components/branding/LogoMark';
import { apiService } from '../services/api';
import { CandidateMatch, MatchStatus } from '../types';

export const PotentialMatchesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('id');

  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [cameraFilter, setCameraFilter] = useState<string>('All');
  const [minScore, setMinScore] = useState<number>(0.60);
  const [selectedMatch, setSelectedMatch] = useState<CandidateMatch | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const res = await apiService.getMatches({
        status: statusFilter,
        cameraId: cameraFilter,
        minScore: String(minScore)
      });
      if (res.matches) {
        setMatches(res.matches);
        if (highlightId) {
          const matchToHighlight = res.matches.find(m => m.matchId === highlightId);
          if (matchToHighlight) setSelectedMatch(matchToHighlight);
        }
      }
    } catch (err) {
      console.warn('Backend server offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [statusFilter, cameraFilter, minScore, highlightId]);

  const handleReview = async (status: MatchStatus) => {
    if (!selectedMatch) return;
    try {
      await apiService.reviewMatch(selectedMatch.matchId, status, reviewNotes);
      setSelectedMatch(null);
      setReviewNotes('');
      await fetchMatches();
    } catch (err: any) {
      alert(err.message || 'Review submission failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <LogoMark size="md" theme="light" />
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">ReturnHome Candidate Match Review Dashboard</h1>
                <p className="text-xs text-slate-600">
                  Human-in-the-Loop Inspection Workspace • All AI similarity results require independent human sign-off.
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-3.5 py-1.5 rounded-xl">
              ReturnHome Human Review Required
            </span>
          </div>

          <BrandDisclaimer variant="warning" />

          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Filter by Review Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:border-cyan-500 focus:bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Accepted Lead">Accepted Lead</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Verified">Verified</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Filter by Camera Feed</label>
                <select
                  value={cameraFilter}
                  onChange={(e) => setCameraFilter(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:border-cyan-500 focus:bg-white"
                >
                  <option value="All">All Cameras</option>
                  <option value="CAM-01">CAM-01 — Railway Station Gate 3</option>
                  <option value="CAM-02">CAM-02 — ISBT Concourse</option>
                  <option value="CAM-03">CAM-03 — CP Roundabout</option>
                  <option value="CAM-04">CAM-04 — Metro Station Exit</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-500">Min Similarity Threshold</label>
                  <span className="font-mono text-xs font-bold text-indigo-700">{Math.round(minScore * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="0.95"
                  step="0.05"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-indigo-600 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Match Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((m) => (
              <div
                key={m.matchId}
                className={`bg-white border ${m.matchId === highlightId ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-slate-200'} rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                      {m.matchId}
                    </span>
                    <span className="font-bold text-emerald-800 font-mono bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                      {Math.round(m.similarityScore * 100)}% Similarity
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 text-base">{m.missingPersonName}</h3>

                  {/* Side-by-Side Images */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Reference</span>
                      <img src={m.missingPersonPhoto} alt="Ref" className="w-full h-28 object-cover rounded-lg border border-slate-300" />
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-cyan-700 font-bold block mb-1">CCTV ({m.cameraId})</span>
                      <img src={m.detectedFrameUrl} alt="CCTV" className="w-full h-28 object-cover rounded-lg border border-cyan-400" />
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 font-medium">
                    <div>Location: <strong className="text-slate-900">{m.location}</strong></div>
                    <div>Track ID: <strong className="text-cyan-700 font-mono">{m.trackingId}</strong></div>
                    <div>Status: <span className="font-bold text-amber-700">{m.status}</span></div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMatch(m)}
                  className="w-full mt-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Eye className="w-4 h-4" /> Inspect & Sign-off Candidate
                </button>
              </div>
            ))}
          </div>

          {/* Modal Inspector for Side-by-Side Human Verification */}
          {selectedMatch && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                      {selectedMatch.matchId}
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">
                      Side-by-Side Verification Inspector: {selectedMatch.missingPersonName}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>

                {/* Human Review Banner */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed shadow-sm">
                  <strong>ReturnHome Potential Match — Human Review Required:</strong> Similarity score ({Math.round(selectedMatch.similarityScore * 100)}%) is an AI-generated mathematical distance signal and does not establish confirmed identity without human sign-off.
                </div>

                {/* Side-by-Side Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">Missing Person Reference Photo</span>
                    <img src={selectedMatch.missingPersonPhoto} alt="Ref" className="w-full h-56 object-cover rounded-xl border border-slate-300 shadow-sm" />
                    <span className="text-xs text-slate-600 block font-semibold">{selectedMatch.missingPersonName} (Case {selectedMatch.caseId})</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-cyan-800 block">Detected CCTV Frame ({selectedMatch.cameraId})</span>
                    <img src={selectedMatch.detectedFrameUrl} alt="Detection" className="w-full h-56 object-cover rounded-xl border-2 border-cyan-500 shadow-sm" />
                    <span className="text-xs text-slate-600 block font-semibold">{selectedMatch.location} • {selectedMatch.timestamp}</span>
                  </div>
                </div>

                {/* Rationale & Notes */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-800">Investigator Verification Notes & Rationale *</label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter visual matching rationale (e.g. facial feature comparison, clothing match, scar verification)..."
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleReview('Rejected')}
                    className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject Candidate Match
                  </button>
                  <button
                    onClick={() => handleReview('Accepted Lead')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm & Accept as Investigation Lead
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default PotentialMatchesPage;
