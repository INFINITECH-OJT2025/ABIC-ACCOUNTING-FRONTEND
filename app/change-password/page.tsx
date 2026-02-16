"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingModal from '@/components/ui/LoadingModal'
import SuccessModal from '@/components/ui/SuccessModal'
import FailModal from '@/components/ui/FailModal'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Moon, Sun } from 'lucide-react'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failModalMessage, setFailModalMessage] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false,
  });

  const router = useRouter();

  // Real-time password validation
  useEffect(() => {
    const validatePassword = (password: string) => {
      setPasswordValidation({
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      });
    };

    validatePassword(newPassword);
  }, [newPassword]);

  // Check if password is valid
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldErrors({});
    
    // Show loading modal
    setShowLoadingModal(true);

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setShowLoadingModal(false);
      setFailModalMessage("New passwords do not match");
      setShowFailModal(true);
      setLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setShowLoadingModal(false);
      setFailModalMessage("Password does not meet all requirements");
      setShowFailModal(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      const data = await res.json();
      setShowLoadingModal(false);

      if (res.ok && data.success) {
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          router.push("/login");
        }, 2000);
      } else {
        setFailModalMessage(data.message || "Failed to change password");
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
        backgroundImage: `url(/images/background/${darkMode ? 'changep_dark.png' : 'changep_light.png'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
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
              className="w-48 h-12 object-contain"
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
          {/* Change Password Form Card */}
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
                  Change Password
                </h1>
                <p className={`text-xs sm:text-sm transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Set your permanent password for security
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

              {/* Current Password Input */}
              <div>
                <label htmlFor="current_password" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Current Password
                </label>
                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-400'
                  }`}>
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="current_password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
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
                      getFieldError('current_password') 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                      darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    disabled={loading}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {getFieldError('current_password') && (
                  <p className="text-red-500 text-xs mt-1">
                    {getFieldError('current_password')}
                  </p>
                )}
              </div>

              {/* New Password Input */}
              <div>
                <label htmlFor="new_password" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  New Password
                </label>
                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-400'
                  }`}>
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="new_password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
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
                      getFieldError('new_password') 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                      darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    disabled={loading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {getFieldError('new_password') && (
                  <p className="text-red-500 text-xs mt-1">
                    {getFieldError('new_password')}
                  </p>
                )}

                {/* Password Validation Indicators */}
                {newPassword && (
                  <div className={`mt-3 p-3 rounded-lg border transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className={`text-xs font-medium mb-2 transition-colors duration-300 ${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Password must contain:
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.minLength ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        <span className={passwordValidation.minLength ? "text-green-600" : darkMode ? "text-gray-400" : "text-gray-500"}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasUppercase ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        <span className={passwordValidation.hasUppercase ? "text-green-600" : darkMode ? "text-gray-400" : "text-gray-500"}>
                          One uppercase letter (A-Z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasLowercase ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        <span className={passwordValidation.hasLowercase ? "text-green-600" : darkMode ? "text-gray-400" : "text-gray-500"}>
                          One lowercase letter (a-z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasNumber ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        <span className={passwordValidation.hasNumber ? "text-green-600" : darkMode ? "text-gray-400" : "text-gray-500"}>
                          One number (0-9)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasSymbol ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        <span className={passwordValidation.hasSymbol ? "text-green-600" : darkMode ? "text-gray-400" : "text-gray-500"}>
                          One symbol (!@#$%^&* etc.)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password Input */}
              <div>
                <label htmlFor="new_password_confirmation" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-400'
                  }`}>
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="new_password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
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
                      getFieldError('new_password_confirmation') 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                      darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {getFieldError('new_password_confirmation') && (
                  <p className="text-red-500 text-xs mt-1">
                    {getFieldError('new_password_confirmation')}
                  </p>
                )}
              </div>

              {/* Change Password Button */}
              <Button
                type="submit"
                disabled={loading || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim() || !isPasswordValid}
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
                    Changing Password...
                  </span>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className={`text-xs transition-colors duration-300 ${
              darkMode ? 'text-white/60' : 'text-white/80'
            }`}>
              2026 ABIC Realty & Consultancy Corporation
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LoadingModal
        isOpen={showLoadingModal}
        title="Changing Password"
        message="Please wait while we update your password..."
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title="Password Changed"
        message="Your password has been successfully updated! Redirecting to login..."
        buttonText="Continue"
      />

      <FailModal
        isOpen={showFailModal}
        onClose={handleCloseFailModal}
        title="Password Change Failed"
        message={failModalMessage}
        buttonText="Try Again"
      />
    </div>
  );
}