'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { Building2, Mail, Lock, User, Hash, Phone } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface RegisterForm {
  hall_ticket_number: string;
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const { confirm_password, ...payload } = data;
      const res = await authApi.register(payload);
      const { access_token, user } = res.data.data;
      setAuth(user, access_token);
      toast.success('Account created successfully!');
      router.replace('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-blue-500/30">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="mt-1 text-sm text-slate-500">Register with your hall ticket number</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Hall Ticket Number"
              placeholder="HTN2024001"
              leftIcon={<Hash className="h-4 w-4" />}
              error={errors.hall_ticket_number?.message}
              hint="Pre-registered by admin"
              {...register('hall_ticket_number', { required: 'Hall ticket number is required' })}
            />

            <Input
              label="Full Name"
              placeholder="John Doe"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.full_name?.message}
              {...register('full_name', { required: 'Full name is required' })}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />

            <Input
              label="Phone (optional)"
              placeholder="+91-9876543210"
              leftIcon={<Phone className="h-4 w-4" />}
              {...register('phone')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min 8 chars, uppercase, number, symbol"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                  message: 'Must include uppercase, lowercase, number and symbol',
                },
              })}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.confirm_password?.message}
              {...register('confirm_password', {
                required: 'Please confirm password',
                validate: (v) => v === watch('password') || 'Passwords do not match',
              })}
            />

            <Button type="submit" className="w-full mt-2" loading={loading} size="lg">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-500 hover:text-blue-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
