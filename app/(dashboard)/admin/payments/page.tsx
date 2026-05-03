'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { paymentsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: any = { limit: 50 };
    if (filterStatus) params.status = filterStatus;
    paymentsApi.getAllPayments(params)
      .then((res) => {
        setPayments(res.data?.data?.payments || []);
        setTotal(res.data?.data?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [filterStatus]);

  const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);

  const columns = [
    { key: 'student', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium">{r.student?.name}</p>
        <p className="text-xs text-slate-400">{r.student?.hall_ticket_number}</p>
      </div>
    )},
    { key: 'semester', header: 'Semester', render: (r: any) => `Sem ${r.semester?.semester_number}` },
    { key: 'amount', header: 'Amount', render: (r: any) => formatCurrency(Number(r.amount)) },
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={r.status === 'PAID' ? 'success' : 'warning'}>{r.status}</Badge>
    )},
    { key: 'date', header: 'Date', render: (r: any) => r.payment_date ? formatDate(r.payment_date) : '—' },
    { key: 'razorpay', header: 'Payment ID', render: (r: any) => (
      <span className="text-xs text-slate-400 font-mono">{r.razorpay_payment_id || '—'}</span>
    )},
  ];

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Payments</h2>
            <p className="text-sm text-slate-500">{total} total · {formatCurrency(totalPaid)} collected</p>
          </div>
          <Select options={[
            { value: '', label: 'All Status' },
            { value: 'PAID', label: 'Paid' },
            { value: 'PENDING', label: 'Pending' },
          ]} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} />
        </div>

        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={payments} loading={loading} emptyMessage="No payments found" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
