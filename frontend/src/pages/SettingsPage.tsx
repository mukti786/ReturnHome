import React, { useState } from 'react';
import { Settings, Sliders, Database, Shield, Save } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LogoMark from '../components/branding/LogoMark';

export const SettingsPage: React.FC = () => {
  const [minConfidence, setMinConfidence] = useState(0.80);
  const [retentionDays, setRetentionDays] = useState(90);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <LogoMark size="md" theme="dark" />
              <div>
                <h1 className="text-xl font-bold text-white">ReturnHome System Settings & AI Threshold Parameters</h1>
                <p className="text-xs text-slate-400">
                  Configure face matching confidence thresholds, data retention policies, and microservice URLs.
                </p>
              </div>
            </div>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold">
              System parameters saved successfully.
            </div>
          )}

          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> AI Vector Matching Thresholds
              </h3>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Minimum Candidate Lead Confidence Threshold</span>
                  <span className="font-mono font-bold text-cyan-400">{Math.round(minConfidence * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="0.95"
                  step="0.05"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Detections below this similarity score will not be surfaced to investigator candidate queues.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" /> Data Retention & Privacy Policy
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Unmatched CCTV Frame Retention Period (Days)
                </label>
                <input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full max-w-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Unmatched detection frames are automatically purged after this retention window in accordance with statutory privacy laws.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-teal-500 text-white font-semibold text-xs shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save System Configuration
              </button>
            </div>
          </form>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default SettingsPage;
