'use client';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { complaintsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminComplaintsPage() {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchComplaints = () => {
    setLoading(true);
    const params: any = { limit: 20 };
    if (filterStatus) params.status = filterStatus;
    if (filterType) params.type = filterType;
    complaintsApi.getAllComplaints(params)
      .then((res) => {
        setComplaints(res.data?.data?.complaints || []);
        setTotal(res.data?.data?.total || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, [filterStatus, filterType]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await complaintsApi.updateStatus(id, status);
      toast.success('Status updated');
      fetchComplaints();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const columns = [
    { key: 'student', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.student?.name}</p>
        <p className="text-xs text-slate-400">{r.student?.hall_ticket_number}</p>
      </div>
    )},
    { key: 'title', header: 'Title', render: (r: any) => (
      <div>
        <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{r.title}</p>
        <p className="text-xs text-slate-500 line-clamp-1">{r.description}</p>
      </div>
    )},
    { key: 'type', header: 'Type', render: (r: any) => <Badge variant="outline">{r.type}</Badge> },
    { key: 'priority', header: 'Priority', render: (r: any) => (
      <Badge variant={r.priority === 'URGENT' ? 'danger' : r.priority === 'HIGH' ? 'warning' : 'outline'}>
        {r.priority}
      </Badge>
    )},
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={r.status === 'RESOLVED' ? 'success' : r.status === 'IN_PROGRESS' ? 'info' : 'warning'}>
        {r.status.replace('_', ' ')}
      </Badge>
    )},
    { key: 'date', header: 'Date', render: (r: any) => formatDate(r.created_at) },
    { key: 'actions', header: 'Actions', render: (r: any) => (
      <div className="flex gap-1">
        {r.status !== 'IN_PROGRESS' && (
          <Button size="sm" variant="secondary" loading={updating === r.id}
            onClick={() => updateStatus(r.id, 'IN_PROGRESS')}>
            In Progress
          </Button>
        )}
        {r.status !== 'RESOLVED' && (
          <Button size="sm" variant="success" loading={updating === r.id}
            onClick={() => updateStatus(r.id, 'RESOLVED')}>
            Resolve
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Complaints</h2>
            <p className="text-sm text-slate-500">{total} total complaints</p>
          </div>
          <div className="flex gap-3">
            <Select options={[
              { value: '', label: 'All Types' },
              { value: 'RAGGING', label: 'Ragging' },
              { value: 'ROOM', label: 'Room' },
              { value: 'BATHROOM', label: 'Bathroom' },
              { value: 'FOOD', label: 'Food' },
              { value: 'MAINTENANCE', label: 'Maintenance' },
              { value: 'OTHER', label: 'Other' },
            ]} value={filterType} onChange={(e) => setFilterType(e.target.value)} />
            <Select options={[
              { value: '', label: 'All Status' },
              { value: 'OPEN', label: 'Open' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'RESOLVED', label: 'Resolved' },
            ]} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} />
          </div>
        </div>

        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={complaints} loading={loading} emptyMessage="No complaints found" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
