'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  uuid: string;
  role: 'ADMIN' | 'STUDENT' | 'ATTENDER' | 'WARDEN' | 'ACCOUNTANT';
  full_name: string;
  email: string;
  phone?: string;
  student?: {
    id: string;
    hall_ticket_number: string;
    name: string;
    gender: string;
    course: string;
    department: { department_name: string; department_code: string };
    semester: { semester_number: number; academic_year: string };
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        // Remove token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('hostel-auth'); // Clear Zustand persist storage
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'hostel-auth',
    },
  ),
);
