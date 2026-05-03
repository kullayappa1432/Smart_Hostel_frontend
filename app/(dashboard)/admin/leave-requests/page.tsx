'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, CalendarDays } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { leaveRequestsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const statusVariant: Record<string, any> = {
  PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', CANCELLED: 'outline',
};

export default function AdminLeaveRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [actionModal, setActionModal] = useState<{ open: boolean; id: string; action: 'APPROVED' | 'REJECTED' | null }>({
    open: false, id: '', action: null,
  });
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = () => {
    setLoading(true);
    const params: any = {};
    if (filterStatus) params.status = filterStatus;
    leaveRequestsApi.getAll(params)
      .then((res) => {
        const data = res.data?.data || [];
        setRequests(data);
        setStats({
          total: data.length,
          pending: data.filter((r: any) => r.status === 'PENDING').length,
          approved: data.filter((r: any) => r.status === 'APPROVED').length,
          rejected: data.filter((r: any) => r.status === 'REJECTED').length,
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [filterStatus]);

  const handleAction = async () => {
    if (!actionModal.id || !actionModal.action) return;
    setSubmitting(true);
    try {
      await leaveRequestsApi.approve(actionModal.id, { status: actionModal.action, remarks });
      toast.success(`Leave request ${actionModal.action.toLowerCase()}`);
      setActionModal({ open: false, id: '', action: null });
      setRemarks('');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getDuration = (from: string, to: string) => {
    const days = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  const columns = [
    { key: 'student', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.student?.name}</p>
        <p className="text-xs text-slate-500">{r.student?.hall_ticket_number}</p>
      </div>
    )},
    { key: 'dates', header: 'Leave Period', render: (r: any) => (
      <div>
        <p className="text-sm">{formatDate(r.from_date)} → {formatDate(r.to_date)}</p>
        <p className="text-xs text-slate-500">{getDuration(r.from_date, r.to_date)}</p>
      </div>
    )},
    { key: 'reason', header: 'Reason', render: (r: any) => (
      <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs">{r.reason}</span>
    )},
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={statusVariant[r.status] || 'outline'}>{r.status}</Badge>
    )},
    { key: 'applied', header: 'Applied', render: (r: any) => formatDate(r.created_at) },
    { key: 'actions', header: 'Actions', render: (r: any) => r.status === 'PENDING' ? (
      <div className="flex gap-2">
        <Button size="sm" variant="outline"
          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
          onClick={() => setActionModal({ open: true, id: r.id, action: 'APPROVED' })}>
          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
        </Button>
        <Button size="sm" variant="outline"
          className="text-red-600 border-red-300 hover:bg-red-50"
          onClick={() => setActionModal({ open: true, id: r.id, action: 'REJECTED' })}>
          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
        </Button>
      </div>
    ) : (
      <span className="text-xs text-slate-400">
        {r.approver ? `By ${r.approver.full_name}` : '—'}
      </span>
    )},
  ];

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Leave Requests</h2>
          <p className="text-sm text-slate-500">Manage student leave applications</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total" value={stats.total} icon={<CalendarDays className="h-6 w-6" />} color="blue" loading={loading} />
          <StatCard title="Pending" value={stats.pending} icon={<Clock className="h-6 w-6" />} color="amber" loading={loading} />
          <StatCard title="Approved" value={stats.approved} icon={<CheckCircle className="h-6 w-6" />} color="emerald" loading={loading} />
          <StatCard title="Rejected" value={stats.rejected} icon={<XCircle className="h-6 w-6" />} color="red" loading={loading} />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={requests} loading={loading} emptyMessage="No leave requests found" />
          </CardContent>
        </Card>
      </div>

      <Modal
        open={actionModal.open}
        onClose={() => setActionModal({ open: false, id: '', action: null })}
        title={actionModal.action === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {actionModal.action === 'APPROVED'
              ? 'Are you sure you want to approve this leave request?'
              : 'Are you sure you want to reject this leave request?'}
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Remarks (optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Add a note for the student..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setActionModal({ open: false, id: '', action: null })}>
              Cancel
            </Button>
            <Button
              className={`flex-1 ${actionModal.action === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              loading={submitting}
              onClick={handleAction}
            >
              {actionModal.action === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
