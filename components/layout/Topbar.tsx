'use client';
import { useState, useEffect } from 'react';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { notificationsApi } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useHydrated } from '@/hooks/useHydrated';

export function Topbar() {
  const { user } = useAuthStore();
  const hydrated = useHydrated();
  const { darkMode, toggleDarkMode, toggleSidebar, sidebarCollapsed } = useUIStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Only fetch after hydration so the token is guaranteed in localStorage
    if (!hydrated || !user) return;
    notificationsApi.getMyNotifications()
      .then((res) => {
        const data = res.data?.data;
        setNotifications(data?.notifications?.slice(0, 5) || []);
        setUnreadCount(data?.unreadCount || 0);
      })
      .catch(() => {});
  }, [hydrated, user]);

  const markAllRead = async () => {
    await notificationsApi.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md px-4 dark:border-slate-800 dark:bg-slate-900/80">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 scale-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-600">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'border-b border-slate-50 dark:border-slate-800 px-4 py-3 last:border-0',
                        !n.is_read && 'bg-blue-50/50 dark:bg-blue-900/10',
                      )}
                    >
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity">
          {user ? getInitials(user.full_name) : 'U'}
        </Link>
      </div>
    </header>
  );
}
