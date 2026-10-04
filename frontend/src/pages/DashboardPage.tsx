import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  Video, 
  Clock, 
  ArrowUpRight, 
  BarChart3,
  ShieldAlert
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import LogoMark from '../components/branding/LogoMark';
import { apiService } from '../services/api';
import { MissingPersonCase, CandidateMatch, TimelineEvent, DashboardStats } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 34,
    activeCases: 18,
    potentialMatches: 7,
    verifiedMatches: 12,
    resolvedCases: 4
  });
  const [recentCases, setRecentCases] = useState<MissingPersonCase[]>([]);
  const [recentMatches, setRecentMatches] = useState<CandidateMatch[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiService.getDashboardStats();
        if (res.stats) setStats(res.stats);
        if (res.recentCases) setRecentCases(res.recentCases);
        if (res.recentMatches) setRecentMatches(res.recentMatches);
        if (res.recentTimeline) setTimeline(res.recentTimeline);
      } catch (err) {
        console.warn('Backend server offline, using seeded dashboard metrics');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const monthlyTrendData = [
    { month: 'Apr', cases: 12, matches: 6 },
    { month: 'May', cases: 18, matches: 11 },
    { month: 'Jun', cases: 24, matches: 16 },
    { month: 'Jul', cases: 28, matches: 21 },
    { month: 'Aug', cases: 31, matches: 27 },
    { month: 'Sep', cases: 34, matches: 31 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Top Command Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <LogoMark size="md" theme="light" />
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  ReturnHome Investigation Command Dashboard
                </h1>
                <p className="text-xs text-slate-600">
                  Intelligent Missing Person Detection & Candidate Match Monitoring • <strong className="text-cyan-700 font-bold">“From Missing to Found.”</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/cases/new')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:shadow-md text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
              >
                + Register New Case
              </button>
              <button
                onClick={() => navigate('/video-analysis')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Video className="w-4 h-4 text-indigo-600" /> Process CCTV Stream
              </button>
            </div>
          </div>

          {/* Ethical Disclaimer */}
          <BrandDisclaimer variant="compact" />

          {/* Top 5 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: 'Total Missing Persons', value: stats.totalCases, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
              { title: 'Active Cases', value: stats.activeCases, icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
              { title: 'Potential Matches', value: stats.potentialMatches, icon: GitCompare, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', badge: 'Review Needed' },
              { title: 'Verified Sightings', value: stats.verifiedMatches, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
              { title: 'Cases Resolved', value: stats.resolvedCases, icon: ShieldAlert, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' }
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="p-4.5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2 relative overflow-hidden hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-bold">{kpi.title}</span>
                    <div className={`p-2 rounded-xl ${kpi.bg}`}>
                      <Icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-slate-900">{kpi.value}</span>
                    {kpi.badge && (
                      <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md uppercase">
                        {kpi.badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Grid: Recent Cases & Potential Matches */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Cases Table */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" /> Recent Missing Person Cases
                </h3>
                <button
                  onClick={() => navigate('/cases')}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-bold"
                >
                  View All Cases <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-extrabold uppercase text-[10px] bg-slate-50">
                      <th className="py-2.5 px-3 rounded-l-lg">Case ID</th>
                      <th className="py-2.5 px-3">Person</th>
                      <th className="py-2.5 px-3">Age</th>
                      <th className="py-2.5 px-3">Last Seen</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentCases.map((c) => (
                      <tr
                        key={c.caseId}
                        onClick={() => navigate(`/cases/${c.caseId}`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">{c.caseId}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                          <img
                            src={c.photos[0] || 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=100&q=80'}
                            alt={c.name}
                            className="w-7.5 h-7.5 rounded-full object-cover border border-slate-300 shadow-sm"
                          />
                          <span>{c.name}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{c.age} yrs</td>
                        <td className="py-3 px-3 text-slate-500 font-medium">{c.lastSeenDate}</td>
                        <td className="py-3 px-3 text-slate-700 font-medium max-w-[140px] truncate">{c.lastSeenLocation}</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            c.status === 'Potential Match' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            c.status === 'Active' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                            'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Potential Matches Feed */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-amber-600" /> Candidate Leads Feed
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded border border-amber-300">
                  HUMAN REVIEW REQUIRED
                </span>
              </div>

              <div className="space-y-3">
                {recentMatches.map((m) => (
                  <div
                    key={m.matchId}
                    onClick={() => navigate(`/matches?id=${m.matchId}`)}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900">{m.missingPersonName}</span>
                      <span className="font-extrabold text-emerald-800 font-mono text-xs bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                        {Math.round(m.similarityScore * 100)}% Similarity
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <img
                          src={m.missingPersonPhoto}
                          alt="Reference"
                          className="w-full h-20 object-cover rounded-lg border border-slate-300 shadow-sm"
                        />
                        <span className="text-[9px] text-slate-500 font-bold mt-1 block">Reference</span>
                      </div>
                      <div className="text-center">
                        <img
                          src={m.detectedFrameUrl}
                          alt="Detected Frame"
                          className="w-full h-20 object-cover rounded-lg border border-cyan-400 shadow-sm"
                        />
                        <span className="text-[9px] text-cyan-700 font-bold mt-1 block font-mono">CCTV Frame</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 font-medium">
                      <span>Camera: <strong className="text-slate-900">{m.cameraId}</strong></span>
                      <span>Time: <strong className="text-slate-900">{m.timestamp.slice(11, 19)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Grid: Analytics & Investigation Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bar Chart: Monthly Trends */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" /> Case Registration & Match Processing Trends
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData}>
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="cases" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Registered Cases" />
                    <Bar dataKey="matches" fill="#0EA5E9" radius={[4, 4, 0, 0]} name="Matches Surfaced" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeline Activity Stream */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" /> Investigation Audit Stream
                </h3>
              </div>

              <div className="space-y-3 relative pl-4 border-l-2 border-indigo-100 max-h-64 overflow-y-auto">
                {timeline.map((evt) => (
                  <div key={evt.id} className="relative space-y-1">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900">{evt.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{evt.timestamp.slice(11, 16)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight font-normal">{evt.description}</p>
                    <span className="text-[10px] text-indigo-700 font-mono font-bold block">By {evt.user}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default DashboardPage;
