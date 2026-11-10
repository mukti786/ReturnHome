import React, { useState, useEffect, useRef } from 'react';
import { LogOut, ShieldCheck, Bell, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { NotificationItem } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

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

  // Close dropdown on click outside
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
    setError('');
    try {
      await logout();
      navigate('/', { replace: true });
    } catch {
      setError('Could not end your server session. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf2ed] text-[#356a5a]">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">ReturnHome Operations</p>
          <p className={`text-[11px] ${user?.isDemo ? 'font-semibold text-amber-800' : 'text-slate-500'}`}>
            {user?.role === 'Citizen' ? 'Citizen Portal · Verified Case Submissions' : user?.isDemo ? 'Local demo session' : 'Authorized Investigation Access'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={toggleDropdown}
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#356a5a]"
            aria-label="View notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#356a5a] hover:underline"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {loadingNotifs ? (
                  <div className="p-6 text-center text-xs text-slate-500">Loading notifications…</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No recent notifications.</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.notificationId}
                      className={`p-3.5 transition-colors hover:bg-slate-50 flex items-start gap-3 cursor-pointer ${notif.read ? 'opacity-70 bg-white' : 'bg-teal-50/40'}`}
                      onClick={() => handleMarkAsRead(notif.notificationId, notif.link)}
                    >
                      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${notif.read ? 'bg-transparent' : 'bg-teal-600'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{notif.message}</p>
                        {notif.link && (
                          <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-[#356a5a]">
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

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
          <p className="text-xs text-slate-500">{user?.isDemo ? 'DEMO · NOT VERIFIED' : (user?.role || 'Authorized user')}</p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356a5a] disabled:opacity-60"
          title="Sign out"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">{signingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>
      {error && <p role="alert" className="absolute right-4 top-full mt-2 max-w-xs rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 shadow-lg">{error}</p>}
    </header>
  );
};

export default Navbar;
