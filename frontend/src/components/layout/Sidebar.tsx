import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserPlus, Video, GitCompare, Clock,
  MapPin, Bell, FileText, UserCheck, ShieldCheck, Settings, Globe,
  ChevronRight, Camera, Eye, FolderKanban
} from 'lucide-react';
import Logo from '../branding/Logo';
import { useAuth } from '../../context/AuthContext';

const navigationGroups: Array<{
  label: string;
  items: Array<{ name: string; path: string; icon: React.ElementType; roles?: string[] }>;
}> = [
  { label: 'Overview', items: [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] },
  { label: 'Casework', items: [
    { name: 'Missing Persons', path: '/cases', icon: Users },
    { name: 'Register Person', path: '/cases/new', icon: UserPlus, roles: ['Admin', 'Investigator', 'Citizen'] },
    { name: 'Report Sighting', path: '/sightings/new', icon: Eye, roles: ['Admin', 'Investigator', 'Citizen'] },
  ] },
  { label: 'AI Detection & Review', items: [
    { name: 'Live Camera Feed', path: '/live-camera', icon: Camera },
    { name: 'Video Ingestion & Analysis', path: '/video-analysis', icon: Video },
    { name: 'Evidence Center', path: '/evidence', icon: FolderKanban },
    { name: 'Potential Matches', path: '/matches', icon: GitCompare },
    { name: 'Investigation Timeline', path: '/timeline', icon: Clock },
    { name: 'Location Map', path: '/map', icon: MapPin },
    { name: 'Alerts', path: '/alerts', icon: Bell },
  ] },
  { label: 'Records', items: [
    { name: 'Case Reports', path: '/reports', icon: FileText },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, roles: ['Admin', 'Investigator'] },
  ] },
  { label: 'Administration', items: [
    { name: 'User Management', path: '/users', icon: UserCheck, roles: ['Admin'] },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ] },
  { label: 'Public', items: [{ name: 'Reporting Information', path: '/public-report', icon: Globe }] },
];

export const Sidebar: React.FC = () => {
  const { activeRole } = useAuth();

  return (
    <aside className="flex h-screen w-16 shrink-0 flex-col border-r border-slate-200 bg-white text-slate-700 shadow-sm transition-colors lg:sticky lg:top-0 lg:z-30 lg:w-64">
      <div className="flex items-center justify-center border-b border-slate-100 p-3 lg:justify-start lg:p-4">
        <span className="lg:hidden"><Logo variant="icon" theme="dark" size="sm" /></span>
        <span className="hidden lg:inline-flex"><Logo variant="full" theme="dark" size="md" showTagline={false} /></span>
      </div>
      <nav aria-label="Investigator workspace" className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-2 py-4 lg:px-3">
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter((item) => !item.roles || item.roles.includes(activeRole));
          if (!visibleItems.length) return null;
          return (
            <section key={group.label} aria-label={group.label}>
              <h2 className="hidden px-3 pb-2 text-[10px] font-bold uppercase tracking-[.15em] text-slate-400 lg:block">{group.label}</h2>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} aria-label={item.name} title={item.name}
                    className={({ isActive }) => [
                      'group mb-1 flex min-h-10 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors lg:justify-between lg:px-3',
                      isActive ? 'bg-[#1d5147] text-white' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
                    ].join(' ')}>
                    {({ isActive }) => (
                      <>
                        <span className="flex items-center gap-3">
                          <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'} />
                          <span className="hidden lg:inline">{item.name}</span>
                        </span>
                        <ChevronRight size={13} className="hidden opacity-0 transition-opacity group-hover:opacity-100 lg:inline" />
                      </>
                    )}
                  </NavLink>
                );
              })}
            </section>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-3 text-center text-[10px] text-slate-400">
        <span className="hidden lg:inline">ReturnHome v1.0.0 • Production Core</span>
      </div>
    </aside>
  );
};

export default Sidebar;
