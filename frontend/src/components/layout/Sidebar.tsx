import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserPlus, Video, GitCompare, Clock,
  MapPin, Bell, FileText, UserCheck, ShieldCheck, Settings, Globe,
  ChevronRight, Camera, Eye, FolderKanban, X
} from 'lucide-react';
import Logo from '../branding/Logo';
import { useAuth } from '../../context/AuthContext';

const navigationGroups: Array<{
  label: string;
  items: Array<{ name: string; path: string; icon: React.ElementType; roles?: string[]; end?: boolean }>;
}> = [
  { label: 'Overview', items: [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: true }] },
  { label: 'Casework', items: [
    { name: 'Missing Persons', path: '/cases', icon: Users, roles: ['Admin', 'Investigator', 'Analyst'] },
    { name: 'Register Person', path: '/cases/new', icon: UserPlus, roles: ['Admin', 'Investigator'], end: true },
    { name: 'Report Sighting', path: '/sightings/new', icon: Eye, roles: ['Admin', 'Investigator', 'Analyst', 'Citizen'] },
  ] },
  { label: 'AI Detection & Review', items: [
    { name: 'Live Camera Feed', path: '/live-camera', icon: Camera, roles: ['Admin', 'Investigator', 'Analyst'] },
    { name: 'Video Ingestion & Analysis', path: '/video-analysis', icon: Video, roles: ['Admin', 'Investigator', 'Analyst'] },
    { name: 'Evidence Center', path: '/evidence', icon: FolderKanban, roles: ['Admin', 'Investigator', 'Analyst'] },
    { name: 'Potential Matches', path: '/matches', icon: GitCompare, roles: ['Admin', 'Investigator', 'Analyst'] },
    { name: 'Investigation Timeline', path: '/timeline', icon: Clock, roles: ['Admin', 'Investigator', 'Analyst'] },
    { name: 'Location Map', path: '/map', icon: MapPin, roles: ['Admin', 'Investigator', 'Analyst'] },
    { name: 'Alerts', path: '/alerts', icon: Bell, roles: ['Admin', 'Investigator', 'Analyst'] },
  ] },
  { label: 'Records', items: [
    { name: 'Case Reports', path: '/reports', icon: FileText, roles: ['Admin', 'Investigator', 'Analyst'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, roles: ['Admin', 'Investigator'] },
  ] },
  { label: 'Administration', items: [
    { name: 'User Management', path: '/users', icon: UserCheck, roles: ['Admin'] },
    { name: 'System Settings', path: '/settings', icon: Settings, roles: ['Admin', 'Investigator', 'Analyst'] },
  ] },
  { label: 'Citizen', items: [
    { name: 'Report a Missing Person', path: '/public-report', icon: Globe, roles: ['Citizen'], end: true },
  ] },
];

export const Sidebar: React.FC = () => {
  const { activeRole } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const openNavigation = () => setOpen(true);
    window.addEventListener('returnhome:open-navigation', openNavigation);
    return () => window.removeEventListener('returnhome:open-navigation', openNavigation);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return (
    <>
      {open && <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={close} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white text-slate-700 shadow-xl transition-transform lg:sticky lg:top-0 lg:z-30 lg:w-64 lg:translate-x-0 lg:shadow-sm ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex min-h-16 items-center justify-between border-b border-slate-100 px-4 py-3">
        <Logo variant="full" theme="dark" size="md" showTagline={false} />
        <button type="button" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close navigation menu" onClick={close}><X size={19} /></button>
      </div>
      <nav aria-label={activeRole === 'Citizen' ? 'Citizen workspace' : 'Investigator workspace'} className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-3 py-4">
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
                    end={item.end}
                    className={({ isActive }) => {
                      const sectionActive = item.path === '/cases'
                        ? location.pathname === '/cases' || (location.pathname.startsWith('/cases/') && location.pathname !== '/cases/new')
                        : isActive;
                      return [
                      'group mb-1 flex min-h-10 items-center justify-between rounded-lg px-3 text-sm font-medium transition-colors',
                      sectionActive ? 'bg-[#1d5147] text-white' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
                    ].join(' ');
                    }}>
                    {({ isActive }) => (
                      <>
                        <span className="flex items-center gap-3">
                          <Icon size={17} className={(item.path === '/cases' ? location.pathname === '/cases' || (location.pathname.startsWith('/cases/') && location.pathname !== '/cases/new') : isActive) ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'} />
                          <span>{item.name}</span>
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
        <span>ReturnHome v1.0.0</span>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
