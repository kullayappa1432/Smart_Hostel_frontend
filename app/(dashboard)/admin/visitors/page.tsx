'use client';
import { useEffect, useState } from 'react';
import { Plus, UserCheck, LogOut } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { visitorsApi, studentsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const RELATIONS = ['Father', 'Mother', 'Brother', 'Sister', 'Guardian', 'Friend', 'Other'];
const ID_PROOFS = ['Aadhar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID'];

export default function AdminVisitorsPage() {
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filterActive, setFilterActive] = useState<string>('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchVisitors = () => {
    setLoading(true);
    const params: any = {};
    if (filterActive !== '') params.checked_out = filterActive;
    visitorsApi.getAll(params)
      .then((res) => setVisitors(res.data?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVisitors(); }, [filterActive]);

  useEffect(() => {
    studentsApi.getAll({ limit: 200 }).then((r) => setStudents(r.data?.data?.students || []));
  }, []);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await visitorsApi.create(data);
      toast.success('Visitor checked in successfully');
      reset();
      setShowModal(false);
      fetchVisitors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to check in visitor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await visitorsApi.checkOut(id, { check_out_time: new Date().toISOString() });
      toast.success('Visitor checked out');
      fetchVisitors();
    } catch (err: any) {
      toast.error('Failed to check out visitor');
    }
  };

  const columns = [
    { key: 'visitor', header: 'Visitor', render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.visitor_name}</p>
        <p className="text-xs text-slate-500">{r.relation} · {r.phone}</p>
      </div>
    )},
    { key: 'student', header: 'Visiting', render: (r: any) => (
      <div>
        <p className="text-sm font-medium">{r.student?.name}</p>
        <p className="text-xs text-slate-500">{r.student?.hall_ticket_number}</p>
      </div>
    )},
    { key: 'id_proof', header: 'ID Proof', render: (r: any) => (
      <span className="text-xs text-slate-600 dark:text-slate-400">
        {r.id_proof_type ? `${r.id_proof_type}: ${r.id_proof_number || '—'}` : '—'}
      </span>
    )},
    { key: 'check_in', header: 'Check In', render: (r: any) => (
      <span className="text-sm">{new Date(r.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    )},
    { key: 'check_out', header: 'Check Out', render: (r: any) => r.check_out_time ? (
      <span className="text-sm text-slate-500">
        {new Date(r.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    ) : (
      <Badge variant="success">Inside</Badge>
    )},
    { key: 'purpose', header: 'Purpose', render: (r: any) => (
      <span className="text-xs text-slate-500 line-clamp-1">{r.purpose || '—'}</span>
    )},
    { key: 'actions', header: '', render: (r: any) => !r.check_out_time ? (
      <Button size="sm" variant="outline" onClick={() => handleCheckOut(r.id)}>
        <LogOut className="h-3.5 w-3.5 mr-1" /> Check Out
      </Button>
    ) : null },
  ];

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Visitor Management</h2>
            <p className="text-sm text-slate-500">Track hostel visitors</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
            Check In Visitor
          </Button>
        </div>

        <div className="flex gap-2">
          {[{ label: 'All', value: '' }, { label: 'Inside', value: 'false' }, { label: 'Checked Out', value: 'true' }].map((f) => (
            <button key={f.value} onClick={() => setFilterActive(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterActive === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={visitors} loading={loading} emptyMessage="No visitors found" />
          </CardContent>
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Check In Visitor" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Student Being Visited" options={[
            { value: '', label: 'Select student...' },
            ...students.map((s) => ({ value: s.id, label: `${s.name} (${s.hall_ticket_number})` })),
          ]} error={errors.student_id?.message as string}
            {...register('student_id', { required: 'Required' })} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Visitor Name" placeholder="Full name"
              error={errors.visitor_name?.message as string}
              {...register('visitor_name', { required: 'Required' })} />
            <Select label="Relation" options={[
              { value: '', label: 'Select...' },
              ...RELATIONS.map((r) => ({ value: r, label: r })),
            ]} error={errors.relation?.message as string}
              {...register('relation', { required: 'Required' })} />
          </div>

          <Input label="Phone Number" placeholder="9876543210"
            error={errors.phone?.message as string}
            {...register('phone', { required: 'Required' })} />

          <div className="grid grid-cols-2 gap-4">
            <Select label="ID Proof Type" options={[
              { value: '', label: 'Select...' },
              ...ID_PROOFS.map((p) => ({ value: p, label: p })),
            ]} {...register('id_proof_type')} />
            <Input label="ID Proof Number" placeholder="XXXX-XXXX-XXXX"
              {...register('id_proof_number')} />
          </div>

          <Input label="Purpose of Visit" placeholder="Visiting student, dropping items..."
            {...register('purpose')} />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Check In</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
