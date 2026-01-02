'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Leaf, Shield, CheckCircle, ChevronLeft, RotateCcw } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Handle forgot password logic
    console.log('Reset password for:', email);
  };

  const steps = [
    { icon: Mail, title: 'Enter Email', description: 'Provide your registered email address' },
    { icon: RotateCcw, title: 'Get Reset Link', description: 'We\'ll send you a secure reset link' },
    { icon: CheckCircle, title: 'Reset Password', description: 'Create your new password' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute w-96 h-96 bg-green-500/30 rounded-full blur-3xl top-20 left-10 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl bottom-20 right-10 animate-pulse"></div>
        <div className="absolute w-64 h-64 bg-purple-500/30 rounded-full blur-3xl top-1/2 left-1/2 animate-pulse"></div>
      </div>

      <div className="relative max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-12 justify-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <Leaf className="w-9 h-9 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white">AgroMart</h2>
              <p className="text-sm text-green-300 font-bold">Grow Your Future</p>
            </div>
          </Link>

          {!submitted ? (
            /* Forgot Password Form */
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 p-8 sm:p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <RotateCcw className="w-10 h-10 text-green-600" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
                    Forgot Password?
                  </h1>
                  <p className="text-gray-600 font-semibold text-lg">
                    No worries! Enter your email and we'll send you reset instructions.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg rounded-2xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    Send Reset Link
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>

                {/* Back to Login */}
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-bold transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back to Login
                </Link>

                {/* Security Badge */}
                <div className="mt-8 p-4 bg-green-50 rounded-xl border-2 border-green-200 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-green-900 font-bold text-sm">Secure Password Reset</p>
                    <p className="text-green-700 text-xs font-semibold">Your data is protected with encryption</p>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="mt-12 grid md:grid-cols-3 gap-6">
                {steps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className="relative pt-4"
                  >
                    <div className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-white/20 text-center h-full">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-4 border-green-500 font-black text-green-600">
                        {idx + 1}
                      </div>
                      <h3 className="text-white font-black text-lg mb-2">{step.title}</h3>
                      <p className="text-gray-300 text-sm font-semibold">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            /* Success Message */
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 p-8 sm:p-12 text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-14 h-14 text-green-600" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
                  Check Your Email!
                </h2>
                <p className="text-gray-700 font-semibold text-lg mb-2">
                  We've sent password reset instructions to:
                </p>
                <p className="text-green-600 font-black text-xl mb-8">{email}</p>
                
                <div className="space-y-4 text-left bg-gray-50 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Check your inbox</p>
                      <p className="text-gray-600 text-sm font-semibold">Look for an email from AgroMart</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Click the reset link</p>
                      <p className="text-gray-600 text-sm font-semibold">Link expires in 1 hour</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Create new password</p>
                      <p className="text-gray-600 text-sm font-semibold">Choose a strong password</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl mb-6">
                  <p className="text-blue-900 font-semibold text-sm">
                    💡 Didn't receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-blue-600 hover:text-blue-700 font-bold underline"
                    >
                      try again
                    </button>
                  </p>
                </div>

                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}