'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, IndianRupee, Calendar, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { attenderStaffApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

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

export default function AttenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [attender, setAttender] = useState<Attender | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAttender();
  }, [id]);

  const fetchAttender = async () => {
    setLoading(true);
    try {
      const res = await attenderStaffApi.getById(id);
      setAttender(res.data?.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch attender');
      router.push('/admin/attenders');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await attenderStaffApi.toggleStatus(id);
      toast.success(`Attender ${attender?.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchAttender();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await attenderStaffApi.delete(id);
      toast.success('Attender deleted successfully');
      router.push('/admin/attenders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete attender');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout requireAdmin>
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!attender) {
    return (
      <DashboardLayout requireAdmin>
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">Attender not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/attenders">
              <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{attender.name}</h2>
              <p className="text-sm text-slate-500">{attender.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={attender.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              onClick={handleToggleStatus}
            >
              {attender.is_active ? 'Deactivate' : 'Activate'}
            </Button>
            <Link href={`/admin/attenders/${id}/edit`}>
              <Button leftIcon={<Edit className="h-4 w-4" />}>Edit</Button>
            </Link>
            <Button
              variant="danger"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={attender.is_active ? 'success' : 'danger'}>
            {attender.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Main Info */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{attender.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{attender.phone}</p>
                </div>
              </div>
              {attender.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{attender.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attender.salary && (
                <div className="flex items-center gap-3">
                  <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Monthly Salary</p>
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      ₹{Number(attender.salary).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Join Date</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {formatDate(attender.join_date)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Created At</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {formatDate(attender.created_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {formatDate(attender.updated_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Attender"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to delete <strong>{attender.name}</strong>? This action cannot be undone.
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
              loading={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
