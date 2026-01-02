import React from 'react';
import { Loader2, Package, Leaf } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white' | 'branded';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * LoadingSpinner Component
 * Reusable loading indicator with multiple variants and sizes
 */
export default function LoadingSpinner({
  size = 'md',
  variant = 'default',
  text,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  // Size mappings
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  // Variant color classes
  const variantClasses = {
    default: 'text-gray-600',
    primary: 'text-green-600',
    white: 'text-white',
    branded: 'text-green-600',
  };

  // Get spinner icon based on variant
  const SpinnerIcon = variant === 'branded' ? Leaf : Loader2;

  // Full screen loader
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {/* Animated Logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Leaf className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          
          {/* Loading Text */}
          {text ? (
            <p className="text-gray-900 font-bold text-lg animate-pulse">
              {text}
            </p>
          ) : (
            <div className="space-y-2 text-center">
              <p className="text-gray-900 font-black text-xl">Loading</p>
              <p className="text-gray-600 font-semibold text-sm">Please wait...</p>
            </div>
          )}
          
          {/* Progress Dots */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Inline loader
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <SpinnerIcon 
        className={`${sizeClasses[size]} ${variantClasses[variant]} animate-spin`}
        strokeWidth={2.5}
      />
      {text && (
        <p className={`${textSizeClasses[size]} ${variantClasses[variant]} font-semibold`}>
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * Page Loader - For entire page loading states
 */
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      <LoadingSpinner size="xl" variant="white" text={message} />
    </div>
  );
}

/**
 * Section Loader - For section/component loading states
 */
export function SectionLoader({ message }: { message?: string }) {
  return (
    <div className="py-20 flex items-center justify-center">
      <LoadingSpinner size="lg" variant="primary" text={message} />
    </div>
  );
}

/**
 * Button Loader - For inline button loading states
 */
export function ButtonLoader({ className = '' }: { className?: string }) {
  return <Loader2 className={`w-5 h-5 animate-spin ${className}`} />;
}

/**
 * Card Skeleton - For card loading states
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-6 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
      </div>
    </div>
  );
}

/**
 * List Skeleton - For list loading states
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Table Skeleton - For table loading states
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="grid gap-4 p-6 border-b-2 border-gray-200 bg-gray-50" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, idx) => (
          <div key={idx} className="h-4 bg-gray-300 rounded animate-pulse"></div>
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="grid gap-4 p-6 border-b border-gray-200" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div key={colIdx} className="h-4 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Product Grid Skeleton - For product grid loading states
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <CardSkeleton key={idx} />
      ))}
    </div>
  );
}

/**
 * Overlay Loader - For overlay loading states
 */
export function OverlayLoader({ message }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
      <LoadingSpinner size="lg" variant="primary" text={message} />
    </div>
  );
}

/**
 * Inline Loader - Minimal inline loader
 */
export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <Loader2 className="w-4 h-4 animate-spin" />
      {text && <span className="text-sm font-semibold">{text}</span>}
    </div>
  );
}