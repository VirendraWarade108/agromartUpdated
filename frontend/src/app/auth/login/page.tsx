'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Leaf, ArrowRight, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { GuestGuard } from '@/components/shared/AuthGuard';
import useAuth from '@/hooks/useAuth';

function LoginPageContent() {
  const { login, isLoading, error, clearError } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    clearError();
    
    // Validate
    const errors: Record<string, string> = {};
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Submit
    await login(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear field error on change
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  // Demo credentials helper
  const fillDemoCredentials = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      setFormData({
        email: 'admin@agromart.com',
        password: 'admin123',
        remember: false
      });
    } else {
      setFormData({
        email: 'user@agromart.com',
        password: 'user123',
        remember: false
      });
    }
  };

  const benefits = [
    { icon: CheckCircle, text: 'Track your orders in real-time' },
    { icon: CheckCircle, text: 'Save addresses for faster checkout' },
    { icon: CheckCircle, text: 'Get exclusive deals and offers' },
    { icon: CheckCircle, text: 'Manage your wishlist easily' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute w-96 h-96 bg-green-500/30 rounded-full blur-3xl top-20 left-10 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl bottom-20 right-10 animate-pulse"></div>
        <div className="absolute w-64 h-64 bg-purple-500/30 rounded-full blur-3xl top-1/2 left-1/2 animate-pulse"></div>
      </div>

      <div className="relative max-w-6xl w-full">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Branding & Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:flex flex-col justify-center"
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mb-12 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Leaf className="w-9 h-9 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-white">AgroMart</h2>
                <p className="text-sm text-green-300 font-bold">Grow Your Future</p>
              </div>
            </Link>

            <div className="mb-8">
              <h1 className="text-5xl font-black text-white mb-4 leading-tight">
                Welcome Back to<br />
                <span className="bg-gradient-to-r from-green-300 via-emerald-300 to-cyan-300 text-transparent bg-clip-text">
                  AgroMart
                </span>
              </h1>
              <p className="text-xl text-gray-300 font-medium leading-relaxed">
                Login to access your account and continue your farming journey with India's most trusted agriculture marketplace.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              {benefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-white font-semibold">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Trust Badge */}
            <div className="mt-12 flex items-center gap-4 p-6 bg-green-500/10 backdrop-blur-xl rounded-2xl border border-green-400/30">
              <Shield className="w-12 h-12 text-green-400" />
              <div>
                <p className="text-white font-bold text-lg">100% Secure Login</p>
                <p className="text-green-300 text-sm font-semibold">Your data is encrypted and protected</p>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center"
          >
            <div className="w-full">
              <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 p-8 sm:p-12">
                {/* Mobile Logo */}
                <Link href="/" className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Leaf className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">AgroMart</h2>
                  </div>
                </Link>

                <div className="text-center mb-8">
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
                    Login to Your Account
                  </h2>
                  <p className="text-gray-600 font-semibold">
                    Enter your credentials to continue
                  </p>
                </div>

                {/* Global Error */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                    <p className="text-red-700 font-semibold text-sm">{error.message}</p>
                  </div>
                )}

                {/* Demo Credentials Helper */}
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <p className="text-blue-900 font-bold text-sm mb-2">Quick Login (Demo):</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('user')}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      User Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('admin')}
                      className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Admin Demo
                    </button>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        disabled={isLoading}
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                          formErrors.email ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-red-600 text-sm font-semibold mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        disabled={isLoading}
                        className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                          formErrors.password ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="text-red-600 text-sm font-semibold mt-1">{formErrors.password}</p>
                    )}
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="remember"
                        checked={formData.remember}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="w-5 h-5 text-green-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                      />
                      <span className="text-gray-700 font-semibold group-hover:text-gray-900">
                        Remember me
                      </span>
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-green-600 hover:text-green-700 font-bold text-sm transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-black text-lg rounded-2xl shadow-2xl hover:scale-105 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        Login to Account
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-600 font-bold">OR</span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="space-y-3">
                  <button 
                    type="button"
                    disabled={isLoading}
                    className="w-full py-4 px-6 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl font-bold text-gray-900 transition-all flex items-center justify-center gap-3 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>

                {/* Register Link */}
                <p className="text-center text-gray-600 font-semibold mt-8">
                  Don't have an account?{' '}
                  <Link
                    href="/auth/register"
                    className="text-green-600 hover:text-green-700 font-bold transition-colors"
                  >
                    Create Account
                  </Link>
                </p>

                {/* Back to Home */}
                <Link
                  href="/"
                  className="block text-center text-gray-500 hover:text-gray-700 font-semibold text-sm mt-6 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GuestGuard redirectTo="/dashboard">
      <LoginPageContent />
    </GuestGuard>
  );
}