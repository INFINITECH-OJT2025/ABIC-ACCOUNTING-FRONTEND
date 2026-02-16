"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingModal from '@/components/ui/LoadingModal'
import SuccessModal from '@/components/ui/SuccessModal'
import FailModal from '@/components/ui/FailModal'
import { Mail, Moon, Sun } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [darkMode, setDarkMode] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failModalMessage, setFailModalMessage] = useState('');

  const router = useRouter();

  useEffect(() => {
    // Don't redirect if user is authenticated - allow password reset for all users
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldErrors({});
    
    // Show loading modal
    setShowLoadingModal(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await res.json();
      setShowLoadingModal(false);

      if (res.ok && data.success) {
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          router.push("/login");
        }, 3000);
      } else {
        setFailModalMessage(data.message || "Failed to send reset link");
        setShowFailModal(true);
        setFieldErrors(data.errors || {});
      }
    } catch (err) {
      setShowLoadingModal(false);
      setFailModalMessage("Network error. Please try again.");
      setShowFailModal(true);
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    const errors = fieldErrors[fieldName]
    return errors && errors.length > 0 ? errors[0] : ''
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
  }

  const handleCloseFailModal = () => {
    setShowFailModal(false)
  }

  return (
    <div 
      className={`min-h-screen flex transition-all duration-500 ease-in-out ${darkMode ? 'dark' : ''}`}
      style={{
        backgroundImage: `url(/images/background/${darkMode ? 'forgotp_dark.png' : 'forgotp_light.png'})`,
        backgroundSize: '135%',
        backgroundPosition: '0% 50%',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.5s ease-in-out'
      }}
    >
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-12 lg:right-16 z-20">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 sm:p-3 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 ${
            darkMode 
              ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30' 
              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90'
          }`}
          aria-label="Toggle dark mode"
        >
          <div className="transition-all duration-300 ease-in-out">
            {darkMode ? (
              <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </div>
        </button>
      </div>

      {/* Left Side - Empty (background shows through) */}
      <div className="hidden lg:flex lg:flex-1 relative">
        {/* Logo - Left Side */}
        <div className="absolute top-12 left-16">
          <div className="transition-opacity duration-300 ease-in-out">
            <img 
              src={darkMode ? "/images/logo/abic-logo.png" : "/images/logo/abic-logo-black.png"} 
              alt="ABIC Logo" 
              className="w-60 h-24 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-16 relative py-8">
        {/* Logo - Top Left (Mobile Only) */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:hidden">
          <div className="transition-opacity duration-300 ease-in-out">
            <img 
              src={darkMode ? "/images/logo/abic-logo.png" : "/images/logo/abic-logo-black.png"} 
              alt="ABIC Logo" 
              className="w-32 sm:w-40 h-8 sm:h-10 object-contain"
            />
          </div>
        </div>
        
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Forgot Password Form Card */}
          <div className={`rounded-xl shadow-lg border p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-900/90 backdrop-blur-sm border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            {/* Header */}
            <div className="mb-6 sm:mb-8 flex justify-center">
              <div className="text-center">
                <h1 className={`text-xl sm:text-2xl font-bold mb-2 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Forgot Password
                </h1>
                <p className={`text-xs sm:text-sm transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Enter your email to receive a password reset link
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className={`p-3 border rounded-lg ${
                  darkMode 
                    ? 'bg-red-900/50 border-red-700 text-red-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              {success && (
                <div className={`p-3 border rounded-lg ${
                  darkMode 
                    ? 'bg-green-900/50 border-green-700 text-green-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <p className="text-sm">{success}</p>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Email Address
                </label>
                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-400'
                  }`}>
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    className={`h-10 pl-10 pr-10 rounded-lg transition-colors duration-300 disabled:opacity-50 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20' 
                        : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20'
                    } ${
                      getFieldError('email') 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : ''
                    }`}
                  />
                </div>
                {getFieldError('email') && (
                  <p className="text-red-500 text-xs mt-1">
                    {getFieldError('email')}
                  </p>
                )}
              </div>

              {/* Send Reset Link Button */}
              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className={`w-full h-10 font-medium rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode 
                    ? 'bg-[#7B0F2B] hover:bg-[#5E0C20] text-white' 
                    : 'bg-[#7B0F2B] hover:bg-[#5E0C20] text-white'
                }`}
                tabIndex={0}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2"></span>
                    Sending Reset Link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              {/* Back to Login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className={`text-sm transition-colors duration-300 ${
                    darkMode 
                      ? 'text-gray-300 hover:text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled={loading}
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className={`text-xs transition-colors duration-300 ${
              darkMode ? 'text-white/60' : 'text-white/80'
            }`}>
              © 2026 ABIC Realty & Consultancy Corporation
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LoadingModal
        isOpen={showLoadingModal}
        title="Sending Reset Link"
        message="Please wait while we send the password reset link to your email..."
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title="Reset Link Sent"
        message="Password reset link has been sent to your email. Please check your inbox and follow the instructions."
        buttonText="Continue"
      />

      <FailModal
        isOpen={showFailModal}
        onClose={handleCloseFailModal}
        title="Failed to Send Reset Link"
        message={failModalMessage}
        buttonText="Try Again"
      />
    </div>
  );
}
