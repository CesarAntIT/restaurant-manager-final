import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set,get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      expiresAt: null,

      login: (userData, token, expiresIn) => set({
        user: userData,
        token: token,
        isAuthenticated: true,
        expiresAt: expiresIn ? Date.now() + expiresIn*1000 : null
      }),

      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        expiresAt: null
      }),

      checkSession: () => {
        const { expiresAt, logout, isAuthenticated } = get();
        if (isAuthenticated && expiresAt && Date.now() > expiresAt) {
          logout();
          return false;
        }
        return isAuthenticated;
      },
    }),
    {
      name: 'tableup-auth-storage', 
    }
  )
);
