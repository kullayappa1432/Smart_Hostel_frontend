'use client';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { Building2, ArrowLeft, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ResetPasswordForm {
  new_password: string;
  confirm_password: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    hasMinLength: boolean;
  };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordForm>();

  const password = watch('new_password');
  const confirmPassword = watch('confirm_password');

  // Calculate password strength
  const passwordStrength = useMemo((): PasswordStrength => {
    if (!password) {
      return {
        score: 0,
        label: 'No password',
        color: 'bg-slate-200',
        requirements: {
          hasUppercase: false,
          hasLowercase: false,
          hasNumber: false,
          hasSpecialChar: false,
          hasMinLength: false,
        },
      };
    }

    const requirements = {
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
      hasMinLength: password.length >= 8,
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;

    let score = 0;
    let label = '';
    let color = '';

    if (metRequirements <= 2) {
      score = 1;
      label = 'Weak';
      color = 'bg-red-500';
    } else if (metRequirements === 3) {
      score = 2;
      label = 'Fair';
      color = 'bg-yellow-500';
    } else if (metRequirements === 4) {
      score = 3;
      label = 'Good';
      color = 'bg-blue-500';
    } else {
      score = 4;
      label = 'Strong';
      color = 'bg-green-500';
    }

    return { score, label, color, requirements };
  }, [password]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Reset token not found. Please start over.');
      router.push('/forgot-password');
      return;
    }

    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 3) {
      toast.error('Password is not strong enough');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token,
        new_password: data.new_password,
      });

      setPasswordReset(true);
      toast.success('Password reset successfully!');

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      toast.error(errorMessage);

      if (err.response?.status === 400) {
        toast.error('Invalid or expired reset token. Please try again.');
        setTimeout(() => {
          router.push('/forgot-password');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Toaster position="top-right" />
        <div className="w-full max-w-md text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">Reset token not found. Redirecting...</p>
          <Button onClick={() => router.push('/forgot-password')} className="w-full">
            Go to Forgot Password
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Toaster position="top-right" />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
          
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-blue-500/30">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Create New Password</h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter a strong password to secure your account
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {!passwordReset ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    {...register('new_password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                        message: 'Password must contain uppercase, lowercase, number and special character',
                      },
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pl-10 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                  />
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.new_password && (
                  <p className="mt-2 text-sm text-red-500">{errors.new_password.message}</p>
                )}
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Password Strength
                    </span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.color === 'bg-red-500' ? 'text-red-600 dark:text-red-400' :
                      passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-600 dark:text-yellow-400' :
                      passwordStrength.color === 'bg-blue-500' ? 'text-blue-600 dark:text-blue-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full transition-all ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    ></div>
                  </div>

                  {/* Requirements Checklist */}
                  <div className="space-y-2">
                    <RequirementItem
                      met={passwordStrength.requirements.hasMinLength}
                      label="At least 8 characters"
                    />
                    <RequirementItem
                      met={passwordStrength.requirements.hasUppercase}
                      label="One uppercase letter (A-Z)"
                    />
                    <RequirementItem
                      met={passwordStrength.requirements.hasLowercase}
                      label="One lowercase letter (a-z)"
                    />
                    <RequirementItem
                      met={passwordStrength.requirements.hasNumber}
                      label="One number (0-9)"
                    />
                    <RequirementItem
                      met={passwordStrength.requirements.hasSpecialChar}
                      label="One special character (@$!%*?&)"
                    />
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...register('confirm_password', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === password || 'Passwords do not match',
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pl-10 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                  />
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="mt-2 text-sm text-red-500">{errors.confirm_password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                loading={loading} 
                size="lg"
                disabled={!password || !confirmPassword || passwordStrength.score < 3}
              >
                Reset Password
              </Button>

              {/* Security Info */}
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  🔒 Your password is encrypted and secure. Never share it with anyone.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✓ Password reset successfully!
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Redirecting to login...
                </p>
                <div className="flex justify-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce"></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>

              <Button 
                onClick={() => router.push('/login')}
                className="w-full"
                size="lg"
              >
                Go to Login
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-slate-400">
          Having trouble? Contact support at support@hostel.com
        </p>
      </div>
    </div>
  );
}

// Helper component for password requirements
function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      )}
      <span className={`text-xs ${
        met 
          ? 'text-green-600 dark:text-green-400' 
          : 'text-slate-500 dark:text-slate-400'
      }`}>
        {label}
      </span>
    </div>
  );
}
