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

export const MissingPersonsPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [genderFilter, setGenderFilter] = useState<string>('All');

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await apiService.getCases({
          search,
          status: statusFilter,
          priority: priorityFilter,
          gender: genderFilter
        });
        if (res.cases) setCases(res.cases);
      } catch (err) {
        console.warn('Backend server offline');
      }
    }
    loadCases();
  }, [search, statusFilter, priorityFilter, genderFilter]);

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
                {cases.map((c) => (
                  <tr key={c.caseId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-extrabold text-indigo-700">{c.caseId}</td>
                    <td className="py-3.5 px-3">
                      <img
                        src={c.photos[0] || 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=100&q=80'}
                        alt={c.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-300 shadow-sm"
                      />
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

