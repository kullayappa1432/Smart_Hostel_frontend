'use client';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { menuApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminMenuPage() {
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchMenus = () => {
    setLoading(true);
    menuApi.getAllMenus().then((r) => setMenus(r.data?.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchMenus(); }, []);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await menuApi.createMenu(data);
      toast.success('Menu created');
      reset();
      setShowModal(false);
      fetchMenus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create menu');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'date', header: 'Date', render: (r: any) => formatDate(r.date) },
    { key: 'breakfast', header: 'Breakfast', render: (r: any) => <span className="text-xs">{r.breakfast}</span> },
    { key: 'lunch', header: 'Lunch', render: (r: any) => <span className="text-xs">{r.lunch}</span> },
    { key: 'dinner', header: 'Dinner', render: (r: any) => <span className="text-xs">{r.dinner}</span> },
  ];

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Menu Management</h2>
            <p className="text-sm text-slate-500">Manage daily hostel menus</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>Add Menu</Button>
        </div>

        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={menus} loading={loading} emptyMessage="No menus found" />
          </CardContent>
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Daily Menu">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Date" type="date" error={errors.date?.message as string}
            {...register('date', { required: 'Required' })} />
          <Textarea label="Breakfast" placeholder="Idli, Sambar, Chutney" rows={2}
            error={errors.breakfast?.message as string}
            {...register('breakfast', { required: 'Required' })} />
          <Textarea label="Lunch" placeholder="Rice, Dal, Sabzi, Roti" rows={2}
            error={errors.lunch?.message as string}
            {...register('lunch', { required: 'Required' })} />
          <Textarea label="Dinner" placeholder="Chapati, Paneer Curry, Salad" rows={2}
            error={errors.dinner?.message as string}
            {...register('dinner', { required: 'Required' })} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Save Menu</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
