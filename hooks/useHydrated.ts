'use client';
import { useEffect, useState } from 'react';

/**
 * Returns true after the first client-side render.
 * This is sufficient to guard against SSR/hydration mismatches
 * and Zustand persist rehydration — localStorage is always
 * available and Zustand rehydrates synchronously on the client.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
