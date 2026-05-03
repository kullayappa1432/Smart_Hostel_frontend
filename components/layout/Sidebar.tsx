'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BedDouble, CreditCard, CalendarCheck,
  MessageSquareWarning, UtensilsCrossed, User, Users,
  Building2, ChevronLeft, ChevronRight, LogOut, Bell,
  IndianRupee, CalendarDays, UserCheck, ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { getInitials } from '@/lib/utils';

const studentNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/fees', label: 'My Fees', icon: IndianRupee },
  { href: '/leave-requests', label: 'Leave Requests', icon: CalendarDays },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/admin/allocations', label: 'Allocations', icon: Building2 },
  { href: '/admin/attenders', label: 'Attenders', icon: UserCheck },
  { href: '/admin/fees', label: 'Fees', icon: IndianRupee },
  { href: '/admin/fee-payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/leave-requests', label: 'Leave Requests', icon: CalendarDays },
  { href: '/admin/visitors', label: 'Visitors', icon: UserCheck },
  { href: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
];

const attenderNav = [
  { href: '/attender/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/attender/students', label: 'Students', icon: Users },
  { href: '/attender/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/attender/expenses', label: 'Expenses', icon: ClipboardList },
  { href: '/attender/payments', label: 'Pending Payments', icon: IndianRupee },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const navItems = user?.role === 'ADMIN' ? adminNav
    : user?.role === 'ATTENDER' ? attenderNav
    : studentNav;

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-white shadow-lg transition-all duration-300',
        'border-r border-slate-100 dark:border-slate-800 dark:bg-slate-900',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white text-sm">SmartHostel</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl gradient-primary">
            <Building2 className="h-4 w-4 text-white" />
          </div>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <ul className="space-y-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    active
                      ? 'gradient-primary text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                    sidebarCollapsed && 'justify-center px-2',
                  )}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-2">
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-primary text-white text-xs font-bold">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{user.full_name}</p>
              <p className="truncate text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
        )}

        <div className={cn('flex gap-2', sidebarCollapsed && 'flex-col items-center')}>
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500',
              'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors',
              sidebarCollapsed ? 'justify-center w-full' : 'flex-1',
            )}
            title="Logout"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && 'Logout'}
          </button>

          {sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="flex w-full items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
