import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UserPlus, Eye, Edit } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import LogoMark from '../components/branding/LogoMark';
import { apiService } from '../services/api';
import { MissingPersonCase } from '../types';
import { PublicReportItem } from '../types';

export const MissingPersonsPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [publicReports, setPublicReports] = useState<PublicReportItem[]>([]);
  const [publicReportsLoading, setPublicReportsLoading] = useState(true);
  const [publicReportError, setPublicReportError] = useState('');
  const [publicReportSearch, setPublicReportSearch] = useState('');
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadCases() {
      setCasesLoading(true);
      setCasesError('');
      try {
        const res = await apiService.getCases({
          search,
          status: statusFilter,
          priority: priorityFilter,
          gender: genderFilter
        });
        if (active && res.cases) setCases(res.cases);
      } catch (err) {
        if (active) setCasesError(err instanceof Error ? err.message : 'Could not load case records.');
      } finally {
        if (active) setCasesLoading(false);
      }
    }
    void loadCases();
    return () => { active = false; };
  }, [search, statusFilter, priorityFilter, genderFilter]);

  useEffect(() => {
    let active = true;
    apiService.getPublicReports()
      .then((response) => { if (active) setPublicReports(response.reports); })
      .catch((error: Error) => { if (active) setPublicReportError(error.message); })
      .finally(() => { if (active) setPublicReportsLoading(false); });
    return () => { active = false; };
  }, []);

  const normalizedReportSearch = publicReportSearch.trim().toLowerCase();
  const filteredPublicReports = publicReports.filter((report) => {
    if (!normalizedReportSearch) return true;
    const location = [report.lastSeen.address, report.lastSeen.city, report.lastSeen.state, report.lastSeen.country].join(' ');
    return `${report.referenceId} ${report.missingPerson.fullName} ${location}`.toLowerCase().includes(normalizedReportSearch);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <LogoMark size="md" theme="dark" />
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Missing Person Case Directory</h1>
                <p className="text-xs text-slate-600">
                  Manage registered missing person profiles, reference photos, and investigation priorities.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/cases/new')}
              className="px-4 py-2.5 rounded-xl bg-[#1d5147] text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Register New Missing Person
            </button>
          </div>

          <BrandDisclaimer variant="compact" />

          <section className="space-y-4 rounded-2xl border border-teal-200 bg-white p-5 shadow-sm" aria-labelledby="public-intake-heading">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-teal-700">Protected intake queue</p><h2 id="public-intake-heading" className="mt-1 text-lg font-bold text-slate-900">Public reports awaiting review</h2><p className="mt-1 text-xs text-slate-500">MongoDB submissions · reporter contacts and photos are visible only in this signed-in workspace.</p></div>
              <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">{publicReportsLoading ? 'Loading…' : `${filteredPublicReports.length} shown`}</span>
            </div>
            <label className="block max-w-xl text-xs font-semibold text-slate-600">Search reports by name, reference, or location<input type="search" value={publicReportSearch} onChange={(event) => setPublicReportSearch(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" /></label>
            {publicReportError ? <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Could not load the public report queue: {publicReportError}</p> : publicReportsLoading ? <p role="status" className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">Loading reports…</p> : publicReports.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No public reports are available yet. New submissions appear here after they are saved successfully.</p> : filteredPublicReports.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No public reports match “{publicReportSearch}”.</p> :
              <div className="grid gap-3 lg:grid-cols-2">{filteredPublicReports.map((report) => <article key={report._id} className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                {report.missingPerson.photoUrl ? <img src={report.missingPerson.photoUrl} alt={`Submitted photo of ${report.missingPerson.fullName}`} className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 object-cover" /> : <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-slate-200 text-xs text-slate-500">No photo</div>}
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-slate-900">{report.missingPerson.fullName}</h3><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900">{report.status}</span></div>
                  <p className="mt-1 text-xs text-slate-600">{[report.lastSeen.address, report.lastSeen.city, report.lastSeen.state, report.lastSeen.country].filter(Boolean).join(', ')}</p>
                  <p className="mt-1 text-xs text-slate-500">Reference {report.referenceId} · submitted {new Date(report.createdAt).toLocaleString()}</p>
                  <p className="mt-2 break-words text-xs text-slate-700">Reporter: {report.reporter.name}{report.reporter.phone ? ` · ${report.reporter.phone}` : ''}{report.reporter.email ? ` · ${report.reporter.email}` : ''}</p>
                  {report.lastSeen.latitude !== undefined && report.lastSeen.longitude !== undefined && <p className="mt-1 font-mono text-[10px] text-slate-500">{report.lastSeen.latitude}, {report.lastSeen.longitude}</p>}
                  <details className="mt-3 text-xs text-slate-600"><summary className="cursor-pointer font-semibold text-teal-800">Review submitted details</summary><div className="mt-2 space-y-1.5 leading-5">
                    <p><strong>Age / date of birth / gender:</strong> {report.missingPerson.age ?? 'Not provided'} / {report.missingPerson.dateOfBirth || 'Not provided'} / {report.missingPerson.gender || 'Not provided'}</p>
                    <p><strong>Last seen:</strong> {[report.lastSeen.date, report.lastSeen.time].filter(Boolean).join(' · ') || 'Not provided'}</p>
                    <p><strong>Physical description:</strong> {report.missingPerson.physicalDescription || 'Not provided'}</p>
                    <p><strong>Identifying marks:</strong> {report.missingPerson.identifyingMarks || 'Not provided'}</p>
                    <p><strong>Clothing:</strong> {report.missingPerson.clothing || 'Not provided'}</p>
                    <p><strong>Circumstances:</strong> {report.lastSeen.circumstances || 'Not provided'}</p>
                    <p><strong>Additional information:</strong> {report.missingPerson.additionalInformation || 'Not provided'}</p>
                    <p><strong>Reporter relationship / preference:</strong> {report.reporter.relationship || 'Not provided'} / {report.reporter.preferredContact || 'No preference'}</p>
                  </div></details>
                </div>
              </article>)}</div>}
          </section>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search */}
              <div className="md:col-span-4 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by case ID, name, location..."
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              {/* Status Filter */}
              <div className="md:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Potential Match">Potential Match</option>
                  <option value="Found">Found</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="md:col-span-3">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Gender Filter */}
              <div className="md:col-span-2">
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="All">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] bg-slate-50">
                  <th className="py-3 px-3 rounded-l-lg">Case ID</th>
                  <th className="py-3 px-3">Photo</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Age</th>
                  <th className="py-3 px-3">Gender</th>
                  <th className="py-3 px-3">Last Seen Date</th>
                  <th className="py-3 px-3">Last Known Location</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {casesLoading && <tr><td colSpan={10} className="py-8 text-center text-sm text-slate-500">Loading case records…</td></tr>}
                {!casesLoading && casesError && <tr><td colSpan={10} className="py-8 text-center text-sm text-rose-700" role="alert">Could not load case records: {casesError}</td></tr>}
                {!casesLoading && !casesError && cases.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-sm text-slate-500">No case records match these filters.</td></tr>}
                {!casesLoading && !casesError && cases.map((c) => (
                  <tr key={c.caseId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-extrabold text-indigo-700">{c.caseId}</td>
                    <td className="py-3.5 px-3">
                      {c.photos?.[0] ? <img src={c.photos[0]} alt={`Reference photo of ${c.name}`} className="w-9 h-9 rounded-full object-cover border border-slate-300 shadow-sm" /> : <span className="inline-grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-slate-100 text-[9px] text-slate-500">No photo</span>}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-3 text-slate-700 font-medium">{c.age}</td>
                    <td className="py-3.5 px-3 text-slate-700 font-medium">{c.gender}</td>
                    <td className="py-3.5 px-3 text-slate-500 font-medium">{c.lastSeenDate}</td>
                    <td className="py-3.5 px-3 text-slate-700 font-medium max-w-[160px] truncate">{c.lastSeenLocation}</td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        c.priority === 'Critical' ? 'bg-red-100 text-red-800 border border-red-300' :
                        c.priority === 'High' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        c.status === 'Potential Match' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        c.status === 'Active' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                        'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/cases/${c.caseId}`)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-indigo-700 transition-colors"
                          title="View Case Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/cases/${c.caseId}/edit`)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Edit Case"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MissingPersonsPage;

