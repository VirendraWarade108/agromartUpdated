import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;

  isAdmin: () => boolean;
  getUserInitials: () => string;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });

        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
      },

      login: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false
        });

        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false
        });

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false
        });

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      checkAuth: async () => {
        const token = get().accessToken;
        if (!token) {
          get().logout();
          return;
        }

        try {
          set({ isLoading: true });

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (!res.ok) {
            throw new Error(`Auth check failed with status ${res.status}`);
          }

          const response = await res.json();
          
          // Validate response structure
          if (response.success && response.data) {
            set({ user: response.data, isAuthenticated: true });
          } else {
            throw new Error('Invalid auth response');
          }

        } catch (error) {
          console.error('Auth check failed:', error);
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },

      isAdmin: () => get().user?.role === 'admin',

      getUserInitials: () =>
        get().user?.fullName
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || ''
    }),
    {
      name: 'agromart-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
