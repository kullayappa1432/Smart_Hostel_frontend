'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { studentsApi, departmentsApi, semestersApi } from '@/lib/api';

export default function AttenderStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  const addForm = useForm();
  const editForm = useForm();

  const fetchStudents = (p = 1) => {
    setLoading(true);
    studentsApi.getAll({ page: p, limit: 15 })
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

  const onAdd = async (data: any) => {
    setSubmitting(true);
    try {
      await studentsApi.create(data);
      toast.success('Student added successfully');
      addForm.reset();
      setShowAddModal(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = async (data: any) => {
    setSubmitting(true);
    try {
      await studentsApi.update(editStudent.id, data);
      toast.success('Student updated');
      setShowEditModal(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (student: any) => {
    setEditStudent(student);
    editForm.reset({
      name: student.name,
      phone: student.phone || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      address: student.address || '',
    });
    setShowEditModal(true);
  };

  const filtered = search
    ? students.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.hall_ticket_number.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  const columns = [
    { key: 'name', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.name}</p>
        <p className="text-xs text-slate-500">{r.hall_ticket_number}</p>
      </div>
    )},
    { key: 'dept', header: 'Department', render: (r: any) => r.department?.department_code || '—' },
    { key: 'sem', header: 'Semester', render: (r: any) => `Sem ${r.semester?.semester_number}` },
    { key: 'gender', header: 'Gender', render: (r: any) => (
      <Badge variant="outline">{r.gender}</Badge>
    )},
    { key: 'phone', header: 'Phone', render: (r: any) => r.phone || '—' },
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={r.status === 'ACTIVE' ? 'success' : 'warning'}>{r.status}</Badge>
    )},
    { key: 'actions', header: '', render: (r: any) => (
      <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
      </Button>
    )},
  ];

  const genderOptions = [{ value: '', label: 'Select...' }, { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }];
  const deptOptions = [{ value: '', label: 'Select...' }, ...departments.map((d) => ({ value: d.id, label: d.department_name }))];
  const semOptions = [{ value: '', label: 'Select...' }, ...semesters.map((s) => ({ value: s.id, label: `Sem ${s.semester_number} (${s.academic_year})` }))];

  return (
    <DashboardLayout requireAttender>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Students</h2>
            <p className="text-sm text-slate-500">{total} total students</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddModal(true)}>
            Add Student
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or hall ticket..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={filtered} loading={loading} emptyMessage="No students found" />
          </CardContent>
        </Card>

        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => { setPage(p => p - 1); fetchStudents(page - 1); }}>Previous</Button>
            <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / 15)}</span>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 15)} onClick={() => { setPage(p => p + 1); fetchStudents(page + 1); }}>Next</Button>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Student" size="lg">
        <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Hall Ticket Number" placeholder="HTN2024001"
              error={addForm.formState.errors.hall_ticket_number?.message as string}
              {...addForm.register('hall_ticket_number', { required: 'Required' })} />
            <Input label="Full Name" placeholder="Student Name"
              error={addForm.formState.errors.name?.message as string}
              {...addForm.register('name', { required: 'Required' })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Course" placeholder="B.Tech"
              error={addForm.formState.errors.course?.message as string}
              {...addForm.register('course', { required: 'Required' })} />
            <Select label="Gender" options={genderOptions}
              error={addForm.formState.errors.gender?.message as string}
              {...addForm.register('gender', { required: 'Required' })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department" options={deptOptions}
              error={addForm.formState.errors.department_id?.message as string}
              {...addForm.register('department_id', { required: 'Required' })} />
            <Select label="Semester" options={semOptions}
              error={addForm.formState.errors.semester_id?.message as string}
              {...addForm.register('semester_id', { required: 'Required' })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" placeholder="9876543210" {...addForm.register('phone')} />
            <Input label="Parent Name" placeholder="Parent Name" {...addForm.register('parent_name')} />
          </div>
          <Input label="Parent Phone" placeholder="9876543210" {...addForm.register('parent_phone')} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Add Student</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Student" size="md">
        <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
          <Input label="Full Name" {...editForm.register('name', { required: 'Required' })} />
          <Input label="Phone" {...editForm.register('phone')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Parent Name" {...editForm.register('parent_name')} />
            <Input label="Parent Phone" {...editForm.register('parent_phone')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
            <textarea rows={2} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...editForm.register('address')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
