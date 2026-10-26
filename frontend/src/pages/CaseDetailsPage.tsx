import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  FileText, 
  Video, 
  Edit, 
  GitCompare, 
  ArrowLeft,
  Phone,
  Building,
  CheckCircle2,
  Printer
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import LogoMark from '../components/branding/LogoMark';
import { apiService } from '../services/api';
import { MissingPersonCase, CandidateMatch, TimelineEvent } from '../types';

export const CaseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseItem, setCaseItem] = useState<MissingPersonCase | null>(null);
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryToken, setRetryToken] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'matches' | 'timeline' | 'notes'>('info');
  const [investigatorNote, setInvestigatorNote] = useState('');
  const [notesList, setNotesList] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    async function loadCaseDetails() {
      setIsLoading(true);
      setLoadError('');
      if (!id) {
        setLoadError('No case identifier was provided.');
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiService.getCaseById(id);
        if (!res.case) throw new Error('The requested case was not found.');
        if (active) {
          setCaseItem(res.case);
          setMatches(res.matches || []);
          setTimeline(res.timeline || []);
        }
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : 'Could not load this case.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadCaseDetails();
    return () => { active = false; };
  }, [id, retryToken]);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center" role="status"><div className="text-center space-y-3"><div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto" /><p className="text-sm text-slate-400">Loading case record…</p></div></div>;
  }

  if (loadError || !caseItem) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center px-5">
        <div className="max-w-lg space-y-4 text-center">
          <p className="text-lg font-semibold">Case record unavailable</p>
          <p role="alert" className="text-sm leading-6 text-slate-400">{loadError || 'The requested case was not found.'}</p>
          <div className="flex justify-center gap-3"><button type="button" onClick={() => navigate('/cases')} className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-900">Back to Case Directory</button><button type="button" onClick={() => setRetryToken((value) => value + 1)} className="rounded-lg bg-teal-300 px-4 py-2.5 text-sm font-semibold text-slate-950">Retry</button></div>
        </div>
      </div>
    );
  }

  const handleAddNote = () => {
    if (investigatorNote.trim()) {
      setNotesList((current) => [...current, `${new Date().toLocaleTimeString()} - ${investigatorNote.trim()}`]);
      setInvestigatorNote('');
    }
  };
  const photos = Array.isArray(caseItem.photos) ? caseItem.photos : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Back button & Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <button
              onClick={() => navigate('/cases')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Case Directory
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/cases/${caseItem.caseId}/edit`)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5 text-cyan-400" /> Edit Case
              </button>
              <button
                onClick={() => navigate('/video-analysis')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-cyan-400" /> Analyze CCTV Footage
              </button>
              <button
                onClick={() => navigate(`/reports?caseId=${caseItem.caseId}`)}
                className="px-4 py-1.5 rounded-xl bg-[#1d5147] hover:opacity-95 text-xs font-semibold text-white shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Export Report (PDF)
              </button>
            </div>
          </div>

          {/* Main Case Banner Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Main Photo */}
              {photos[0] ? <img src={photos[0]} alt={`Reference photo of ${caseItem.name}`} className="w-36 h-44 object-cover rounded-xl border-2 border-slate-700 shadow-md shrink-0" /> : <div className="grid h-44 w-36 shrink-0 place-items-center rounded-xl border-2 border-slate-700 bg-slate-950 text-center text-xs text-slate-500">No reference photo<br />in this record</div>}

              {/* Information Overview */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <LogoMark size="sm" theme="dark" />
                    <span className="font-mono font-bold text-cyan-400 text-sm bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded">
                      {caseItem.caseId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                      caseItem.priority === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      Priority: {caseItem.priority}
                    </span>
                    <span className="text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      Status: {caseItem.status}
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl font-extrabold text-white">{caseItem.name}</h1>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-500 block">Age / Gender</span>
                    <strong className="text-white">{caseItem.age} yrs • {caseItem.gender}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Last Seen Date</span>
                    <strong className="text-white">{caseItem.lastSeenDate} ({caseItem.lastSeenTime})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Last Known Location</span>
                    <strong className="text-white truncate block">{caseItem.lastSeenLocation}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Investigating Officer</span>
                    <strong className="text-cyan-400">{caseItem.createdBy}</strong>
                  </div>
                </div>

                {/* Additional Reference Photos Thumbnails */}
                {photos.length > 1 && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-[10px] text-slate-500 font-semibold">Reference Angles:</span>
                    {photos.slice(1).map((p, idx) => (
                      <img key={idx} src={p} alt="Angle" className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <BrandDisclaimer variant="compact" />
          {matches.length > 0 && <p className="rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-xs leading-5 text-amber-200">Candidate records in this prototype are seeded demonstration data. Similarity and workflow statuses are not evidence of a confirmed identity or sighting.</p>}
          {caseItem.latitude !== undefined && caseItem.longitude !== undefined && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs"><span className="text-slate-300"><MapPin className="mr-1 inline h-4 w-4 text-teal-300" />Coordinates stored on this case: <span className="font-mono">{caseItem.latitude}, {caseItem.longitude}</span></span><button type="button" onClick={() => navigate(`/map?caseId=${encodeURIComponent(caseItem.caseId)}`)} className="font-semibold text-teal-300 hover:text-teal-200">View on case map</button></div>}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-semibold">
            {[
              { id: 'info', label: 'Person & Case Details' },
              { id: 'matches', label: `Candidate Leads (${matches.length})` },
              { id: 'timeline', label: `Investigation Timeline (${timeline.length})` },
              { id: 'notes', label: `Investigator Notes (${notesList.length})` }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`pb-3 px-4 transition-colors border-b-2 ${
                  activeTab === t.id
                    ? 'border-cyan-400 text-cyan-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Person & Case Details */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800">Physical Characteristics</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Height</span>
                    <strong className="text-slate-200">{caseItem.height}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Weight</span>
                    <strong className="text-slate-200">{caseItem.weight}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hair Description</span>
                    <strong className="text-slate-200">{caseItem.hairColor}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Eye Color</span>
                    <strong className="text-slate-200">{caseItem.eyeColor}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Distinguishing Features</span>
                    <strong className="text-cyan-400">{caseItem.distinguishingFeatures}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800">Circumstances & Contact</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Disappearance Description</span>
                    <p className="text-slate-300 leading-relaxed">{caseItem.description}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Clothing Description</span>
                    <p className="text-slate-300 leading-relaxed">{caseItem.clothingDescription}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500 block">Reporting Authority</span>
                    <strong className="text-white">{caseItem.contactAuthority} ({caseItem.contactNumber})</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Candidate Matches */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              {matches.map((m) => (
                <div key={m.matchId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">AI candidate suggestion · identity unconfirmed · {m.matchId}</span>
                    <span className="font-bold text-emerald-400 font-mono text-xs bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded">
                      {Math.round(m.similarityScore * 100)}% similarity signal · not identity proof
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[11px] text-slate-400 font-semibold block mb-1">Registered Photo</span>
                      <img src={m.missingPersonPhoto} alt="Ref" className="w-full h-40 object-cover rounded-lg border border-slate-700" />
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[11px] text-slate-400 font-semibold block mb-1">CCTV Detection ({m.cameraId})</span>
                      <img src={m.detectedFrameUrl} alt="CCTV" className="w-full h-40 object-cover rounded-lg border border-cyan-500/60" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                    <span>Location: <strong className="text-slate-200">{m.location}</strong></span>
                    <button
                      onClick={() => navigate(`/matches?id=${m.matchId}`)}
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
                    >
                      Review candidate suggestion
                    </button>
                  </div>
                </div>
              ))}
              {matches.length === 0 && <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">No candidate suggestions are recorded for this case.</p>}
            </div>
          )}

          {/* Tab 3: Timeline */}
          {activeTab === 'timeline' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="space-y-4 relative pl-6 border-l-2 border-slate-800">
                {timeline.map((evt) => (
                  <div key={evt.id} className="relative space-y-1">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-900" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{evt.action}</span>
                      <span className="text-[11px] text-slate-400">{evt.timestamp.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <p className="text-xs text-slate-300">{evt.description}</p>
                    <span className="text-[10px] text-cyan-400 font-mono block">Logged by {evt.user}</span>
                  </div>
                ))}
                {timeline.length === 0 && <p className="text-sm text-slate-400">No timeline events are recorded for this case.</p>}
              </div>
            </div>
          )}

          {/* Tab 4: Notes */}
          {activeTab === 'notes' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <p className="text-xs text-slate-400">Notes added here are temporary to this page session and are not saved to the case record.</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={investigatorNote}
                  onChange={(e) => setInvestigatorNote(e.target.value)}
                  placeholder="Enter investigator log note..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
                >
                  Add Note
                </button>
              </div>

              <div className="space-y-2 pt-2">
                {notesList.map((n, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    {n}
                  </div>
                ))}
                {notesList.length === 0 && <p className="text-xs text-slate-500">No temporary notes in this session.</p>}
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default CaseDetailsPage;

