'use client';
import { useEffect, useState } from 'react';
import { MessageSquareWarning, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select, Textarea, Input } from '@/components/ui/Input';
import { complaintsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const statusVariant: Record<string, any> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
};

export default function ComplaintsPage() {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchComplaints = () => {
    complaintsApi.getMyComplaints()
      .then((res) => setComplaints(res.data?.data || []))
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, []);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await complaintsApi.createComplaint(data);
      toast.success('Complaint submitted successfully');
      reset();
      setShowModal(false);
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Complaints</h2>
            <p className="text-sm text-slate-500">Submit and track your complaints</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
            New Complaint
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : complaints.length === 0 ? (
          <Card className="py-16 text-center">
            <MessageSquareWarning className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No complaints submitted yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <Card key={c.id} hover>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{c.title}</span>
                      <Badge variant="outline">{c.type}</Badge>
                      {c.priority && (
                        <Badge variant={c.priority === 'URGENT' ? 'danger' : c.priority === 'HIGH' ? 'warning' : 'outline'}>
                          {c.priority}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{c.description}</p>
                    {c.resolution && (
                      <p className="mt-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded px-2 py-1">
                        Resolution: {c.resolution}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusVariant[c.status] || 'default'}>{c.status.replace('_', ' ')}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Submit Complaint">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Title"
            placeholder="Brief title of your complaint"
            error={errors.title?.message as string}
            {...register('title', { required: 'Title is required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Complaint Type"
              options={[
                { value: '', label: 'Select type...' },
                { value: 'RAGGING', label: 'Ragging' },
                { value: 'ROOM', label: 'Room Issue' },
                { value: 'BATHROOM', label: 'Bathroom Issue' },
                { value: 'FOOD', label: 'Food Issue' },
                { value: 'MAINTENANCE', label: 'Maintenance' },
                { value: 'OTHER', label: 'Other' },
              ]}
              error={errors.type?.message as string}
              {...register('type', { required: 'Please select a type' })}
            />
            <Select
              label="Priority"
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              {...register('priority')}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="Describe your complaint in detail..."
            rows={4}
            error={errors.description?.message as string}
            {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'At least 10 characters' } })}
          />
          <Input
            label="Attachment URL (optional)"
            placeholder="https://..."
            {...register('file_url')}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" type="submit" loading={submitting}>
              Submit
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
