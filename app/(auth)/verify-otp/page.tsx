'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { Building2, ArrowLeft, Clock } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface VerifyOtpForm {
  otp: string;
}

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<VerifyOtpForm>();

  const watchOtp = watch('otp');

  // Timer for OTP expiration
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input - auto-format to 6 digits
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue('otp', value);
  };

  const onSubmit = async (data: VerifyOtpForm) => {
    if (!email) {
      toast.error('Email not found. Please start over.');
      router.push('/forgot-password');
      return;
    }

    if (data.otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp({
        email,
        otp: data.otp
      });

      const { reset_token } = res.data.data;
      setResetToken(reset_token);
      setOtpVerified(true);

      toast.success('OTP verified successfully!');

      // Auto-redirect to reset password page after 2 seconds
      setTimeout(() => {
        router.push(`/reset-password?token=${encodeURIComponent(reset_token)}`);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to verify OTP';
      toast.error(errorMessage);

      if (err.response?.status === 400) {
        toast.error('Invalid or expired OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Email not found. Please start over.');
      router.push('/forgot-password');
      return;
    }

    setResending(true);
    try {
      await authApi.forgotPassword(email);
      setTimeLeft(300); // Reset timer to 5 minutes
      setValue('otp', ''); // Clear OTP input
      toast.success('New OTP sent to your email!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Toaster position="top-right" />
        <div className="w-full max-w-md text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">Email not found. Redirecting...</p>
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
            href="/forgot-password" 
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-blue-500/30">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Verify OTP</h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter the 6-digit code sent to {email}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {!otpVerified ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  One-Time Password
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  onChange={handleOtpChange}
                  {...register('otp', {
                    required: 'OTP is required',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'OTP must be 6 digits'
                    }
                  })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-mono tracking-widest text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
                {errors.otp && (
                  <p className="mt-2 text-sm text-red-500">{errors.otp.message}</p>
                )}
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {timeLeft > 0 ? (
                    <>OTP expires in {formatTime(timeLeft)}</>
                  ) : (
                    <>OTP has expired</>
                  )}
                </span>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                loading={loading} 
                size="lg"
                disabled={!watchOtp || watchOtp.length !== 6 || timeLeft <= 0}
              >
                Verify OTP
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending || timeLeft > 240} // Can resend after 1 minute
                    className="font-medium text-blue-500 hover:text-blue-600 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {resending ? 'Sending...' : 'Resend OTP'}
                  </button>
                </p>
                {timeLeft > 240 && (
                  <p className="mt-1 text-xs text-slate-500">
                    You can resend OTP after {formatTime(timeLeft - 240)}
                  </p>
                )}
              </div>

              {/* Help Text */}
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  💡 Check your spam folder if you don't see the email. The OTP is valid for 5 minutes.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✓ OTP verified successfully!
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Redirecting to password reset...
                </p>
                <div className="flex justify-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce"></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>

              <Button 
                onClick={() => router.push(`/reset-password?token=${encodeURIComponent(resetToken)}`)}
                className="w-full"
                size="lg"
              >
                Continue to Reset Password
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
