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
  hasPermission: (permission: string) => boolean;
  isEmailVerified: () => boolean;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      /**
       * Set user data
       */
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      /**
       * Set authentication tokens
       */
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });

        // Sync with localStorage
        try {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
        } catch (error) {
          console.error('Failed to store tokens in localStorage:', error);
        }
      },

      /**
       * Login - Set user and tokens
       */
      login: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false
        });

        // Sync with localStorage
        try {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
        } catch (error) {
          console.error('Failed to store tokens in localStorage:', error);
        }
      },

      /**
       * Logout - Clear all auth data
       */
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false
        });

        // Clear localStorage
        try {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        } catch (error) {
          console.error('Failed to clear tokens from localStorage:', error);
        }
      },

      /**
       * Clear all auth data (alias for logout)
       */
      clearAuth: () => {
        get().logout();
      },

      /**
       * Update user data (partial update)
       */
      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },

      /**
       * Set loading state
       */
      setLoading: (loading) => set({ isLoading: loading }),

      /**
       * Check authentication status
       * Verifies token and fetches user profile
       */
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

      /**
       * Check if user is admin
       */
      isAdmin: () => {
        const user = get().user;
        return user?.role === 'admin';
      },

      /**
       * Get user initials from full name
       */
      getUserInitials: () => {
        const user = get().user;
        if (!user?.fullName) return '';
        
        return user.fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      },

      /**
       * Check if user has specific permission
       * Currently checks role-based permissions
       * Can be extended for more granular permissions
       */
      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user) return false;

        // Admin has all permissions
        if (user.role === 'admin') return true;

        // Define permission mappings
        const permissions: Record<string, string[]> = {
          'view:dashboard': ['user', 'admin'],
          'manage:products': ['admin'],
          'manage:users': ['admin'],
          'manage:orders': ['admin'],
          'view:analytics': ['admin'],
          'create:review': ['user', 'admin'],
          'edit:own-review': ['user', 'admin'],
          'delete:any-review': ['admin'],
          'manage:categories': ['admin'],
          'view:own-orders': ['user', 'admin'],
          'cancel:own-order': ['user', 'admin'],
          'refund:any-order': ['admin'],
        };

        const allowedRoles = permissions[permission];
        if (!allowedRoles) return false;

        return allowedRoles.includes(user.role);
      },

      /**
       * Check if user's email is verified
       */
      isEmailVerified: () => {
        const user = get().user;
        return user?.isVerified || false;
      },
    }),
    {
      name: 'agromart-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      }),
      // Custom storage to handle errors gracefully
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          } catch (error) {
            console.error('Failed to get item from storage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Failed to set item in storage:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Failed to remove item from storage:', error);
          }
        },
      },
    }
  )
);

/**
 * Selectors for optimized component re-renders
 */
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore((state) => state.isAdmin());
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useUserInitials = () => useAuthStore((state) => state.getUserInitials());
export const useIsEmailVerified = () => useAuthStore((state) => state.isEmailVerified());

/**
 * Auth actions (for use outside components)
 */
export const authActions = {
  login: (user: User, accessToken: string, refreshToken: string) => 
    useAuthStore.getState().login(user, accessToken, refreshToken),
  
  logout: () => 
    useAuthStore.getState().logout(),
  
  updateUser: (updates: Partial<User>) => 
    useAuthStore.getState().updateUser(updates),
  
  setTokens: (accessToken: string, refreshToken: string) => 
    useAuthStore.getState().setTokens(accessToken, refreshToken),
};

export default useAuthStore;