'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useHydrated } from '@/hooks/useHydrated';

export default function Home() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;

    if (isAuthenticated && user) {
      const roleRoutes: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        ATTENDER: '/attender/dashboard',
        WARDEN: '/attender/dashboard',
        ACCOUNTANT: '/admin/dashboard',
      };
      router.replace(roleRoutes[user.role] || '/dashboard');
    } else {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );
}
