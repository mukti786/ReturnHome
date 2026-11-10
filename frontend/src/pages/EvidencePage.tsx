import React, { useState, useEffect } from 'react';
import {
  FolderKanban, Filter, Search, Download, CheckCircle,
  XCircle, AlertTriangle, Eye, ShieldCheck, MapPin, Camera, Video,
  Clock, ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { apiService } from '../services/api';
import { UnifiedEvidenceItem } from '../types';
import { useAuth } from '../context/AuthContext';

export const EvidencePage: React.FC = () => {
  const { user } = useAuth();
  const [evidenceList, setEvidenceList] = useState<UnifiedEvidenceItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<UnifiedEvidenceItem | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');

  // Review Modal state
  const [reviewingItem, setReviewingItem] = useState<UnifiedEvidenceItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'Verified' | 'Accepted Lead' | 'Rejected'>('Verified');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Dossier Modal state
  const [dossierData, setDossierData] = useState<any>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const fetchEvidence = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { limit: '30' };
      if (sourceFilter !== 'all') params.source = sourceFilter;
      if (statusFilter !== 'all') params.reviewStatus = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiService.getEvidence(params);
      if (res.success) {
        setEvidenceList(res.evidence);
        setTotalCount(res.total);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load evidence records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchEvidence();
    }, 250);
    return () => clearTimeout(timer);
  }, [sourceFilter, statusFilter, searchQuery]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem) return;
    setSubmittingReview(true);
    try {
      await apiService.reviewDetection(reviewingItem.id, reviewDecision, reviewNotes);
      setActionSuccess(`Evidence ${reviewingItem.id} marked as ${reviewDecision}.`);
      setReviewingItem(null);
      setReviewNotes('');
      void fetchEvidence();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleExportDossier = async (item: UnifiedEvidenceItem) => {
    setLoadingDossier(true);
    try {
      const res = await apiService.exportEvidenceDossier(item.id);
      if (res.success) {
        setDossierData(res.dossier);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to export dossier.');
    } finally {
      setLoadingDossier(false);
    }
  };

  const isInvestigator = ['Admin', 'Investigator', 'Analyst'].includes(user?.role || '');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#356a5a]">
              <FolderKanban size={14} /> Chain of Custody & Evidence Intelligence
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Centralized Evidence Center
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Structured detection snapshots, bounding boxes, video frame offsets, and verification logs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
              Total Records: <strong className="text-slate-900">{totalCount}</strong>
            </span>
          </div>
        </div>

        {actionSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button type="button" onClick={() => setActionSuccess('')} className="text-emerald-600 hover:text-emerald-900 font-bold">×</button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-red-600 hover:text-red-900 font-bold">×</button>
          </div>
        )}

        {/* Filter Controls */}
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Case Ref, Person Name, Camera..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-[#356a5a] focus:outline-none"
            />
          </div>

          <div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-[#356a5a] focus:outline-none bg-white"
            >
              <option value="all">All Sources</option>
              <option value="live_camera">Live Camera Stream</option>
              <option value="video_upload">Recorded Video Footage</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-[#356a5a] focus:outline-none bg-white"
            >
              <option value="all">All Verification Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Accepted Lead">Accepted Lead</option>
              <option value="Verified">Verified Positive</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Evidence Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
            ))}
          </div>
        ) : evidenceList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FolderKanban className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No evidence records found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search queries or ingestion filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {evidenceList.map((item) => {
              const statusColor =
                item.reviewStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : item.reviewStatus === 'Accepted Lead' ? 'bg-blue-100 text-blue-800 border-blue-200'
                : item.reviewStatus === 'Rejected' ? 'bg-rose-100 text-rose-800 border-rose-200'
                : 'bg-amber-100 text-amber-800 border-amber-200';

              return (
                <div
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Image Frame */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer" onClick={() => setSelectedItem(item)}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt="Detection evidence"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-slate-500">
                        No snapshot image
                      </div>
                    )}

                    {/* Source badge overlay */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                      {item.source === 'live_camera' ? <Camera size={11} className="text-emerald-400" /> : <Video size={11} className="text-blue-400" />}
                      <span>{item.sourceLabel}</span>
                    </div>

                    {/* Review Status badge overlay */}
                    <div className={`absolute top-2 right-2 rounded-md border px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${statusColor}`}>
                      {item.reviewStatus}
                    </div>

                    {/* Video offset badge */}
                    {item.frameTimestamp && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-mono text-white">
                        <Clock size={10} /> Offset: {item.frameTimestamp}
                      </div>
                    )}

                    {/* Similarity score */}
                    {item.confidence !== undefined && (
                      <div className="absolute bottom-2 right-2 rounded bg-[#1d5147]/90 px-1.5 py-0.5 text-[10px] font-bold text-teal-200">
                        {(item.confidence * 100).toFixed(1)}% match
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          {item.id}
                        </span>
                        {item.caseRef && (
                          <Link
                            to={`/cases/${item.caseRef}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#356a5a] hover:underline"
                          >
                            {item.caseRef} <ArrowUpRight size={11} />
                          </Link>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900">
                        {item.missingPersonName || 'Candidate Subject'}
                      </h4>

                      <div className="space-y-1 text-[11px] text-slate-600">
                        {item.location && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        )}
                        {item.cameraName && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Camera size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{item.cameraName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={12} className="shrink-0" />
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      {item.notes && (
                        <p className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-700 italic border border-slate-100">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportDossier(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                        title="Export chain of custody dossier"
                      >
                        <Download size={12} /> Dossier
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={12} /> Inspect
                        </button>

                        {isInvestigator && (
                          <button
                            type="button"
                            onClick={() => {
                              setReviewingItem(item);
                              setReviewDecision('Verified');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#356a5a] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#2b5548]"
                          >
                            <ShieldCheck size={12} /> Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Inspection Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Evidence Record: {selectedItem.id}</h3>
                  <p className="text-xs text-slate-500">Chain of custody & technical telemetry</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                  <img
                    src={selectedItem.imageUrl}
                    alt="Inspection target"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Associated Case</span>
                    <p className="text-sm font-bold text-slate-900">{selectedItem.missingPersonName || 'Candidate Subject'}</p>
                    <p className="font-mono text-slate-600">{selectedItem.caseRef || 'No direct case linkage'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400">Detection Confidence</span>
                      <p className="font-bold text-slate-900">
                        {selectedItem.confidence !== undefined ? `${(selectedItem.confidence * 100).toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Confidence Tier</span>
                      <p className="font-bold text-slate-900">{selectedItem.confidenceTier || 'STANDARD'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Source Provenance</span>
                      <p className="font-semibold text-slate-800">{selectedItem.sourceLabel}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Review Status</span>
                      <p className="font-bold text-[#356a5a]">{selectedItem.reviewStatus}</p>
                    </div>
                  </div>

                  {selectedItem.boundingBox && (
                    <div>
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Bounding Coordinates</span>
                      <p className="font-mono text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        x: {selectedItem.boundingBox.x}, y: {selectedItem.boundingBox.y}, w: {selectedItem.boundingBox.width}, h: {selectedItem.boundingBox.height}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Location & Source Device</span>
                    <p className="text-slate-800">{selectedItem.location || 'Location unrecorded'}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{selectedItem.cameraName} ({selectedItem.cameraId})</p>
                  </div>

                  {selectedItem.reviewedByName && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                      <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">Investigator Verification</span>
                      <p className="mt-0.5 text-xs text-slate-800">
                        Reviewed by: <strong>{selectedItem.reviewedByName}</strong> on {selectedItem.reviewedAt ? new Date(selectedItem.reviewedAt).toLocaleDateString() : 'N/A'}
                      </p>
                      {selectedItem.notes && <p className="mt-1 text-slate-600 italic">"{selectedItem.notes}"</p>}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleExportDossier(selectedItem)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#356a5a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2b5548]"
                >
                  <Download size={14} /> Export Legal Dossier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Investigator Review Modal */}
        {reviewingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Review Detection Evidence</h3>
                <button type="button" onClick={() => setReviewingItem(null)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Decision Status</label>
                  <select
                    value={reviewDecision}
                    onChange={(e: any) => setReviewDecision(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white"
                  >
                    <option value="Verified">Verified Positive Identification</option>
                    <option value="Accepted Lead">Accepted Investigative Lead</option>
                    <option value="Rejected">Rejected (False Positive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Investigator Case Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter formal justification, verification methodology, or notes for the case dossier..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#356a5a] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReviewingItem(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="rounded-xl bg-[#356a5a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2b5548] disabled:opacity-60"
                  >
                    {submittingReview ? 'Saving Decision…' : 'Confirm Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dossier Preview Modal */}
        {dossierData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#356a5a]" />
                  <h3 className="text-base font-bold text-slate-900">Official Chain-of-Custody Dossier</h3>
                </div>
                <button type="button" onClick={() => setDossierData(null)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <div className="mt-4 rounded-xl bg-slate-950 p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                <pre>{JSON.stringify(dossierData, null, 2)}</pre>
              </div>

              <div className="mt-4 flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="text-[10px] text-slate-400">Cryptographically signed verification trail</span>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(dossierData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${dossierData.dossierId}.json`;
                    a.click();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#356a5a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2b5548]"
                >
                  <Download size={14} /> Download File (.json)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EvidencePage;
