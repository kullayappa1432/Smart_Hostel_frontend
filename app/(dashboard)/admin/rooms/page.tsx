'use client';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { roomsApi, departmentsApi, semestersApi } from '@/lib/api';

export default function AdminRoomsPage() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchRooms = () => {
    setLoading(true);
    roomsApi.getAllRooms()
      .then((res) => setRooms(res.data?.data?.rooms || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRooms();
    departmentsApi.getAll().then((r) => setDepartments(r.data?.data || []));
    semestersApi.getAll().then((r) => setSemesters(r.data?.data || []));
  }, []);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await roomsApi.createRoom(data);
      toast.success('Room created');
      reset();
      setShowModal(false);
      fetchRooms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'room_number', header: 'Room', render: (r: any) => <span className="font-bold">{r.room_number}</span> },
    { key: 'hostel', header: 'Hostel', render: (r: any) => r.hostel?.hostel_name },
    { key: 'block', header: 'Block/Floor', render: (r: any) => `Block ${r.block_name} / Floor ${r.floor_number}` },
    { key: 'dept', header: 'Department', render: (r: any) => r.department?.department_code },
    { key: 'capacity', header: 'Occupancy', render: (r: any) => (
      <div className="flex items-center gap-2">
        <span className="text-sm">{r.occupied_count}/{r.capacity}</span>
        <div className="h-1.5 w-16 rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${(r.occupied_count / r.capacity) * 100}%` }} />
        </div>
      </div>
    )},
    { key: 'available', header: 'Status', render: (r: any) => (
      <Badge variant={r.available ? 'success' : 'danger'}>{r.available ? 'Available' : 'Full'}</Badge>
    )},
  ];

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Rooms</h2>
            <p className="text-sm text-slate-500">{rooms.length} total rooms</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>Add Room</Button>
        </div>

        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={rooms} loading={loading} emptyMessage="No rooms found" />
          </CardContent>
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Room" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Room Number" placeholder="101" error={errors.room_number?.message as string}
              {...register('room_number', { required: 'Required' })} />
            <Input label="Block Name" placeholder="A" error={errors.block_name?.message as string}
              {...register('block_name', { required: 'Required' })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Floor Number" type="number" placeholder="1" error={errors.floor_number?.message as string}
              {...register('floor_number', { required: 'Required', valueAsNumber: true })} />
            <Input label="Capacity" type="number" placeholder="4" error={errors.capacity?.message as string}
              {...register('capacity', { required: 'Required', valueAsNumber: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department" options={[
              { value: '', label: 'Select...' },
              ...departments.map((d) => ({ value: d.id, label: d.department_name })),
            ]} error={errors.department_id?.message as string} {...register('department_id', { required: 'Required' })} />
            <Select label="Semester" options={[
              { value: '', label: 'Select...' },
              ...semesters.map((s) => ({ value: s.id, label: `Sem ${s.semester_number}` })),
            ]} error={errors.semester_id?.message as string} {...register('semester_id', { required: 'Required' })} />
          </div>
          <Input label="Hostel ID" type="number" placeholder="1" error={errors.hostel_id?.message as string}
            {...register('hostel_id', { required: 'Required', valueAsNumber: true })} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Create Room</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
