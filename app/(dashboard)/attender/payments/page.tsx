'use client';
import { useEffect, useState } from 'react';
import { AlertCircle, IndianRupee, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { attenderApi } from '@/lib/api';

const statusVariant: Record<string, any> = {
  PAID: 'success', PARTIAL: 'info', PENDING: 'warning', OVERDUE: 'danger',
};

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AttenderPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [pendingFees, setPendingFees] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    attenderApi.getPendingPayments()
      .then((res) => setPendingFees(res.data?.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? pendingFees.filter((f) =>
        f.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.student?.hall_ticket_number?.toLowerCase().includes(search.toLowerCase())
      )
    : pendingFees;

  const totalPending = filtered.reduce((sum, f) => sum + Number(f.balance_amount), 0);
  const overdueCount = filtered.filter((f) => f.payment_status === 'OVERDUE').length;
  const pendingCount = filtered.filter((f) => f.payment_status === 'PENDING').length;

  const columns = [
    { key: 'student', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.student?.name}</p>
        <p className="text-xs text-slate-500">{r.student?.hall_ticket_number}</p>
        {r.student?.phone && <p className="text-xs text-slate-400">{r.student.phone}</p>}
      </div>
    )},
    { key: 'period', header: 'Period', render: (r: any) => `${MONTH_NAMES[r.month]} ${r.year}` },
    { key: 'total', header: 'Total', render: (r: any) => `₹${Number(r.total_amount).toLocaleString()}` },
    { key: 'paid', header: 'Paid', render: (r: any) => (
      <span className="text-emerald-600">₹{Number(r.paid_amount).toLocaleString()}</span>
    )},
    { key: 'balance', header: 'Balance Due', render: (r: any) => (
      <span className="font-bold text-red-600">₹{Number(r.balance_amount).toLocaleString()}</span>
    )},
    { key: 'due_date', header: 'Due Date', render: (r: any) => (
      <span className={new Date(r.due_date) < new Date() ? 'text-red-500 font-medium' : 'text-slate-600 dark:text-slate-400'}>
        {new Date(r.due_date).toLocaleDateString('en-IN')}
      </span>
    )},
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={statusVariant[r.payment_status] || 'outline'}>{r.payment_status}</Badge>
    )},
  ];

  return (
    <DashboardLayout requireAttender>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pending Payments</h2>
          <p className="text-sm text-slate-500">Students with outstanding fee balances</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Pending" value={`₹${totalPending.toLocaleString()}`} icon={<IndianRupee className="h-6 w-6" />} color="red" loading={loading} />
          <StatCard title="Pending Count" value={pendingCount} icon={<AlertCircle className="h-6 w-6" />} color="amber" loading={loading} />
          <StatCard title="Overdue" value={overdueCount} icon={<AlertCircle className="h-6 w-6" />} color="red" loading={loading} />
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
          <CardHeader>
            <CardTitle>Pending Fee Records ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={filtered} loading={loading} emptyMessage="No pending payments — all fees are cleared!" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
