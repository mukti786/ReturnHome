import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, Mail, Building, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import { apiService } from '../services/api';
import { User, UserRole } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [actionMessage, setActionMessage] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  const loadUsers = async () => {
    setLoading(true);
    setActionError('');
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (roleFilter !== 'All') params.role = roleFilter;
      const res = await apiService.getUsers(params);
      setUsers(res.users || []);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [statusFilter, roleFilter]);

  const handleApprove = async (userId: string, targetRole: UserRole = 'Investigator') => {
    setActionError('');
    setActionMessage('');
    try {
      const res = await apiService.approveUser(userId, targetRole);
      setActionMessage(res.message || 'User approved successfully.');
      await loadUsers();
    } catch (err: any) {
      setActionError(err.message || 'Approval failed.');
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt('Enter rejection reason:') || 'Application rejected by administrator';
    setActionError('');
    setActionMessage('');
    try {
      const res = await apiService.rejectUser(userId, reason);
      setActionMessage(res.message || 'User application rejected.');
      await loadUsers();
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed.');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this account? All active sessions will be terminated.')) {
      return;
    }
    setActionError('');
    setActionMessage('');
    try {
      const res = await apiService.deactivateUser(userId);
      setActionMessage(res.message || 'User deactivated.');
      await loadUsers();
    } catch (err: any) {
      setActionError(err.message || 'Deactivation failed.');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#356a5a]">Identity & Access Management</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                User & Investigator Approvals
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Review pending investigator access requests, manage role authorizations, and audit user accounts.
              </p>
            </div>
            <button
              onClick={() => void loadUsers()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Users
            </button>
          </header>

          <BrandDisclaimer variant="compact" />

          {actionMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {actionError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Account Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1d5147]"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Approval</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1d5147]"
              >
                <option value="All">All Roles</option>
                <option value="Investigator">Investigator</option>
                <option value="Citizen">Citizen</option>
                <option value="Admin">Admin</option>
                <option value="Analyst">Analyst</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading user accounts…</div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No user accounts found matching current filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 px-3">User Name</th>
                      <th className="pb-3 px-3">Email Address</th>
                      <th className="pb-3 px-3">Role</th>
                      <th className="pb-3 px-3">Organization</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const isPending = u.status === 'Pending';
                      const isActive = u.status === 'Active';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900">{u.name}</td>
                          <td className="py-3 px-3 text-slate-600">{u.email}</td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500">{u.organization || '—'}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right space-x-2">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(u.id, 'Investigator')}
                                  className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                                >
                                  Approve Investigator
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(u.id)}
                                  className="rounded bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-300 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {isActive && u.role !== 'Admin' && (
                              <button
                                type="button"
                                onClick={() => handleDeactivate(u.id)}
                                className="rounded bg-red-50 text-red-700 border border-red-200 px-2 py-1 text-[10px] font-semibold hover:bg-red-100 transition-colors"
                              >
                                Deactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default UsersPage;
