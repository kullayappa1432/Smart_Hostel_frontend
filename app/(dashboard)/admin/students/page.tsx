'use client';
import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { studentsApi, departmentsApi, semestersApi } from '@/lib/api';

export default function AdminStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchStudents = (p = 1) => {
    setLoading(true);
    studentsApi.getAll({ page: p, limit: 10 })
      .then((res) => {
        setStudents(res.data?.data?.students || []);
        setTotal(res.data?.data?.total || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
    departmentsApi.getAll().then((r) => setDepartments(r.data?.data || []));
    semestersApi.getAll().then((r) => setSemesters(r.data?.data || []));
  }, []);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await studentsApi.create(data);
      toast.success('Student created successfully');
      reset();
      setShowModal(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (r: any) => <span className="font-medium">{r.name}</span> },
    { key: 'hall_ticket', header: 'Hall Ticket', render: (r: any) => r.hall_ticket_number },
    { key: 'dept', header: 'Department', render: (r: any) => r.department?.department_code },
    { key: 'sem', header: 'Semester', render: (r: any) => `Sem ${r.semester?.semester_number}` },
    { key: 'gender', header: 'Gender', render: (r: any) => <Badge variant="outline">{r.gender}</Badge> },
    { key: 'account', header: 'Account', render: (r: any) => (
      <Badge variant={r.user ? 'success' : 'warning'}>{r.user ? 'Registered' : 'Pending'}</Badge>
    )},
  ];

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Students</h2>
            <p className="text-sm text-slate-500">{total} total students</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
            Add Student
          </Button>
        </div>

        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={students} loading={loading} emptyMessage="No students found" />
          </CardContent>
        </Card>

        {/* Pagination */}
        {total > 10 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => { setPage(p => p - 1); fetchStudents(page - 1); }}>
              Previous
            </Button>
            <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / 10)}</span>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 10)} onClick={() => { setPage(p => p + 1); fetchStudents(page + 1); }}>
              Next
            </Button>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Student" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Hall Ticket Number" placeholder="HTN2024001" error={errors.hall_ticket_number?.message as string}
              {...register('hall_ticket_number', { required: 'Required' })} />
            <Input label="Full Name" placeholder="Student Name" error={errors.name?.message as string}
              {...register('name', { required: 'Required' })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Course" placeholder="B.Tech" error={errors.course?.message as string}
              {...register('course', { required: 'Required' })} />
            <Select label="Gender" options={[
              { value: '', label: 'Select...' },
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
            ]} error={errors.gender?.message as string} {...register('gender', { required: 'Required' })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department" options={[
              { value: '', label: 'Select...' },
              ...departments.map((d) => ({ value: d.id, label: d.department_name })),
            ]} error={errors.department_id?.message as string} {...register('department_id', { required: 'Required' })} />
            <Select label="Semester" options={[
              { value: '', label: 'Select...' },
              ...semesters.map((s) => ({ value: s.id, label: `Sem ${s.semester_number} (${s.academic_year})` })),
            ]} error={errors.semester_id?.message as string} {...register('semester_id', { required: 'Required' })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Create Student</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
