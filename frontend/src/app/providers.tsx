'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/toaster';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';

/**
 * Providers Component
 * Wraps the app with all necessary providers and initializes stores
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Initialize authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          // Check auth will verify token and load user profile
          const { checkAuth } = useAuthStore.getState();
          await checkAuth();
        } catch (error) {
          console.error('Auth initialization failed:', error);
        }
      }
    };

    initAuth();
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ToastProvider position="top-right">
      {children}
    </ToastProvider>
  );
}

/**
 * Auth Provider - Handles authentication state
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}

/**
 * Cart Provider - Handles cart synchronization
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const syncWithServer = useCartStore((state) => state.syncWithServer);

  useEffect(() => {
    // Sync cart with server when user logs in
    if (isAuthenticated) {
      // Note: syncWithServer is not available in cartStore yet
      // You would need to add this method or use the useCart hook
      console.log('User authenticated, cart sync would happen here');
    }
  }, [isAuthenticated]);

  return <>{children}</>;
}

/**
 * Progress Bar Provider - Shows loading state during navigation
 */
export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <>
      {/* Progress Bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-green-600 animate-pulse">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 animate-[shimmer_1s_infinite]"></div>
        </div>
      )}
      {children}
    </>
  );
}

/**
 * Theme Provider - Handles dark/light mode (optional)
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = typeof window !== 'undefined' 
    ? localStorage.getItem('theme') || 'light' 
    : 'light';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}

/**
 * Combined App Providers
 * Use this to wrap your entire application
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ProgressBarProvider>
              {children}
            </ProgressBarProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Providers>
  );
}