import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore, { User } from '@/store/authStore';
import { authApi, userApi, handleApiError, getErrorCode, isErrorType } from '@/lib/api';
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
  code?: string;
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
 * Handles all authentication-related operations with enhanced error handling
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
   * Handle API error and convert to AuthError
   */
  const handleError = useCallback((err: any): AuthError => {
    const message = handleApiError(err);
    const code = getErrorCode(err);
    
    return {
      message,
      code: code || undefined,
    };
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
      
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
      } else {
        throw new Error('Invalid profile response');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      
      // Only logout if it's an auth error (not network issues)
      if (isErrorType(err, 'INVALID_TOKEN') || isErrorType(err, 'TOKEN_EXPIRED')) {
        storeLogout();
      }
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
      
      if (response.data.success && response.data.data) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Validate response data
        if (!user || !accessToken || !refreshToken) {
          throw new Error('Invalid login response format');
        }
        
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
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      const authError = handleError(err);
      setError(authError);
      
      // Show appropriate error message
      if (isErrorType(err, 'INVALID_CREDENTIALS')) {
        showErrorToast('Invalid email or password', 'Login Failed');
      } else if (isErrorType(err, 'RATE_LIMIT_EXCEEDED')) {
        showErrorToast('Too many login attempts. Please try again later.', 'Rate Limit Exceeded');
      } else if (isErrorType(err, 'ACCOUNT_DISABLED')) {
        showErrorToast('Your account has been disabled. Please contact support.', 'Account Disabled');
      } else {
        showErrorToast(authError.message, 'Login Failed');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [storeLogin, router, handleError]);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(data);
      
      if (response.data.success && response.data.data) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Validate response data
        if (!user || !accessToken || !refreshToken) {
          throw new Error('Invalid registration response format');
        }
        
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
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      const authError = handleError(err);
      setError(authError);
      
      // Show appropriate error message
      if (isErrorType(err, 'EMAIL_EXISTS')) {
        showErrorToast('An account with this email already exists', 'Registration Failed');
      } else if (isErrorType(err, 'PHONE_EXISTS')) {
        showErrorToast('An account with this phone number already exists', 'Registration Failed');
      } else if (isErrorType(err, 'RATE_LIMIT_EXCEEDED')) {
        showErrorToast('Too many registration attempts. Please try again later.', 'Rate Limit Exceeded');
      } else if (isErrorType(err, 'VALIDATION_ERROR')) {
        showErrorToast(authError.message, 'Invalid Input');
      } else {
        showErrorToast(authError.message, 'Registration Failed');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [storeLogin, router, handleError]);

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
      // Continue with local logout even if API fails
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
        throw new Error(response.data.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      const authError = handleError(err);
      setError(authError);
      
      // Show appropriate error message
      if (isErrorType(err, 'USER_NOT_FOUND')) {
        showErrorToast('No account found with this email address', 'User Not Found');
      } else if (isErrorType(err, 'RATE_LIMIT_EXCEEDED')) {
        showErrorToast('Too many password reset requests. Please try again later.', 'Rate Limit Exceeded');
      } else {
        showErrorToast(authError.message, 'Request Failed');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

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
        throw new Error(response.data.message || 'Failed to reset password');
      }
    } catch (err: any) {
      const authError = handleError(err);
      setError(authError);
      
      // Show appropriate error message
      if (isErrorType(err, 'INVALID_TOKEN')) {
        showErrorToast('Invalid or expired reset token. Please request a new one.', 'Reset Failed');
      } else if (isErrorType(err, 'TOKEN_EXPIRED')) {
        showErrorToast('Reset link has expired. Please request a new one.', 'Reset Failed');
      } else if (isErrorType(err, 'WEAK_PASSWORD')) {
        showErrorToast('Password must be at least 8 characters with uppercase, lowercase, and numbers', 'Weak Password');
      } else {
        showErrorToast(authError.message, 'Reset Failed');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router, handleError]);

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
        throw new Error(response.data.message || 'Verification failed');
      }
    } catch (err: any) {
      const authError = handleError(err);
      setError(authError);
      
      // Show appropriate error message
      if (isErrorType(err, 'INVALID_TOKEN')) {
        showErrorToast('Invalid or expired verification link', 'Verification Failed');
      } else if (isErrorType(err, 'TOKEN_EXPIRED')) {
        showErrorToast('Verification link has expired. Please request a new one.', 'Verification Failed');
      } else {
        showErrorToast(authError.message, 'Verification Failed');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, setUser, handleError]);

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
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      const authError = handleError(err);
      setError(authError);
      
      // Show appropriate error message
      if (isErrorType(err, 'VALIDATION_ERROR')) {
        showErrorToast(authError.message, 'Invalid Input');
      } else if (isErrorType(err, 'EMAIL_EXISTS')) {
        showErrorToast('This email is already in use', 'Update Failed');
      } else if (isErrorType(err, 'PHONE_EXISTS')) {
        showErrorToast('This phone number is already in use', 'Update Failed');
      } else {
        showErrorToast(authError.message, 'Update Failed');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, setUser, handleError]);

  /**
   * Change password
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
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (err: any) {
      const authError = handleError(err);
      setError(authError);
      
      // Show appropriate error message
      if (isErrorType(err, 'INVALID_CREDENTIALS')) {
        showErrorToast('Current password is incorrect', 'Password Change Failed');
      } else if (isErrorType(err, 'WEAK_PASSWORD')) {
        showErrorToast('New password must be at least 8 characters with uppercase, lowercase, and numbers', 'Weak Password');
      } else if (isErrorType(err, 'PASSWORD_MISMATCH')) {
        showErrorToast('New password cannot be the same as current password', 'Password Change Failed');
      } else {
        showErrorToast(authError.message, 'Password Change Failed');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

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