'use client';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useHydrated } from './useHydrated';

/**
 * Runs fetchFn only after Zustand has rehydrated AND the user is authenticated.
 * Prevents 401 errors from API calls firing before the token is available.
 */
export function useProtectedFetch(fetchFn: () => void, deps: any[] = []) {
  const hydrated = useHydrated();
  const { isAuthenticated } = useAuthStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchFn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated, ...deps]);
}
