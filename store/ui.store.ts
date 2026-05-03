'use client';
import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  darkMode: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next);
      }
      return { darkMode: next };
    }),
}));
