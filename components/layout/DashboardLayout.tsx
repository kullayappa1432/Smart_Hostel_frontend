'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAttender?: boolean;
}

export function DashboardLayout({ children, requireAdmin = false, requireAttender = false }: DashboardLayoutProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { isAuthenticated, user } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (requireAdmin && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
    if (requireAttender && user?.role !== 'ATTENDER' && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
    // Non-student roles that land on student dashboard get redirected
    if (!requireAdmin && !requireAttender) {
      if (user?.role === 'ATTENDER' || user?.role === 'WARDEN') {
        router.replace('/attender/dashboard');
      }
    }
  }, [hydrated, isAuthenticated, user, requireAdmin, requireAttender, router]);

  // Spinner while hydrating
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Hydrated but not authenticated — redirect in progress
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]',
        )}
      >
        <Topbar />
        <main className="p-6">
          <div className="fade-in">{children}</div>
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-slate-800 dark:text-white',
          duration: 3000,
        }}
      />
    </div>
  );
}
