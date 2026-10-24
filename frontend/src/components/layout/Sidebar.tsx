import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Video, 
  GitCompare, 
  Clock, 
  MapPin, 
  Bell, 
  FileText, 
  UserCheck, 
  ShieldCheck, 
  Settings, 
  Globe,
  ChevronRight
} from 'lucide-react';
import Logo from '../branding/Logo';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { activeRole } = useAuth();

  const navigation: Array<{ name: string; path: string; icon: React.ElementType; roles?: string[]; badge?: string }> = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Missing Persons', path: '/cases', icon: Users },
    { name: 'Register Person', path: '/cases/new', icon: UserPlus, roles: ['Admin', 'Investigator'] },
    { name: 'CCTV / Video Analysis', path: '/video-analysis', icon: Video },
    { name: 'Potential Matches', path: '/matches', icon: GitCompare },
    { name: 'Investigation Timeline', path: '/timeline', icon: Clock },
    { name: 'Location Map', path: '/map', icon: MapPin },
    { name: 'Alert System', path: '/alerts', icon: Bell },
    { name: 'Case Reports', path: '/reports', icon: FileText },
    { name: 'User Management', path: '/users', icon: UserCheck, roles: ['Admin'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, roles: ['Admin', 'Investigator'] },
    { name: 'Public Portal', path: '/public-report', icon: Globe },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 text-slate-700 flex flex-col h-screen sticky top-0 z-30 shadow-sm transition-colors">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Logo variant="full" theme="dark" size="md" showTagline={false} />
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Investigation Workspace
        </div>

        {navigation.map((item) => {
          if (item.roles && !item.roles.includes(activeRole)) return null;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#1d5147] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#356a5a]'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge ? (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                    }`}>
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Role Badge */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-700 font-semibold">Role: {activeRole}</span>
        </div>
        <span className="text-[10px] text-cyan-800 font-mono font-bold bg-cyan-100 border border-cyan-200 px-2 py-0.5 rounded-md">
          SAMPLE DATA
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;




