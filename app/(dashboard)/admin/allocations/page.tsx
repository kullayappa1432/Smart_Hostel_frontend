'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { roomsApi, studentsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminAllocationsPage() {
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [deallocating, setDeallocating] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchAllocations = () => {
    setLoading(true);
    roomsApi.getAllAllocations({ limit: 50 })
      .then((res) => setAllocations(res.data?.data?.allocations || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllocations();
    studentsApi.getAll({ limit: 200 }).then((r) => setStudents(r.data?.data?.students || []));
    roomsApi.getAllRooms({ available: true }).then((r) => setRooms(r.data?.data?.rooms || []));
  }, []);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await roomsApi.adminAllocate(data);
      toast.success('Room allocated successfully');
      reset();
      setShowModal(false);
      fetchAllocations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeallocate = async (id: string) => {
    setDeallocating(id);
    try {
      await roomsApi.deallocate(id);
      toast.success('Room deallocated');
      fetchAllocations();
    } catch {
      toast.error('Failed to deallocate');
    } finally {
      setDeallocating(null);
    }
  };

  const columns = [
    { key: 'student', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium">{r.student?.name}</p>
        <p className="text-xs text-slate-400">{r.student?.hall_ticket_number}</p>
      </div>
    )},
    { key: 'room', header: 'Room', render: (r: any) => `Room ${r.room?.room_number}` },
    { key: 'hostel', header: 'Hostel', render: (r: any) => r.room?.hostel?.hostel_name },
    { key: 'block', header: 'Block/Floor', render: (r: any) => `Block ${r.room?.block_name} / Floor ${r.room?.floor_number}` },
    { key: 'date', header: 'Allocated On', render: (r: any) => formatDate(r.allocated_date) },
    { key: 'actions', header: '', render: (r: any) => (
      <Button size="sm" variant="danger" loading={deallocating === r.id}
        leftIcon={<Trash2 className="h-3 w-3" />}
        onClick={() => handleDeallocate(r.id)}>
        Deallocate
      </Button>
    )},
  ];

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Room Allocations</h2>
            <p className="text-sm text-slate-500">{allocations.length} active allocations</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
            Allocate Room
          </Button>
        </div>

        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={allocations} loading={loading} emptyMessage="No allocations found" />
          </CardContent>
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Allocate Room">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Student" options={[
            { value: '', label: 'Select student...' },
            ...students.map((s) => ({ value: s.id, label: `${s.name} (${s.hall_ticket_number})` })),
          ]} error={errors.student_id?.message as string}
            {...register('student_id', { required: 'Required', valueAsNumber: true })} />
          <Select label="Room" options={[
            { value: '', label: 'Select room...' },
            ...rooms.map((r) => ({ value: r.id, label: `Room ${r.room_number} — ${r.hostel?.hostel_name} Block ${r.block_name}` })),
          ]} error={errors.room_id?.message as string}
            {...register('room_id', { required: 'Required', valueAsNumber: true })} />
          <p className="text-xs text-slate-400">All allocation rules (gender, dept, semester) will be enforced.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Allocate</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
