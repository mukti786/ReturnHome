import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Bell, Check, ExternalLink, Shield, User, ArrowLeftRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { NotificationItem } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await apiService.getUnreadNotificationCount();
      if (res.success) {
        setUnreadCount(res.count);
      }
    } catch { /* ignore */ }
  };

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await apiService.getNotifications({ limit: '10' });
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch { /* ignore */ }
    finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    void fetchUnreadCount();
    const interval = setInterval(() => void fetchUnreadCount(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) {
      void fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notifId: string, link?: string) => {
    try {
      await apiService.markNotificationRead(notifId);
      setNotifications(prev => prev.map(n => n.notificationId === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (link) {
        setIsOpen(false);
        navigate(link);
      }
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const handleToggleWorkspace = async () => {
    setSwitchingRole(true);
    try {
      if (user?.role === 'Citizen') {
        await loginDemo('Investigator');
      } else {
        await loginDemo('Citizen');
      }
      navigate('/dashboard');
    } catch {
      /* ignore */
    } finally {
      setSwitchingRole(false);
    }
  };

  const isCitizen = user?.role === 'Citizen';

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${isCitizen ? 'bg-blue-50 text-blue-700' : 'bg-slate-900 text-white'}`}>
          {isCitizen ? <User size={16} /> : <Shield size={16} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">
              {isCitizen ? 'Citizen Portal' : 'Investigator Workspace'}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
              isCitizen 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-teal-50 text-teal-800 border-teal-200'
            }`}>
              {user?.role || 'Authorized'}
            </span>
            {user?.isDemo && (
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                Demo Session
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            {isCitizen 
              ? 'File reports, track active submissions, and submit community sightings.' 
              : 'Case dossier management, AI forensic matching, and evidence review.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Workspace Switcher Pill */}
        <button
          type="button"
          onClick={handleToggleWorkspace}
          disabled={switchingRole}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Switch between Citizen and Investigator views"
        >
          <ArrowLeftRight size={13} className="text-slate-500" />
          <span className="hidden md:inline">
            Switch to {isCitizen ? 'Investigator' : 'Citizen'} View
          </span>
          <span className="md:hidden">Switch</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={toggleDropdown}
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-800"
            aria-label="View notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-800 hover:underline"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {loadingNotifs ? (
                  <div className="p-6 text-center text-xs text-slate-500">Loading notifications…</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No notifications.</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.notificationId}
                      className={`p-3.5 transition-colors hover:bg-slate-50 flex items-start gap-3 cursor-pointer ${notif.read ? 'opacity-70 bg-white' : 'bg-teal-50/30'}`}
                      onClick={() => handleMarkAsRead(notif.notificationId, notif.link)}
                    >
                      <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${notif.read ? 'bg-transparent' : 'bg-teal-700'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{notif.message}</p>
                        {notif.link && (
                          <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-teal-800">
                            View details <ExternalLink size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="hidden text-right lg:block pl-2 border-l border-slate-200">
          <p className="text-xs font-semibold text-slate-800">{user?.name || 'User'}</p>
          <p className="text-[11px] text-slate-500">{user?.organization || (isCitizen ? 'Citizen Reporter' : 'Investigator')}</p>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-60"
          title="Sign out"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">{signingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
