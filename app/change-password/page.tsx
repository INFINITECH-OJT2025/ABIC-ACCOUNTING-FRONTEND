"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'

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

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setError("Password does not meet all requirements");
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

      if (res.ok && data.success) {
        setSuccess("Password changed successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "Failed to change password");
        setFieldErrors(data.errors || {});
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    const errors = fieldErrors[fieldName]
    return errors && errors.length > 0 ? errors[0] : ''
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 flex items-center justify-center relative"
      style={{
        backgroundImage: 'url(/images/background/abic-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/images/logo/abic-logo-black.png" 
                alt="ABIC Logo" 
                className="w-32 h-8 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Change Password
            </h1>
            <p className="text-gray-600 text-sm">
              Set your permanent password for security
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-700 rounded-lg mb-6">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="ml-2 text-sm">{success}</AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 rounded-lg mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Field Errors */}
          {Object.keys(fieldErrors).length > 0 && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 rounded-lg mb-6">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2 text-sm">
                {Object.entries(fieldErrors).map(([field, errors]) => (
                  <div key={field} className="mb-1">
                    <strong className="capitalize">{field.replace('_', '')}:</strong>
                    <ul className="ml-4 mt-1">
                      {errors.map((error, index) => (
                        <li key={index} className="text-xs">• {error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password Input */}
            <div className="space-y-2">
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                  className={`h-10 text-sm bg-white border text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:border-[#7B0F2B] focus:ring-1 focus:ring-[#7B0F2B]/20 disabled:opacity-50 pr-10 rounded-md ${
                    getFieldError('current_password') 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                <div className="text-red-500 text-xs mt-1">
                  {getFieldError('current_password')}
                </div>
              )}
            </div>

            {/* New Password Input */}
            <div className="space-y-2">
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className={`h-10 text-sm bg-white border text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:border-[#7B0F2B] focus:ring-1 focus:ring-[#7B0F2B]/20 disabled:opacity-50 pr-10 rounded-md ${
                    getFieldError('new_password') 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                <div className="text-red-500 text-xs mt-1">
                  {getFieldError('new_password')}
                </div>
              )}

              {/* Password Validation Indicators */}
              {newPassword && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.minLength ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-gray-300" />
                      )}
                      <span className={passwordValidation.minLength ? "text-green-600" : "text-gray-500"}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.hasUppercase ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-gray-300" />
                      )}
                      <span className={passwordValidation.hasUppercase ? "text-green-600" : "text-gray-500"}>
                        One uppercase letter (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.hasLowercase ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-gray-300" />
                      )}
                      <span className={passwordValidation.hasLowercase ? "text-green-600" : "text-gray-500"}>
                        One lowercase letter (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.hasNumber ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-gray-300" />
                      )}
                      <span className={passwordValidation.hasNumber ? "text-green-600" : "text-gray-500"}>
                        One number (0-9)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.hasSymbol ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-gray-300" />
                      )}
                      <span className={passwordValidation.hasSymbol ? "text-green-600" : "text-gray-500"}>
                        One symbol (!@#$%^&* etc.)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password Input */}
            <div className="space-y-2">
              <label htmlFor="new_password_confirmation" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="new_password_confirmation"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className={`h-10 text-sm bg-white border text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:border-[#7B0F2B] focus:ring-1 focus:ring-[#7B0F2B]/20 disabled:opacity-50 pr-10 rounded-md ${
                    getFieldError('new_password_confirmation') 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                <div className="text-red-500 text-xs mt-1">
                  {getFieldError('new_password_confirmation')}
                </div>
              )}
            </div>

            {/* Change Password Button */}
            <Button
              type="submit"
              disabled={loading || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim() || !isPasswordValid}
              className="w-full h-10 text-sm font-medium bg-[#7B0F2B] hover:bg-[#5E0C20] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                  Changing Password...
                </span>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Password must be at least 8 characters long.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}