import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { apiService } from '../services/api';
import { MissingPersonCase } from '../types';

export const EditCasePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseItem, setCaseItem] = useState<MissingPersonCase | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCase() {
      if (!id) return;
      try {
        const res = await apiService.getCaseById(id);
        if (res.case) setCaseItem(res.case);
      } catch (err) {
        console.warn('Backend server offline');
      }
    }
    loadCase();
  }, [id]);

  if (!caseItem) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading Case Data...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.updateCase(caseItem.caseId, caseItem);
      setLoading(false);
      navigate(`/cases/${caseItem.caseId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to update case');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div>
              <h1 className="text-xl font-bold text-white">Edit Case #{caseItem.caseId}</h1>
              <p className="text-xs text-slate-400">Update missing person demographics, priority, or investigation status.</p>
            </div>

            <button
              onClick={() => navigate(`/cases/${caseItem.caseId}`)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel Editing
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={caseItem.name}
                  onChange={(e) => setCaseItem({ ...caseItem, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Age</label>
                <input
                  type="number"
                  value={caseItem.age}
                  onChange={(e) => setCaseItem({ ...caseItem, age: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Case Status</label>
                <select
                  value={caseItem.status}
                  onChange={(e) => setCaseItem({ ...caseItem, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 font-semibold text-cyan-400"
                >
                  <option value="Active">Active</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Potential Match">Potential Match</option>
                  <option value="Found">Found</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Investigation Priority</label>
                <select
                  value={caseItem.priority}
                  onChange={(e) => setCaseItem({ ...caseItem, priority: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 font-semibold"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Last Known Location</label>
                <input
                  type="text"
                  value={caseItem.lastSeenLocation}
                  onChange={(e) => setCaseItem({ ...caseItem, lastSeenLocation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={caseItem.description}
                onChange={(e) => setCaseItem({ ...caseItem, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#1d5147] text-white font-semibold text-xs shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Case Updates
              </button>
            </div>
          </form>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default EditCasePage;

