'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { attenderStaffApi } from '@/lib/api';
import Link from 'next/link';

interface Attender {
  id: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  address?: string;
  salary?: number;
  join_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function EditAttenderPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attender, setAttender] = useState<Attender | null>(null);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      salary: '',
    },
  });

  useEffect(() => {
    fetchAttender();
  }, [id]);

  const fetchAttender = async () => {
    setLoading(true);
    try {
      const res = await attenderStaffApi.getById(id);
      const data = res.data?.data;
      setAttender(data);
      
      // Set form values
      setValue('name', data.name);
      setValue('phone', data.phone);
      setValue('email', data.email);
      setValue('address', data.address || '');
      setValue('salary', data.salary ? String(data.salary) : '');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch attender');
      router.push('/admin/attenders');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address || undefined,
        salary: data.salary ? Number(data.salary) : undefined,
      };

      await attenderStaffApi.update(id, payload);
      toast.success('Attender updated successfully');
      router.push(`/admin/attenders/${id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update attender');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout requireAdmin>
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!attender) {
    return (
      <DashboardLayout requireAdmin>
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">Attender not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/admin/attenders/${id}`}>
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Edit Attender</h2>
            <p className="text-sm text-slate-500">{attender.name}</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Update Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="Full Name"
                  placeholder="Enter full name"
                  error={errors.name?.message as string}
                  {...register('name', { required: 'Name is required' })}
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  error={errors.email?.message as string}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />

                <Input
                  label="Phone"
                  type="tel"
                  placeholder="9876543210"
                  error={errors.phone?.message as string}
                  {...register('phone', {
                    required: 'Phone is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Phone must be 10 digits',
                    },
                  })}
                />

                <Input
                  label="Monthly Salary (₹)"
                  type="number"
                  placeholder="15000"
                  error={errors.salary?.message as string}
                  {...register('salary', {
                    min: { value: 0, message: 'Salary must be positive' },
                  })}
                />
              </div>

              <Input
                label="Address"
                placeholder="Enter address (optional)"
                {...register('address')}
              />

              <div className="flex gap-3 pt-4">
                <Link href={`/admin/attenders/${id}`} className="flex-1">
                  <Button variant="outline" className="w-full" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button className="flex-1" type="submit" loading={submitting}>
                  Update Attender
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
