'use client';
import { useEffect, useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { feePaymentsApi, feesApi, studentsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CHEQUE', 'RAZORPAY'];

const methodVariant: Record<string, any> = {
  CASH: 'outline', UPI: 'info', CARD: 'info', NET_BANKING: 'info',
  CHEQUE: 'warning', RAZORPAY: 'success',
};

export default function AdminFeePaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const watchStudent = watch('student_id');

  const fetchPayments = () => {
    setLoading(true);
    feePaymentsApi.getAll()
      .then((res) => setPayments(res.data?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, []);

  useEffect(() => {
    studentsApi.getAll({ limit: 200 }).then((r) => setStudents(r.data?.data?.students || []));
  }, []);

  useEffect(() => {
    if (watchStudent) {
      feesApi.getPending(watchStudent)
        .then((r) => setFees(r.data?.data || []))
        .catch(() => setFees([]));
    }
  }, [watchStudent]);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await feePaymentsApi.create({
        ...data,
        amount: Number(data.amount),
      });
      toast.success('Payment recorded successfully');
      reset();
      setShowModal(false);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'student', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.student?.name}</p>
        <p className="text-xs text-slate-500">{r.student?.hall_ticket_number}</p>
      </div>
    )},
    { key: 'fee', header: 'Fee Period', render: (r: any) => r.fee ? `${r.fee.month}/${r.fee.year}` : '—' },
    { key: 'amount', header: 'Amount', render: (r: any) => (
      <span className="font-semibold text-emerald-600">₹{Number(r.amount).toLocaleString()}</span>
    )},
    { key: 'method', header: 'Method', render: (r: any) => (
      <Badge variant={methodVariant[r.payment_method] || 'outline'}>{r.payment_method}</Badge>
    )},
    { key: 'txn', header: 'Transaction ID', render: (r: any) => (
      <span className="text-xs font-mono text-slate-500">{r.transaction_id || '—'}</span>
    )},
    { key: 'date', header: 'Paid On', render: (r: any) => formatDate(r.paid_on) },
    { key: 'remarks', header: 'Remarks', render: (r: any) => (
      <span className="text-xs text-slate-500">{r.remarks || '—'}</span>
    )},
  ];

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Fee Payments</h2>
            <p className="text-sm text-slate-500">{payments.length} total payment records</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
            Record Payment
          </Button>
        </div>

        <Card>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={columns} data={payments} loading={loading} emptyMessage="No payments found" />
          </CardContent>
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Payment" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Student" options={[
            { value: '', label: 'Select student...' },
            ...students.map((s) => ({ value: s.id, label: `${s.name} (${s.hall_ticket_number})` })),
          ]} error={errors.student_id?.message as string}
            {...register('student_id', { required: 'Required' })} />

          <Select label="Fee (Pending)" options={[
            { value: '', label: fees.length ? 'Select fee...' : 'No pending fees' },
            ...fees.map((f: any) => ({
              value: f.id,
              label: `${f.month}/${f.year} — Balance: ₹${Number(f.balance_amount).toLocaleString()}`,
            })),
          ]} error={errors.fee_id?.message as string}
            {...register('fee_id', { required: 'Required' })} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount (₹)" type="number" placeholder="5000"
              error={errors.amount?.message as string}
              {...register('amount', { required: 'Required', min: 1 })} />
            <Select label="Payment Method" options={[
              { value: '', label: 'Select...' },
              ...PAYMENT_METHODS.map((m) => ({ value: m, label: m.replace('_', ' ') })),
            ]} error={errors.payment_method?.message as string}
              {...register('payment_method', { required: 'Required' })} />
          </div>

          <Input label="Transaction ID" placeholder="UPI/Cheque/Reference number"
            {...register('transaction_id')} />
          <Input label="Remarks" placeholder="Optional notes"
            {...register('remarks')} />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Record Payment</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
