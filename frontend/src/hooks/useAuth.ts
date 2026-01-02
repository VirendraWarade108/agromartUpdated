import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore, { User } from '@/store/authStore';
import { authApi, userApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';

interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthError {
  message: string;
  field?: string;
}

interface UseAuthReturn {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  
  // Computed
  isAdmin: boolean;
}

/**
 * Custom hook for authentication
 * Handles all authentication-related operations
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  
  // Get auth state from store
  const {
    user,
    isAuthenticated,
    login: storeLogin,
    logout: storeLogout,
    setUser,
    setLoading: setStoreLoading,
    isAdmin: checkIsAdmin,
  } = useAuthStore();

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check authentication status on mount
   * Verifies token and loads user profile
   */
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      storeLogout();
      return;
    }

    try {
      setStoreLoading(true);
      const response = await authApi.getProfile();
      
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        storeLogout();
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      storeLogout();
    } finally {
      setStoreLoading(false);
    }
  }, [setUser, storeLogout, setStoreLoading]);

  /**
   * Login user with email and password
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(credentials.email, credentials.password);
      
      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Store in Zustand
        storeLogin(user, accessToken, refreshToken);
        
        // Show success message
        showSuccessToast(`Welcome back, ${user.fullName}!`);
        
        // Redirect based on role
        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        
        return true;
      } else {
        setError({ message: response.data.message || 'Login failed' });
        return false;
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError({ message: errorMessage });
      showErrorToast(errorMessage, 'Login Failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [storeLogin, router]);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(data);
      
      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Store in Zustand
        storeLogin(user, accessToken, refreshToken);
        
        // Show success message
        showSuccessToast(
          'Account created successfully! Please verify your email.',
          'Welcome to AgroMart!'
        );
        
        // Redirect to dashboard
        router.push('/dashboard');
        
        return true;
      } else {
        setError({ message: response.data.message || 'Registration failed' });
        return false;
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError({ message: errorMessage });
      showErrorToast(errorMessage, 'Registration Failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [storeLogin, router]);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      // Call logout API (optional - to invalidate token on server)
      await authApi.logout();
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      // Clear local state regardless of API call result
      storeLogout();
      
      showSuccessToast('You have been logged out successfully');
      
      // Redirect to home
      router.push('/');
      
      setIsLoading(false);
    }
  }, [storeLogout, router]);

  /**
   * Request password reset email
   */
  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.forgotPassword(email);
      
      if (response.data.success) {
        showSuccessToast(
          'Password reset instructions have been sent to your email',
          'Check Your Email'
        );
        return true;
      } else {
        setError({ message: response.data.message || 'Failed to send reset email' });
        return false;
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError({ message: errorMessage });
      showErrorToast(errorMessage, 'Request Failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (
    token: string,
    newPassword: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.resetPassword(token, newPassword);
      
      if (response.data.success) {
        showSuccessToast(
          'Your password has been reset successfully',
          'Password Reset'
        );
        
        // Redirect to login
        router.push('/auth/login');
        
        return true;
      } else {
        setError({ message: response.data.message || 'Failed to reset password' });
        return false;
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError({ message: errorMessage });
      showErrorToast(errorMessage, 'Reset Failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Verify email with token
   */
  const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.verifyEmail(token);
      
      if (response.data.success) {
        // Update user in store
        if (user) {
          setUser({ ...user, isVerified: true });
        }
        
        showSuccessToast('Your email has been verified successfully', 'Email Verified');
        return true;
      } else {
        setError({ message: response.data.message || 'Verification failed' });
        return false;
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError({ message: errorMessage });
      showErrorToast(errorMessage, 'Verification Failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, setUser]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.updateProfile(data);
      
      if (response.data.success) {
        // Update user in store
        if (user) {
          setUser({ ...user, ...data });
        }
        
        showSuccessToast('Profile updated successfully');
        return true;
      } else {
        setError({ message: response.data.message || 'Failed to update profile' });
        return false;
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError({ message: errorMessage });
      showErrorToast(errorMessage, 'Update Failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, setUser]);

  /**
   * Change password
   * ✅ FIXED: Now uses real userApi.changePassword endpoint
   */
  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userApi.changePassword(currentPassword, newPassword);
      
      if (response.data.success) {
        showSuccessToast('Password changed successfully');
        return true;
      } else {
        setError({ message: response.data.message || 'Failed to change password' });
        return false;
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError({ message: errorMessage });
      showErrorToast(errorMessage, 'Password Change Failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check authentication on mount
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateProfile,
    changePassword,
    checkAuth,
    clearError,
    
    // Computed
    isAdmin: checkIsAdmin(),
  };
}

export default useAuth;