import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type?: 'cart' | 'auth' | 'address' | 'product' | 'filter' | 'search';
  data?: any;
}

export interface UIState {
  // Toast
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Modal
  modal: ModalState;
  openModal: (type: ModalState['type'], data?: any) => void;
  closeModal: () => void;
  
  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  
  // Mobile Menu
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openMobileMenu: () => void;
  
  // Cart Drawer
  isCartDrawerOpen: boolean;
  toggleCartDrawer: () => void;
  closeCartDrawer: () => void;
  openCartDrawer: () => void;
  
  // Search
  isSearchOpen: boolean;
  searchQuery: string;
  toggleSearch: () => void;
  closeSearch: () => void;
  openSearch: () => void;
  setSearchQuery: (query: string) => void;
  
  // Loading
  isLoading: boolean;
  loadingMessage: string | null;
  setLoading: (loading: boolean, message?: string) => void;
  
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const useUIStore = create<UIState>((set, get) => ({
  // Toast State
  toasts: [],
  
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 5000;
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration,
    };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
    
    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  
  clearToasts: () => {
    set({ toasts: [] });
  },
  
  // Modal State
  modal: {
    isOpen: false,
    type: undefined,
    data: undefined,
  },
  
  openModal: (type, data) => {
    set({
      modal: {
        isOpen: true,
        type,
        data,
      },
    });
  },
  
  closeModal: () => {
    set({
      modal: {
        isOpen: false,
        type: undefined,
        data: undefined,
      },
    });
  },
  
  // Sidebar State
  isSidebarOpen: false,
  
  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },
  
  closeSidebar: () => {
    set({ isSidebarOpen: false });
  },
  
  openSidebar: () => {
    set({ isSidebarOpen: true });
  },
  
  // Mobile Menu State
  isMobileMenuOpen: false,
  
  toggleMobileMenu: () => {
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
  },
  
  closeMobileMenu: () => {
    set({ isMobileMenuOpen: false });
  },
  
  openMobileMenu: () => {
    set({ isMobileMenuOpen: true });
  },
  
  // Cart Drawer State
  isCartDrawerOpen: false,
  
  toggleCartDrawer: () => {
    set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen }));
  },
  
  closeCartDrawer: () => {
    set({ isCartDrawerOpen: false });
  },
  
  openCartDrawer: () => {
    set({ isCartDrawerOpen: true });
  },
  
  // Search State
  isSearchOpen: false,
  searchQuery: '',
  
  toggleSearch: () => {
    set((state) => ({ isSearchOpen: !state.isSearchOpen }));
  },
  
  closeSearch: () => {
    set({ isSearchOpen: false, searchQuery: '' });
  },
  
  openSearch: () => {
    set({ isSearchOpen: true });
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
  
  // Loading State
  isLoading: false,
  loadingMessage: null,
  
  setLoading: (loading, message) => {
    set({
      isLoading: loading,
      loadingMessage: message || null,
    });
  },
  
  // Theme State
  theme: 'light',
  
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      
      // Update HTML class for Tailwind dark mode
      if (typeof document !== 'undefined') {
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      return { theme: newTheme };
    });
  },
  
  setTheme: (theme) => {
    set({ theme });
    
    // Update HTML class for Tailwind dark mode
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },
}));

// Helper functions for common toast types
export const showSuccessToast = (message: string, title?: string) => {
  useUIStore.getState().addToast({
    type: 'success',
    title: title || 'Success',
    message,
  });
};

export const showErrorToast = (message: string, title?: string) => {
  useUIStore.getState().addToast({
    type: 'error',
    title: title || 'Error',
    message,
  });
};

export const showWarningToast = (message: string, title?: string) => {
  useUIStore.getState().addToast({
    type: 'warning',
    title: title || 'Warning',
    message,
  });
};

export const showInfoToast = (message: string, title?: string) => {
  useUIStore.getState().addToast({
    type: 'info',
    title: title || 'Info',
    message,
  });
};

export default useUIStore;