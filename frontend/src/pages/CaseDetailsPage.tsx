import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User, MapPin, Clock, Calendar, ShieldAlert, FileText,
  Video, Edit, GitCompare, ArrowLeft, Phone, Building,
  CheckCircle2, Printer, Eye, Plus, ShieldCheck, Download,
  ExternalLink, Camera, AlertTriangle, XCircle, Check
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import LogoMark from '../components/branding/LogoMark';
import { apiService } from '../services/api';
import { MissingPersonCase, CandidateMatch, TimelineEvent, SightingItem, DetectionEvent, CaseStatus } from '../types';
import { useAuth } from '../context/AuthContext';

export const CaseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caseItem, setCaseItem] = useState<MissingPersonCase | null>(null);
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [detections, setDetections] = useState<DetectionEvent[]>([]);
  const [sightings, setSightings] = useState<SightingItem[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'sightings' | 'detections' | 'timeline' | 'management'>('info');

  // Status management
  const [newStatus, setNewStatus] = useState<CaseStatus>('Active Investigation');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Sighting review modal
  const [selectedSighting, setSelectedSighting] = useState<SightingItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Verified' | 'Rejected'>('Verified');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Investigator note
  const [investigatorNote, setInvestigatorNote] = useState('');

  const isInvestigator = ['Admin', 'Investigator', 'Analyst'].includes(user?.role || '');

  const loadCaseDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await apiService.getCaseById(id);
      if (!res.case) throw new Error('The requested case was not found.');
      setCaseItem(res.case);
      setNewStatus(res.case.status);
      setMatches(res.matches || []);
      setDetections((res as any).detections || []);
      setSightings((res as any).sightings || []);
      setActivityLog((res as any).activityLog || []);
    } catch (err: any) {
      setLoadError(err.message || 'Could not load this case.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCaseDetails();
  }, [id]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseItem) return;
    setUpdatingStatus(true);
    setStatusMessage('');
    try {
      const res = await apiService.updateCase(caseItem.caseId, { status: newStatus });
      if (res.success && res.case) {
        setCaseItem(res.case);
        setStatusMessage(`Case status successfully changed to ${newStatus}.`);
        void loadCaseDetails();
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSightingReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSighting) return;
    setSubmittingReview(true);
    try {
      await apiService.reviewSighting(selectedSighting.sightingId, reviewStatus, reviewNotes);
      setSelectedSighting(null);
      setReviewNotes('');
      void loadCaseDetails();
    } catch (err: any) {
      alert(`Error reviewing sighting: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 grid place-items-center" role="status">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#1d5147] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading case record…</p>
        </div>
      </div>
    );
  }

  if (loadError || !caseItem) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 grid place-items-center px-5">
        <div className="max-w-lg space-y-4 text-center">
          <p className="text-lg font-bold">Case Record Unavailable</p>
          <p role="alert" className="text-sm leading-6 text-slate-600">{loadError || 'The requested case was not found.'}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/cases')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Cases
            </button>
            <button
              type="button"
              onClick={() => void loadCaseDetails()}
              className="rounded-xl bg-[#356a5a] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#2b5548]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const photos = Array.isArray(caseItem.photos) ? caseItem.photos : [];

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'Located':
      case 'Found':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Active Investigation':
      case 'Active':
      case 'Under Investigation':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Potential Sighting':
      case 'Potential Match':
      case 'Match Under Verification':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Submitted':
      case 'Under Review':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />

        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/cases')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={14} /> Back to Case Directory
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/sightings/new?caseRef=${caseItem.caseId}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-[#1d5147] hover:bg-teal-100"
              >
                <Eye size={14} /> Report Sighting
              </Link>
              {isInvestigator && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/cases/${caseItem.caseId}/edit`)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit size={14} /> Edit Case
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/video-analysis')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Video size={14} /> CCTV Ingestion
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => navigate(`/reports?caseId=${caseItem.caseId}`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1d5147] px-4 py-2 text-xs font-semibold text-white hover:bg-[#163f37] shadow-sm"
              >
                <Printer size={14} /> Dossier Report (PDF)
              </button>
            </div>
          </div>

          {/* Subject Dossier Hero Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Photo Showcase */}
              <div className="shrink-0 space-y-2">
                {photos[0] ? (
                  <img
                    src={photos[0]}
                    alt={caseItem.name}
                    className="h-52 w-44 rounded-2xl object-cover border border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="grid h-52 w-44 place-items-center rounded-2xl border border-slate-200 bg-slate-100 text-xs text-slate-400 font-semibold">
                    No reference photo
                  </div>
                )}
                {photos.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto max-w-[176px] py-1">
                    {photos.slice(1).map((p, idx) => (
                      <img key={idx} src={p} alt="Angle" className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200" />
                    ))}
                  </div>
                )}
              </div>

              {/* Dossier Information */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#356a5a] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                      {caseItem.caseId}
                    </span>
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${getStatusColor(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                    caseItem.priority === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    Priority: {caseItem.priority}
                  </span>
                </div>

                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900">{caseItem.name}</h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Reported by: <strong>{caseItem.createdByName || caseItem.createdBy || 'Citizen'}</strong> · Registered on {new Date(caseItem.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Age / Gender</span>
                    <strong className="text-slate-900 text-sm">{caseItem.age} yrs · {caseItem.gender}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Last Seen Date</span>
                    <strong className="text-slate-900 text-sm">{caseItem.lastSeenDate} {caseItem.lastSeenTime && `(${caseItem.lastSeenTime})`}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Last Known Location</span>
                    <strong className="text-slate-900 text-sm truncate block">{caseItem.lastSeenLocation}</strong>
                  </div>
                </div>

                {caseItem.latitude !== undefined && caseItem.longitude !== undefined && (
                  <div className="flex items-center justify-between gap-2 text-xs bg-teal-50/60 p-2.5 rounded-xl border border-teal-100">
                    <span className="text-[#1d5147] font-medium flex items-center gap-1.5">
                      <MapPin size={14} /> Registered Geocoordinates: <span className="font-mono">{caseItem.latitude.toFixed(5)}, {caseItem.longitude.toFixed(5)}</span>
                    </span>
                    <Link to={`/map?caseId=${caseItem.caseId}`} className="font-bold text-[#356a5a] hover:underline flex items-center gap-1">
                      View on Interactive Map <ExternalLink size={11} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <BrandDisclaimer variant="compact" />

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto">
            {[
              { id: 'info', label: 'Person & Case Details' },
              { id: 'sightings', label: `Citizen Sightings (${sightings.length})` },
              { id: 'detections', label: `AI Detections & Evidence (${detections.length + matches.length})` },
              { id: 'timeline', label: `Chronological Timeline (${activityLog.length || timeline.length})` },
              ...(isInvestigator ? [{ id: 'management', label: 'Investigation Management' }] : [])
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`pb-3 px-4 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === t.id
                    ? 'border-[#356a5a] text-[#356a5a] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Person & Case Details */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Physical Characteristics</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Height</span>
                    <strong className="text-slate-800 text-sm">{caseItem.height || 'Unspecified'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Weight</span>
                    <strong className="text-slate-800 text-sm">{caseItem.weight || 'Unspecified'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hair Color</span>
                    <strong className="text-slate-800 text-sm">{caseItem.hairColor || 'Unspecified'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Eye Color</span>
                    <strong className="text-slate-800 text-sm">{caseItem.eyeColor || 'Unspecified'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Distinguishing Features / Marks</span>
                    <p className="text-slate-800 font-medium text-sm mt-0.5">{caseItem.distinguishingFeatures || 'None recorded'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Circumstances & Contact</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Circumstances of Disappearance</span>
                    <p className="text-slate-800 leading-relaxed mt-0.5">{caseItem.description}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Clothing Observed When Last Seen</span>
                    <p className="text-slate-800 leading-relaxed mt-0.5">{caseItem.clothingDescription || 'Unrecorded'}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Investigating Police Department / Authority</span>
                    <strong className="text-slate-900">{caseItem.contactAuthority} {caseItem.contactNumber && `(${caseItem.contactNumber})`}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Citizen Sightings */}
          {activeTab === 'sightings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Reported Citizen Sightings</h3>
                  <p className="text-xs text-slate-500">Every sighting submitted by the public for this case</p>
                </div>
                <Link
                  to={`/sightings/new?caseRef=${caseItem.caseId}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#356a5a] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#2b5548]"
                >
                  <Plus size={14} /> Submit New Sighting
                </Link>
              </div>

              {sightings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <Eye className="mx-auto h-12 w-12 text-slate-300" />
                  <h4 className="mt-2 text-sm font-semibold text-slate-800">No sightings reported yet</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    If you have seen this person or have any verified lead, submit a sighting report with photographs and GPS location.
                  </p>
                  <Link
                    to={`/sightings/new?caseRef=${caseItem.caseId}`}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#356a5a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2b5548]"
                  >
                    <Plus size={14} /> Report Sighting Now
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {sightings.map((s) => (
                    <div
                      key={s.sightingId}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#356a5a]">{s.sightingId}</span>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                            s.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            s.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {s.status}
                          </span>
                        </div>

                        {s.photoUrl && (
                          <div className="h-40 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            <img src={s.photoUrl} alt="Sighting photo" className="h-full w-full object-cover" />
                          </div>
                        )}

                        <div className="space-y-1 text-xs text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <strong>{s.location}</strong>
                            {s.locationSource === 'citizen_gps' && (
                              <span className="rounded bg-teal-50 px-1.5 py-0.2 text-[9px] font-mono text-teal-800 font-bold border border-teal-200">GPS</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Clock size={12} className="shrink-0" />
                            <span>Seen on {new Date(s.dateTimeSeen).toLocaleString()}</span>
                          </div>
                          {s.clothingSeen && (
                            <p className="text-[11px] text-slate-600">Clothing: <strong>{s.clothingSeen}</strong></p>
                          )}
                          <p className="text-xs text-slate-800 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            "{s.notes}"
                          </p>
                        </div>

                        {s.reviewedByName && (
                          <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] border border-slate-200">
                            <p className="font-semibold text-slate-800">
                              Investigator Decision: <span className={s.status === 'Verified' ? 'text-emerald-700' : 'text-rose-700'}>{s.status}</span>
                            </p>
                            <p className="text-slate-600">By {s.reviewedByName} on {s.reviewedAt ? new Date(s.reviewedAt).toLocaleDateString() : ''}</p>
                            {s.reviewNotes && <p className="text-slate-500 italic mt-0.5">"{s.reviewNotes}"</p>}
                          </div>
                        )}
                      </div>

                      {isInvestigator && s.status === 'Pending Review' && (
                        <div className="border-t border-slate-100 pt-3">
                          <button
                            type="button"
                            onClick={() => { setSelectedSighting(s); setReviewStatus('Verified'); }}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#356a5a] py-2 text-xs font-semibold text-white hover:bg-[#2b5548]"
                          >
                            <ShieldCheck size={14} /> Review & Verify Sighting
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI Detections & Video Evidence */}
          {activeTab === 'detections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Detections & Video Footage Matches</h3>
                  <p className="text-xs text-slate-500">Automated frame detections requiring human investigator review</p>
                </div>
                <Link
                  to="/evidence"
                  className="text-xs font-semibold text-[#356a5a] hover:underline flex items-center gap-1"
                >
                  Centralized Evidence Center <ArrowLeft size={12} className="rotate-180" />
                </Link>
              </div>

              {detections.length === 0 && matches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <Camera className="mx-auto h-12 w-12 text-slate-300" />
                  <h4 className="mt-2 text-sm font-semibold text-slate-800">No detection events recorded for this case</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    Live camera streams or recorded CCTV video uploads matching this case's face features will automatically appear here.
                  </p>
                  {isInvestigator && (
                    <button
                      type="button"
                      onClick={() => navigate('/video-analysis')}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#356a5a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2b5548]"
                    >
                      <Video size={14} /> Upload Video for Ingestion
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {detections.map((d) => (
                    <div key={d.detectionId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950">
                        {d.evidenceImageUrl ? (
                          <img src={d.evidenceImageUrl} alt="Detection snapshot" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs text-slate-500">No image</div>
                        )}
                        <span className="absolute top-2 right-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                          {((d.detectionConfidence || 0) * 100).toFixed(1)}% match
                        </span>
                        {d.frameTimestamp && (
                          <span className="absolute bottom-2 left-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-mono text-white">
                            Offset: {d.frameTimestamp}
                          </span>
                        )}
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                          <span>{d.detectionId}</span>
                          <span>{d.source}</span>
                        </div>
                        <p className="font-semibold text-slate-800">{d.cameraLocation || d.cameraName || 'Detection Source'}</p>
                        <p className="text-[11px] text-slate-500">{new Date(d.processingTimestamp || d.sourceTimestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Chronological Timeline */}
          {activeTab === 'timeline' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Complete Case Audit Trail & Activity History</h3>
              <div className="space-y-4">
                {(activityLog.length > 0 ? activityLog : timeline).map((ev: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#356a5a]">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{ev.action}</h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(ev.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{ev.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Logged by: {ev.userName || ev.user || 'System'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Investigation Management (Investigator only) */}
          {activeTab === 'management' && isInvestigator && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Transition Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Update Official Case Status
                </h3>
                <p className="text-xs text-slate-500">
                  Changing status updates the public case register, appends to the audit timeline, and triggers notification alerts.
                </p>

                {statusMessage && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${statusMessage.startsWith('Error') ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
                    {statusMessage}
                  </div>
                )}

                <form onSubmit={handleStatusUpdate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Target Case Status</label>
                    <select
                      value={newStatus}
                      onChange={(e: any) => setNewStatus(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#356a5a] focus:outline-none"
                    >
                      <option value="Submitted">Submitted (Intake)</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Active Investigation">Active Investigation</option>
                      <option value="Potential Sighting">Potential Sighting</option>
                      <option value="Match Under Verification">Match Under Verification</option>
                      <option value="Located">Located (Subject Safe)</option>
                      <option value="Closed">Closed (Concluded)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={updatingStatus || newStatus === caseItem.status}
                    className="w-full rounded-xl bg-[#356a5a] py-2.5 text-xs font-semibold text-white hover:bg-[#2b5548] disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating Status…' : 'Commit Status Transition'}
                  </button>
                </form>
              </div>

              {/* Quick Case Dossier Summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Investigation Dossier Metadata
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Case Identifier</span>
                    <span className="font-mono font-bold text-slate-800">{caseItem.caseId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Registered Citizen</span>
                    <span className="font-semibold text-slate-800">{caseItem.createdByName || 'Citizen'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Total Sightings Received</span>
                    <span className="font-bold text-slate-800">{sightings.length}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">AI Detection Snapshots</span>
                    <span className="font-bold text-slate-800">{detections.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sighting Verification Modal */}
          {selectedSighting && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">Review Citizen Sighting: {selectedSighting.sightingId}</h3>
                  <button type="button" onClick={() => setSelectedSighting(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>

                <form onSubmit={handleSightingReview} className="mt-4 space-y-4">
                  <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
                    <p><strong>Location:</strong> {selectedSighting.location}</p>
                    <p><strong>Seen:</strong> {new Date(selectedSighting.dateTimeSeen).toLocaleString()}</p>
                    <p className="italic text-slate-600">"{selectedSighting.notes}"</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Investigator Decision</label>
                    <select
                      value={reviewStatus}
                      onChange={(e: any) => setReviewStatus(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-900"
                    >
                      <option value="Verified">Verified Positive Lead</option>
                      <option value="Rejected">Rejected (Unsubstantiated / Negative)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Formal Review Notes</label>
                    <textarea
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      required
                      placeholder="Explain verification reasoning, field checks performed, or reason for rejection..."
                      className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#356a5a] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedSighting(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="rounded-xl bg-[#356a5a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2b5548] disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting Decision…' : 'Confirm Decision'}
                    </button>
                  </div>
                </form>
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
