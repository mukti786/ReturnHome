import React, { useState } from 'react';
import { Search, Bell, Shield, User as UserIcon, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, activeRole, switchRole, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);

  const roles: UserRole[] = ['Admin', 'Investigator', 'Analyst', 'Viewer'];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
      {/* Left: Quick Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by case ID, person name, camera, or location..."
            className="w-full bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-1.5 rounded-xl hover:bg-slate-200/70 transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Role: <strong className="text-indigo-900 font-extrabold">{activeRole}</strong></span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
              <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                Switch Role Context
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <span>{r}</span>
                  {activeRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsMenu(!showAlertsMenu)}
            className="relative p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-all"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500" />
          </button>

          {showAlertsMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-cyan-600" /> Real-Time Alerts
                </span>
                <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded-md font-mono">
                  Socket.IO Active
                </span>
              </div>
              <div className="mt-3 space-y-2.5 max-h-60 overflow-y-auto">
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                  <span className="font-bold text-amber-900 block">High Score Potential Lead</span>
                  <p className="text-amber-800 text-[11px]">Aarav Sharma matched on CAM-01 (91% similarity).</p>
                  <span className="text-[10px] text-amber-700 block">2 mins ago</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">CCTV Batch Analysis Done</span>
                  <p className="text-slate-600 text-[11px]">7,240 frames analyzed for CAM-02 stream.</p>
                  <span className="text-[10px] text-slate-400 block">15 mins ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center font-black text-white text-xs shadow-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'Investigator'}</span>
            <span className="text-[10px] text-slate-500 font-medium leading-tight">{user?.organization || 'ReturnHome Unit'}</span>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-all ml-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
