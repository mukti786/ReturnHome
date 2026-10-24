import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock3, GitCompare, Plus, ShieldAlert, Users } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import { apiService } from '../services/api';
import { MissingPersonCase, CandidateMatch, TimelineEvent, DashboardStats } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    potentialMatches: 0,
    verifiedMatches: 0,
    resolvedCases: 0
  });
  const [recentCases, setRecentCases] = useState<MissingPersonCase[]>([]);
  const [recentMatches, setRecentMatches] = useState<CandidateMatch[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await apiService.getDashboardStats();
        if (response.stats) setStats(response.stats);
        if (response.recentCases) setRecentCases(response.recentCases);
        if (response.recentMatches) setRecentMatches(response.recentMatches);
        if (response.recentTimeline) setTimeline(response.recentTimeline);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Workspace information is unavailable.');
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const metrics = [
    { label: 'Case records', value: stats.totalCases, icon: Users, detail: 'All records in this workspace' },
    { label: 'Active cases', value: stats.activeCases, icon: Clock3, detail: 'Open investigation records' },
    { label: 'Potential leads', value: stats.potentialMatches, icon: GitCompare, detail: 'Require human review' },
    { label: 'Resolved cases', value: stats.resolvedCases, icon: CheckCircle2, detail: 'Marked resolved in records' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#356a5a]">Investigator workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Casework overview</h1>
              <p className="mt-2 text-sm text-slate-600">Review case records, candidate leads and recent investigation activity.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate('/cases/new')} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1d5147] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#163f37]">
                <Plus size={16} /> Register a case
              </button>
              <button type="button" onClick={() => navigate('/matches')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Review potential leads <ArrowRight size={15} />
              </button>
            </div>
          </header>

          <BrandDisclaimer variant="compact" />

          {loadError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError} Refresh this page to try again.</div>}

          <section aria-label="Casework summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article key={metric.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-[#356a5a]"><Icon size={18} /></div>
                    <div><h2 className="text-xs font-medium text-slate-500">{metric.label}</h2><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{loading || loadError ? '—' : metric.value}</p></div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{metric.detail}</p>
                </article>
              );
            })}
          </section>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
            <section className="min-w-0 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div><h2 className="text-sm font-semibold text-slate-900">Recent case records</h2><p className="mt-1 text-xs text-slate-500">Example records from this workspace</p></div>
                <button type="button" onClick={() => navigate('/cases')} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#356a5a] hover:underline">All cases <ArrowUpRight size={14} /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead><tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><th className="px-4 py-3">Case</th><th className="px-4 py-3">Person</th><th className="px-4 py-3">Last seen</th><th className="px-4 py-3">Status</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">Loading case records…</td></tr>}
                    {!loading && !recentCases.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">{loadError ? 'Case records could not be loaded.' : 'No case records are available.'}</td></tr>}
                    {!loading && recentCases.map((record) => (
                      <tr key={record.caseId} className="transition-colors hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-[#356a5a]"><button type="button" onClick={() => navigate('/cases/' + record.caseId)} className="rounded-sm underline-offset-4 hover:underline focus-visible:underline">{record.caseId}</button></td>
                        <td className="px-4 py-3"><span className="font-medium text-slate-900">{record.name}</span><span className="mt-0.5 block text-xs text-slate-500">{record.age} years</span></td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{record.lastSeenDate}<span className="mt-0.5 block max-w-40 truncate text-slate-500">{record.lastSeenLocation}</span></td>
                        <td className="px-4 py-3"><span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{record.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div><h2 className="text-sm font-semibold text-slate-900">Candidate review</h2><p className="mt-1 text-xs text-slate-500">Every lead requires independent review</p></div>
                <button type="button" onClick={() => navigate('/matches')} aria-label="Open candidate review" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><ArrowUpRight size={16} /></button>
              </div>
              <div className="space-y-3 p-4">
                {loading && <p role="status" className="py-8 text-center text-sm text-slate-500">Loading candidate leads…</p>}
                {!loading && !recentMatches.length && <p className="py-8 text-center text-sm text-slate-500">{loadError ? 'Candidate leads could not be loaded.' : 'No candidate leads are available.'}</p>}
                {!loading && recentMatches.map((match) => (
                  <button key={match.matchId} type="button" onClick={() => navigate('/matches?id=' + encodeURIComponent(match.matchId))} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100">
                    <span className="flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold text-slate-900">{match.missingPersonName}</span><span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-mono text-[11px] font-semibold text-amber-900">{Math.round(match.similarityScore * 100)}% similarity</span></span>
                    <span className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500"><span className="truncate">Case {match.caseId}</span><span className="shrink-0">{match.timestamp.slice(0, 10)}</span></span>
                    <span className="mt-2 block text-[11px] text-slate-500">Illustrative score only · human review required</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div><h2 className="text-sm font-semibold text-slate-900">Recent investigation activity</h2><p className="mt-1 text-xs text-slate-500">Audit and timeline entries in the workspace</p></div>
              <button type="button" onClick={() => navigate('/timeline')} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#356a5a] hover:underline">Open timeline <ArrowUpRight size={14} /></button>
            </div>
            <div className="divide-y divide-slate-100 px-5">
              {loading && <p role="status" className="py-6 text-sm text-slate-500">Loading recent activity…</p>}
              {!loading && !timeline.length && <p className="py-6 text-sm text-slate-500">{loadError ? 'Recent activity could not be loaded.' : 'No recent activity is available.'}</p>}
              {!loading && timeline.map((event) => (
                <article key={event.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div><h3 className="text-sm font-medium text-slate-900">{event.action}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{event.description}</p></div>
                  <p className="shrink-0 text-xs text-slate-500">{event.timestamp.replace('T', ' ').slice(0, 16)} · {event.user}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900"><ShieldAlert size={16} className="mt-0.5 shrink-0" /><p>Sample records and similarity scores are illustrative. Do not use them as evidence or as a basis for identity decisions.</p></div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardPage;

