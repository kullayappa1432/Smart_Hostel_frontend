'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, UserCheck, UserX, Search, Mail, Phone, MapPin, IndianRupee, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { attenderStaffApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

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

export default function AdminAttendersPage() {
  const [loading, setLoading] = useState(true);
  const [attenders, setAttenders] = useState<Attender[]>([]);
  const [filteredAttenders, setFilteredAttenders] = useState<Attender[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAttender, setEditingAttender] = useState<Attender | null>(null);
  const [deletingAttender, setDeletingAttender] = useState<Attender | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      salary: '',
    },
  });

  const fetchAttenders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== 'all') {
        params.is_active = filterStatus === 'active';
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const res = await attenderStaffApi.getAll(params);
      const data = res.data?.data || [];
      setAttenders(data);
      setFilteredAttenders(data);
      
      setStats({
        total: data.length,
        active: data.filter((a: Attender) => a.is_active).length,
        inactive: data.filter((a: Attender) => !a.is_active).length,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch attenders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttenders();
  }, [filterStatus, searchQuery]);

  const openCreateModal = () => {
    setEditingAttender(null);
    reset({
      name: '',
      phone: '',
      email: '',
      address: '',
      salary: '',
    });
    setShowModal(true);
  };

  const openEditModal = (attender: Attender) => {
    setEditingAttender(attender);
    setValue('name', attender.name);
    setValue('phone', attender.phone);
    setValue('email', attender.email);
    setValue('address', attender.address || '');
    setValue('salary', attender.salary ? String(attender.salary) : '');
    setShowModal(true);
  };

  const openDeleteModal = (attender: Attender) => {
    setDeletingAttender(attender);
    setShowDeleteModal(true);
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

      if (editingAttender) {
        await attenderStaffApi.update(editingAttender.id, payload);
        toast.success('Attender updated successfully');
      } else {
        await attenderStaffApi.create(payload);
        toast.success('Attender created successfully');
      }

      reset();
      setShowModal(false);
      fetchAttenders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${editingAttender ? 'update' : 'create'} attender`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAttender) return;
    
    setSubmitting(true);
    try {
      await attenderStaffApi.delete(deletingAttender.id);
      toast.success('Attender deleted successfully');
      setShowDeleteModal(false);
      setDeletingAttender(null);
      fetchAttenders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete attender');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (attender: Attender) => {
    try {
      await attenderStaffApi.toggleStatus(attender.id);
      toast.success(`Attender ${attender.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchAttenders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (r: Attender) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
              {r.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{r.name}</p>
            <p className="text-xs text-slate-500">{r.role}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (r: Attender) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Mail className="h-3.5 w-3.5" />
            <span>{r.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Phone className="h-3.5 w-3.5" />
            <span>{r.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (r: Attender) => (
        <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{r.address || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      render: (r: Attender) => (
        <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100">
          <IndianRupee className="h-4 w-4" />
          <span>{r.salary ? Number(r.salary).toLocaleString() : 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'join_date',
      header: 'Join Date',
      render: (r: Attender) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatDate(r.join_date)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: Attender) => (
        <Badge variant={r.is_active ? 'success' : 'danger'}>
          {r.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: Attender) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/attenders/${r.id}`}>
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </button>
          </Link>
          <button
            onClick={() => handleToggleStatus(r)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            title={r.is_active ? 'Deactivate' : 'Activate'}
          >
            {r.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </button>
          <Link href={`/admin/attenders/${r.id}/edit`}>
            <button
              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          </Link>
          <button
            onClick={() => openDeleteModal(r)}
            className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Attender Management</h2>
            <p className="text-sm text-slate-500">Manage hostel attender staff members</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
            Add Attender
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Attenders"
            value={stats.total}
            icon={<UserCheck className="h-6 w-6" />}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon={<UserCheck className="h-6 w-6" />}
            color="emerald"
            loading={loading}
          />
          <StatCard
            title="Inactive"
            value={stats.inactive}
            icon={<UserX className="h-6 w-6" />}
            color="red"
            loading={loading}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {(['all', 'active', 'inactive'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table
              columns={columns}
              data={filteredAttenders}
              loading={loading}
              emptyMessage="No attenders found"
            />
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingAttender ? 'Edit Attender' : 'Add New Attender'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter full name"
            error={errors.name?.message as string}
            {...register('name', { required: 'Name is required' })}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>

          <Input
            label="Address"
            placeholder="Enter address (optional)"
            {...register('address')}
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

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" type="submit" loading={submitting}>
              {editingAttender ? 'Update' : 'Create'} Attender
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Attender"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to delete <strong>{deletingAttender?.name}</strong>? This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
              loading={submitting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
