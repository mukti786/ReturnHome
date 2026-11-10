import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, CheckCircle2, Clock3, GitCompare, Plus,
  ShieldAlert, Users, Eye, FolderKanban, Camera, Video, MapPin,
  Calendar, FileText, CheckCircle, AlertCircle
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import { apiService } from '../services/api';
import { MissingPersonCase, CandidateMatch, TimelineEvent, DashboardStats, SightingItem } from '../types';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCitizen = user?.role === 'Citizen';

  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    potentialMatches: 0,
    verifiedMatches: 0,
    resolvedCases: 0
  });
  const [recentCases, setRecentCases] = useState<MissingPersonCase[]>([]);
  const [myCases, setMyCases] = useState<MissingPersonCase[]>([]);
  const [mySightings, setMySightings] = useState<SightingItem[]>([]);
  const [recentMatches, setRecentMatches] = useState<CandidateMatch[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (isCitizen) {
          const [myCasesRes, mySightingsRes] = await Promise.all([
            apiService.getMyCases({ limit: '10' }).catch(() => ({ cases: [] })),
            apiService.getSightings({ limit: '10' }).catch(() => ({ sightings: [] }))
          ]);
          setMyCases(myCasesRes.cases || []);
          setMySightings(mySightingsRes.sightings || []);
        } else {
          const response = await apiService.getDashboardStats();
          if (response.stats) setStats(response.stats);
          if (response.recentCases) setRecentCases(response.recentCases);
          if (response.recentMatches) setRecentMatches(response.recentMatches);
          if (response.recentTimeline) setTimeline(response.recentTimeline);
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Workspace information is unavailable.');
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [isCitizen]);

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const investigatorMetrics = [
    { label: 'Active Case Dossiers', value: stats.activeCases || stats.totalCases, icon: Users, detail: 'Assigned missing person investigations' },
    { label: 'AI Detection Leads', value: stats.potentialMatches, icon: GitCompare, detail: 'Awaiting investigator verification' },
    { label: 'Verified Matches', value: stats.verifiedMatches, icon: CheckCircle2, detail: 'Positive human confirmations' },
    { label: 'Resolved Cases', value: stats.resolvedCases, icon: CheckCircle2, detail: 'Marked located or closed' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#356a5a]">
                {isCitizen ? 'Citizen Portal' : 'Investigator Workspace'}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {isCitizen ? `Welcome, ${user?.name || 'Citizen'}` : 'Investigation Command Center'}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {isCitizen
                  ? 'Track your submitted missing-person reports, submit sightings with GPS coordinates, and monitor investigator updates.'
                  : 'Monitor active cases, review real-time AI detections, verify citizen sightings, and manage evidence intelligence.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/cases/new')}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1d5147] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#163f37] transition-colors shadow-sm"
              >
                <Plus size={15} /> Report Missing Person
              </button>
              <button
                type="button"
                onClick={() => navigate('/sightings/new')}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-teal-600 bg-teal-50 px-4 py-2.5 text-xs font-semibold text-[#1d5147] hover:bg-teal-100 transition-colors"
              >
                <Eye size={15} /> Report a Sighting
              </button>
              {!isCitizen && (
                <button
                  type="button"
                  onClick={() => navigate('/evidence')}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FolderKanban size={15} /> Evidence Center
                </button>
              )}
            </div>
          </header>

          <BrandDisclaimer variant="compact" />

          {loadError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {loadError} Refresh this page to try again.
            </div>
          )}

          {/* CITIZEN PORTAL VIEW */}
          {isCitizen ? (
            <div className="space-y-8">
              {/* My Submitted Cases */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">My Missing Person Reports</h2>
                    <p className="text-xs text-slate-500">Cases you have registered with ReturnHome</p>
                  </div>
                  <Link
                    to="/cases/new"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#356a5a] hover:underline"
                  >
                    <Plus size={14} /> New Report
                  </Link>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-xs text-slate-500">Loading your submitted cases…</div>
                ) : myCases.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="mx-auto h-10 w-10 text-slate-300" />
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">No cases submitted yet</h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                      If someone is missing, you can create a verified report with photographs and physical descriptions.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/cases/new')}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#356a5a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2b5548]"
                    >
                      <Plus size={14} /> Register a Missing Person
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {myCases.map((c) => (
                      <div
                        key={c.caseId}
                        className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#356a5a] hover:shadow-md cursor-pointer"
                        onClick={() => navigate(`/cases/${c.caseId}`)}
                      >
                        <div className="flex items-start gap-3.5">
                          {c.photos?.[0] ? (
                            <img
                              src={c.photos[0]}
                              alt={c.name}
                              className="h-16 w-16 shrink-0 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-slate-100 text-base font-bold text-slate-500">
                              {c.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-[10px] font-bold text-slate-400">{c.caseId}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(c.status)}`}>
                                {c.status}
                              </span>
                            </div>
                            <h3 className="mt-1 font-bold text-slate-900 group-hover:text-[#356a5a] truncate">{c.name}</h3>
                            <p className="text-xs text-slate-500">{c.age} yrs · {c.gender}</p>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-600 space-y-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{c.lastSeenLocation}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Calendar size={12} className="shrink-0" />
                            <span>Seen {c.lastSeenDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* My Submitted Sightings */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">My Sighting Reports</h2>
                    <p className="text-xs text-slate-500">Sightings you reported to help ongoing investigations</p>
                  </div>
                  <Link
                    to="/sightings/new"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#356a5a] hover:underline"
                  >
                    <Plus size={14} /> New Sighting
                  </Link>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-500">Loading your sighting reports…</div>
                ) : mySightings.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    You haven't reported any sightings yet. Have you seen someone from the public cases?{' '}
                    <Link to="/sightings/new" className="font-semibold text-[#356a5a] hover:underline">Submit a sighting</Link>.
                  </div>
                ) : (
                  <div className="mt-4 divide-y divide-slate-100">
                    {mySightings.map((s) => (
                      <div key={s.sightingId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#356a5a]">{s.sightingId}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <Link to={`/cases/${s.caseRef}`} className="text-xs font-semibold text-slate-800 hover:underline">
                              Case: {s.caseRef}
                            </Link>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              s.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              s.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                              'bg-amber-100 text-amber-800 border-amber-200'
                            }`}>
                              {s.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700">Location: <strong>{s.location}</strong></p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">"{s.notes}"</p>
                        </div>
                        <div className="text-right text-[11px] text-slate-400 shrink-0">
                          {new Date(s.dateTimeSeen).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : (
            /* INVESTIGATOR COMMAND CENTER */
            <>
              {/* Summary KPIs */}
              <section aria-label="Casework summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {investigatorMetrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3.5">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-[#356a5a]">
                          <Icon size={20} />
                        </div>
                        <div>
                          <h2 className="text-xs font-medium text-slate-500">{metric.label}</h2>
                          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                            {loading || loadError ? '—' : metric.value}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">{metric.detail}</p>
                    </article>
                  );
                })}
              </section>

              {/* Core Panels: Active Cases & Candidate Reviews */}
              <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
                {/* Recent Case Records */}
                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Active Case Records</h2>
                      <p className="mt-0.5 text-xs text-slate-500">Live missing person investigations</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/cases')}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#356a5a] hover:underline"
                    >
                      All cases <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="px-5 py-3">Case ID</th>
                          <th className="px-5 py-3">Subject Name</th>
                          <th className="px-5 py-3">Last Seen</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading && (
                          <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">Loading cases…</td></tr>
                        )}
                        {!loading && !recentCases.length && (
                          <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">No active cases registered.</td></tr>
                        )}
                        {!loading && recentCases.map((record) => (
                          <tr key={record.caseId} className="transition-colors hover:bg-slate-50">
                            <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-bold text-[#356a5a]">
                              {record.caseId}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-semibold text-slate-900">{record.name}</span>
                              <span className="mt-0.5 block text-xs text-slate-500">{record.age} yrs · {record.gender}</span>
                            </td>
                            <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">
                              {record.lastSeenDate}
                              <span className="mt-0.5 block max-w-44 truncate text-slate-500">{record.lastSeenLocation}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(record.status)}`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                              <button
                                type="button"
                                onClick={() => navigate(`/cases/${record.caseId}`)}
                                className="font-semibold text-[#356a5a] hover:underline"
                              >
                                Investigate →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Candidate Detection Review */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">AI Detection Triage</h2>
                      <p className="mt-0.5 text-xs text-slate-500">All candidate matches require human review</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/matches')}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="flex-1 space-y-3 p-4 overflow-y-auto max-h-[460px]">
                    {loading && <p className="py-8 text-center text-xs text-slate-500">Loading candidate leads…</p>}
                    {!loading && !recentMatches.length && (
                      <div className="py-12 text-center text-xs text-slate-500">
                        No pending candidate leads require review.
                      </div>
                    )}
                    {!loading && recentMatches.map((match) => (
                      <div
                        key={match.matchId}
                        onClick={() => navigate(`/matches?id=${encodeURIComponent(match.matchId)}`)}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition-colors hover:border-[#356a5a] hover:bg-white"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{match.missingPersonName}</span>
                          <span className="shrink-0 rounded-md bg-[#1d5147] px-2 py-0.5 font-mono text-[11px] font-bold text-teal-100">
                            {Math.round(match.similarityScore * 100)}% match
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Case {match.caseId}</span>
                          <span>{match.cameraName || 'Camera Feed'}</span>
                        </div>
                        <span className="mt-2 block text-[10px] text-slate-400">
                          Human investigator confirmation required before verification
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Investigation Activity Log */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Recent Investigation Activity</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Real-time audit log of decisions and submissions</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/timeline')}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#356a5a] hover:underline"
                  >
                    Open timeline <ArrowUpRight size={14} />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 px-6">
                  {loading && <p className="py-6 text-xs text-slate-500">Loading recent activity…</p>}
                  {!loading && !timeline.length && (
                    <p className="py-6 text-xs text-slate-500">No activity recorded yet.</p>
                  )}
                  {!loading && timeline.map((event) => (
                    <article key={event.id} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{event.action}</h3>
                        <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{event.description}</p>
                      </div>
                      <p className="shrink-0 text-[11px] text-slate-400 font-mono">
                        {event.timestamp.replace('T', ' ').slice(0, 16)} · {event.user}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-700" />
            <p>
              ReturnHome operates strictly with human-in-the-loop review. Face detection similarities and video candidate leads are investigative leads and must never replace formal law enforcement identity confirmation.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardPage;
