'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { Building2, Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ForgotPasswordForm>();

  const watchEmail = watch('email');

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(data.email);
      
      setEmail(data.email);
      setOtpSent(true);
      
      toast.success('OTP sent to your email!');
      
      // Auto-redirect to verify-otp page after 2 seconds
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send OTP';
      toast.error(errorMessage);
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        toast.error('Email not found in our system');
      }
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Reset Password</h1>
            <p className="mt-2 text-sm text-slate-500">
              {otpSent 
                ? 'Check your email for the OTP code' 
                : 'Enter your email to receive an OTP'}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {!otpSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                <p className="mt-2 text-xs text-slate-500">
                  We'll send a one-time password (OTP) to this email address.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                loading={loading} 
                size="lg"
                disabled={!watchEmail}
              >
                Send OTP
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    Or
                  </span>
                </div>
              </div>

              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                Remember your password?{' '}
                <Link href="/login" className="font-medium text-blue-500 hover:text-blue-600">
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✓ OTP sent successfully to {email}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Redirecting to OTP verification...
                </p>
                <div className="flex justify-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce"></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>

              <Button 
                onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(email)}`)}
                className="w-full"
                size="lg"
              >
                Continue to OTP Verification
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
