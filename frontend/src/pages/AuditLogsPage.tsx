import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Lock, User, FileText } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LogoMark from '../components/branding/LogoMark';
import { apiService } from '../services/api';
import { AuditLogItem } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await apiService.getAuditLogs({ search });
        if (res.logs) setLogs(res.logs);
      } catch (err) {
        console.warn('Backend server offline');
      }
    }
    loadLogs();
  }, [search]);

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
                <h1 className="text-xl font-bold text-white">ReturnHome Cryptographic Immutable Audit Log</h1>
                <p className="text-xs text-slate-400">
                  Read-only audit record capturing every login, evidence search, video ingestion, and candidate match verification.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-xl">
              IMMUTABLE RECORD
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search audit trail by user, action, IP..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Resource</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/50 transition-colors text-[11px]">
                    <td className="py-3 px-3 text-slate-400">{l.timestamp.replace('T', ' ').slice(0, 19)}</td>
                    <td className="py-3 px-3 font-semibold text-white font-sans">{l.userName} ({l.userRole})</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{l.resource} {l.resourceId ? `(${l.resourceId})` : ''}</td>
                    <td className="py-3 px-3 text-slate-400">{l.ipAddress}</td>
                    <td className="py-3 px-3 text-slate-300 font-sans max-w-[280px] truncate">{l.details}</td>
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

export default AuditLogsPage;
