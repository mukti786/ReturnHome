import React, { useState, useEffect, useRef } from 'react';
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
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submitLock = useRef(false);

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
    if (!caseItem || submitLock.current || loading) return;
    const nextFieldErrors: Record<string, string> = {};
    if (!caseItem.name.trim()) nextFieldErrors.name = 'Enter the missing person’s name.';
    if (!Number.isFinite(caseItem.age) || caseItem.age < 0 || caseItem.age > 130) nextFieldErrors.age = 'Enter an age from 0 to 130.';
    if (!caseItem.lastSeenLocation.trim()) nextFieldErrors.location = 'Enter the last known location.';
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFormError('');
      return;
    }
    submitLock.current = true;
    setFormError('');
    setLoading(true);
    try {
      const response = await apiService.updateCase(caseItem.caseId, caseItem);
      if (response.success !== true || !response.case) throw new Error(response.message || 'The server did not confirm the case update.');
      navigate(`/cases/${caseItem.caseId}`);
    } catch (err: any) {
      setFormError(err.message || 'The case could not be updated. Please try again.');
    } finally {
      submitLock.current = false;
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

          <form noValidate onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            {formError && <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">{formError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name <span className="text-rose-300">*</span></label>
                <input
                  type="text"
                  required
                  value={caseItem.name}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'edit-name-error' : undefined}
                  onChange={(e) => { setCaseItem({ ...caseItem, name: e.target.value }); setFieldErrors((current) => ({ ...current, name: '' })); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
                {fieldErrors.name && <p id="edit-name-error" className="mt-1 text-xs text-rose-300">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Age <span className="text-rose-300">*</span></label>
                <input
                  type="number"
                  min={0}
                  max={130}
                  required
                  value={Number.isNaN(caseItem.age) ? '' : caseItem.age}
                  aria-invalid={!!fieldErrors.age}
                  aria-describedby={fieldErrors.age ? 'edit-age-error' : undefined}
                  onChange={(e) => { setCaseItem({ ...caseItem, age: e.target.value === '' ? Number.NaN : Number(e.target.value) }); setFieldErrors((current) => ({ ...current, age: '' })); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
                {fieldErrors.age && <p id="edit-age-error" className="mt-1 text-xs text-rose-300">{fieldErrors.age}</p>}
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Last Known Location <span className="text-rose-300">*</span></label>
                <input
                  type="text"
                  required
                  value={caseItem.lastSeenLocation}
                  aria-invalid={!!fieldErrors.location}
                  aria-describedby={fieldErrors.location ? 'edit-location-error' : undefined}
                  onChange={(e) => { setCaseItem({ ...caseItem, lastSeenLocation: e.target.value }); setFieldErrors((current) => ({ ...current, location: '' })); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
                {fieldErrors.location && <p id="edit-location-error" className="mt-1 text-xs text-rose-300">{fieldErrors.location}</p>}
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

