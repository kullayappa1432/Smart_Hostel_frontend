'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { attendanceApi, studentsApi, semestersApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    Promise.all([
      attendanceApi.getAllAttendance(),
      studentsApi.getAll({ limit: 100 }),
      semestersApi.getAll(),
    ]).then(([attRes, studRes, semRes]) => {
      setRecords(attRes.data?.data || []);
      setStudents(studRes.data?.data?.students || []);
      setSemesters(semRes.data?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await attendanceApi.markAttendance(data);
      toast.success('Attendance marked');
      reset();
      const res = await attendanceApi.getAllAttendance();
      setRecords(res.data?.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'student', header: 'Student', render: (r: any) => r.student?.name },
    { key: 'date', header: 'Date', render: (r: any) => formatDate(r.date) },
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={r.status === 'PRESENT' ? 'success' : 'danger'}>{r.status}</Badge>
    )},
  ];

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Attendance Management</h2>
          <p className="text-sm text-slate-500">Mark and view student attendance</p>
        </div>

        {/* Mark Attendance Form */}
        <Card>
          <CardHeader><CardTitle>Mark Attendance</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Select label="Student" options={[
                { value: '', label: 'Select student...' },
                ...students.map((s) => ({ value: s.id, label: `${s.name} (${s.hall_ticket_number})` })),
              ]} error={errors.student_id?.message as string}
                {...register('student_id', { required: 'Required' })} />
              <Select label="Semester" options={[
                { value: '', label: 'Select semester...' },
                ...semesters.map((s) => ({ value: s.id, label: `Sem ${s.semester_number}` })),
              ]} error={errors.semester_id?.message as string}
                {...register('semester_id', { required: 'Required' })} />
              <Input label="Date" type="date" error={errors.date?.message as string}
                {...register('date', { required: 'Required' })} />
              <Select label="Status" options={[
                { value: 'PRESENT', label: 'Present' },
                { value: 'ABSENT', label: 'Absent' },
              ]} {...register('status')} />
              <div className="sm:col-span-4">
                <Button type="submit" loading={submitting}>Mark Attendance</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Records */}
        <Card>
          <CardHeader><CardTitle>Recent Records</CardTitle></CardHeader>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={records} loading={loading} emptyMessage="No records found" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
