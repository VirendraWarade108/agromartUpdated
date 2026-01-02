'use client';
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore, { ToastMessage } from '@/store/uiStore';

/**
 * Toast Component
 * Individual toast notification
 */
function Toast({ toast }: { toast: ToastMessage }) {
  const { removeToast } = useUIStore();

  // Icon based on type
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  // Colors based on type
  const colors = {
    success: 'from-green-500 to-emerald-600',
    error: 'from-red-500 to-rose-600',
    warning: 'from-orange-500 to-yellow-600',
    info: 'from-blue-500 to-cyan-600',
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-orange-50 border-orange-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const textColors = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-orange-900',
    info: 'text-blue-900',
  };

  const Icon = icons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-4 p-5 rounded-2xl border-2 shadow-2xl backdrop-blur-xl ${bgColors[toast.type]} max-w-md w-full`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[toast.type]} flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className={`font-black text-base mb-1 ${textColors[toast.type]}`}>
            {toast.title}
          </h4>
        )}
        <p className={`font-semibold text-sm leading-relaxed ${textColors[toast.type]}`}>
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => removeToast(toast.id)}
        className={`p-2 rounded-lg hover:bg-white/50 transition-colors ${textColors[toast.type]}`}
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

/**
 * Toaster Component
 * Container for all toast notifications
 */
export default function Toaster() {
  const { toasts } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Bottom Toaster - Alternative position
 */
export function BottomToaster() {
  const { toasts } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Center Toaster - For important messages
 */
export function CenterToaster() {
  const { toasts } = useUIStore();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Mobile Toaster - Optimized for mobile
 */
export function MobileToaster() {
  const { toasts } = useUIStore();

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto"
          >
            <Toast toast={toast} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Toast Hook for programmatic usage
 */
export function useToast() {
  const { addToast, removeToast, clearToasts } = useUIStore();

  const toast = {
    success: (message: string, title?: string, duration?: number) => {
      addToast({ type: 'success', message, title, duration });
    },
    error: (message: string, title?: string, duration?: number) => {
      addToast({ type: 'error', message, title, duration });
    },
    warning: (message: string, title?: string, duration?: number) => {
      addToast({ type: 'warning', message, title, duration });
    },
    info: (message: string, title?: string, duration?: number) => {
      addToast({ type: 'info', message, title, duration });
    },
    custom: (toast: Omit<ToastMessage, 'id'>) => {
      addToast(toast);
    },
    dismiss: (id: string) => {
      removeToast(id);
    },
    dismissAll: () => {
      clearToasts();
    },
  };

  return toast;
}

/**
 * Toast Provider Component
 * Wrap your app with this to enable toasts
 */
export function ToastProvider({
  children,
  position = 'top-right',
}: {
  children: React.ReactNode;
  position?: 'top-right' | 'bottom-right' | 'center' | 'mobile';
}) {
  const ToasterComponent = {
    'top-right': Toaster,
    'bottom-right': BottomToaster,
    'center': CenterToaster,
    'mobile': MobileToaster,
  }[position];

  return (
    <>
      {children}
      <ToasterComponent />
    </>
  );
}