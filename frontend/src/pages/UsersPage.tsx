import React from 'react';
import { UserCheck, Shield, Mail, Building, Plus } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LogoMark from '../components/branding/LogoMark';

export const UsersPage: React.FC = () => {
  const users = [
    { id: '1', name: 'Inspector Vikram Singh', email: 'vikram.singh@ReturnHome.gov.in', role: 'Admin', organization: 'Delhi Police Special Unit', status: 'Active' },
    { id: '2', name: 'Officer Ananya Sen', email: 'ananya.sen@ReturnHome.gov.in', role: 'Investigator', organization: 'Crime Branch Unit', status: 'Active' },
    { id: '3', name: 'Dr. Rajesh Rao', email: 'rajesh.rao@ReturnHome.gov.in', role: 'Analyst', organization: 'Forensic Video Lab', status: 'Active' },
    { id: '4', name: 'Sunita Sharma', email: 'sunita.sharma@childrescue.org', role: 'Viewer', organization: 'Child Rescue Alliance NGO', status: 'Active' }
  ];

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
                <h1 className="text-xl font-bold text-white">Role-Based Access Control (RBAC) Management</h1>
                <p className="text-xs text-slate-400">
                  Manage agency investigators, administrators, video analysts, and read-only liaison viewers.
                </p>
              </div>
            </div>

            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold text-xs shadow-md flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Provision New User
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Organization</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-3 text-slate-300">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[10px] font-bold bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 px-2 py-0.5 rounded">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{u.organization}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        {u.status}
                      </span>
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

export default UsersPage;
