'use client';
import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { paymentsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

declare global {
  interface Window { Razorpay: any; }
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [paying, setPaying] = useState(false);

  const fetchPayments = () => {
    paymentsApi.getMyPayments()
      .then((res) => setPayments(res.data?.data || []))
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, []);

  const handlePayNow = async (payment: any) => {
    setPaying(true);
    try {
      const orderRes = await paymentsApi.createOrder({
        semester_id: Number(payment.semester_id),
        amount: Number(payment.amount),
      });
      const { order_id, amount, currency, key_id } = orderRes.data.data;

      // Load Razorpay script
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.body.appendChild(script);
        await new Promise((r) => (script.onload = r));
      }

      const rzp = new window.Razorpay({
        key: key_id,
        amount,
        currency,
        order_id,
        name: 'SmartHostel',
        description: 'Hostel Fee Payment',
        handler: async (response: any) => {
          try {
            await paymentsApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! 🎉');
            fetchPayments();
          } catch {
            toast.error('Payment verification failed');
          }
        },
        theme: { color: '#3b82f6' },
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setPaying(false);
    }
  };

  const columns = [
    {
      key: 'semester',
      header: 'Semester',
      render: (row: any) => `Sem ${row.semester?.semester_number} (${row.semester?.academic_year})`,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: any) => formatCurrency(Number(row.amount)),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <Badge variant={row.status === 'PAID' ? 'success' : 'warning'}>
          {row.status === 'PAID' ? (
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Paid</span>
          ) : (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>
          )}
        </Badge>
      ),
    },
    {
      key: 'payment_date',
      header: 'Date',
      render: (row: any) => row.payment_date ? formatDate(row.payment_date) : '—',
    },
    {
      key: 'action',
      header: '',
      render: (row: any) =>
        row.status === 'PENDING' ? (
          <Button size="sm" onClick={() => handlePayNow(row)} loading={paying}>
            Pay Now
          </Button>
        ) : null,
    },
  ];

  const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Payments</h2>
          <p className="text-sm text-slate-500">Your hostel fee payment history</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Paid', value: formatCurrency(totalPaid), color: 'text-emerald-600' },
            { label: 'Pending', value: formatCurrency(totalPending), color: 'text-amber-600' },
            { label: 'Transactions', value: payments.length, color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <p className="text-sm text-slate-500">{label}</p>
              <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={payments} loading={loading} emptyMessage="No payment records found" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
