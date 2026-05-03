'use client';
import { useEffect, useState } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { leaveRequestsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const statusVariant: Record<string, any> = {
  PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', CANCELLED: 'outline',
};

export default function StudentLeaveRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchRequests = () => {
    setLoading(true);
    leaveRequestsApi.getAll()
      .then((res) => setRequests(res.data?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await leaveRequestsApi.create(data);
      toast.success('Leave request submitted successfully');
      reset();
      setShowModal(false);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await leaveRequestsApi.update(id, { status: 'CANCELLED' });
      toast.success('Leave request cancelled');
      fetchRequests();
    } catch (err: any) {
      toast.error('Failed to cancel request');
    }
  };

  const getDuration = (from: string, to: string) => {
    const days = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  const columns = [
    { key: 'dates', header: 'Leave Period', render: (r: any) => (
      <div>
        <p className="text-sm font-medium">{formatDate(r.from_date)} → {formatDate(r.to_date)}</p>
        <p className="text-xs text-slate-500">{getDuration(r.from_date, r.to_date)}</p>
      </div>
    )},
    { key: 'reason', header: 'Reason', render: (r: any) => (
      <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs">{r.reason}</span>
    )},
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={statusVariant[r.status] || 'outline'}>{r.status}</Badge>
    )},
    { key: 'remarks', header: 'Remarks', render: (r: any) => (
      <span className="text-xs text-slate-500">{r.remarks || '—'}</span>
    )},
    { key: 'applied', header: 'Applied', render: (r: any) => formatDate(r.created_at) },
    { key: 'actions', header: '', render: (r: any) => r.status === 'PENDING' ? (
      <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50"
        onClick={() => handleCancel(r.id)}>
        Cancel
      </Button>
    ) : null },
  ];

  const today = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Leave Requests</h2>
            <p className="text-sm text-slate-500">Apply for and track your leave requests</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
            Apply for Leave
          </Button>
        </div>

        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={requests} loading={loading} emptyMessage="No leave requests found" />
          </CardContent>
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Apply for Leave" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="From Date" type="date" min={today}
              error={errors.from_date?.message as string}
              {...register('from_date', { required: 'Required' })} />
            <Input label="To Date" type="date" min={today}
              error={errors.to_date?.message as string}
              {...register('to_date', { required: 'Required' })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Explain the reason for your leave..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('reason', { required: 'Reason is required' })}
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-red-500">{errors.reason.message as string}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
