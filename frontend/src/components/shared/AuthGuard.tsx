'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { PageLoader } from './LoadingSpinner';

export interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

/**
 * AuthGuard Component
 * Protects routes based on authentication and authorization
 * 
 * Usage:
 * <AuthGuard requireAuth={true}>
 *   <ProtectedContent />
 * </AuthGuard>
 */
export default function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo,
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      setIsRedirecting(true);
      const returnUrl = window.location.pathname;
      router.push(redirectTo || `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Check admin requirement
    if (requireAdmin && !isAdmin) {
      setIsRedirecting(true);
      router.push(redirectTo || '/dashboard');
      return;
    }
  }, [isAuthenticated, isAdmin, isLoading, requireAuth, requireAdmin, redirectTo, router]);

  // Show loader while checking authentication
  if (isLoading) {
    return <PageLoader message="Checking authentication..." />;
  }

  // Show loader while redirecting
  if (isRedirecting || (requireAuth && !isAuthenticated) || (requireAdmin && !isAdmin)) {
    return <PageLoader message="Redirecting..." />;
  }

  // Render children if authorized
  return <>{children}</>;
}

/**
 * AdminGuard Component
 * Shorthand for requiring admin access
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} requireAdmin={true} redirectTo="/dashboard">
      {children}
    </AuthGuard>
  );
}

/**
 * GuestGuard Component
 * Redirects authenticated users away from auth pages
 */
export function GuestGuard({
  children,
  redirectTo = '/dashboard',
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return;

    // Redirect if already authenticated
    if (isAuthenticated) {
      setIsRedirecting(true);
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  // Show loader while checking
  if (isLoading) {
    return <PageLoader message="Loading..." />;
  }

  // Show loader while redirecting
  if (isRedirecting || isAuthenticated) {
    return <PageLoader message="Redirecting..." />;
  }

  // Render children if not authenticated
  return <>{children}</>;
}

/**
 * ConditionalAuthContent Component
 * Shows different content based on authentication state
 */
export function ConditionalAuthContent({
  authenticated,
  unauthenticated,
}: {
  authenticated: React.ReactNode;
  unauthenticated: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return <>{isAuthenticated ? authenticated : unauthenticated}</>;
}

/**
 * RoleBasedContent Component
 * Shows content based on user role
 */
export function RoleBasedContent({
  admin,
  user,
  guest,
}: {
  admin?: React.ReactNode;
  user?: React.ReactNode;
  guest?: React.ReactNode;
}) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAdmin && admin) {
    return <>{admin}</>;
  }

  if (isAuthenticated && user) {
    return <>{user}</>;
  }

  if (!isAuthenticated && guest) {
    return <>{guest}</>;
  }

  return null;
}

/**
 * ProtectedLink Component
 * Link that checks authentication before navigating
 */
export function ProtectedLink({
  href,
  children,
  requireAuth = true,
  requireAdmin = false,
  className = '',
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent(href)}`);
      return;
    }

    // Check admin
    if (requireAdmin && !isAdmin) {
      router.push('/dashboard');
      return;
    }

    // Execute custom onClick if provided
    if (onClick) {
      onClick();
    }

    // Navigate
    router.push(href);
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}