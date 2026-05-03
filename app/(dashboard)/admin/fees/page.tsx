'use client';
import { useEffect, useState } from 'react';
import { Plus, IndianRupee, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { feesApi, studentsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const statusVariant: Record<string, any> = {
  PAID: 'success', PARTIAL: 'info', PENDING: 'warning', OVERDUE: 'danger',
};

export default function AdminFeesPage() {
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, overdue: 0 });
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      student_id: '',
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear()),
      room_rent: '5000', food_fee: '3000', electricity_fee: '500',
      water_fee: '200', maintenance_fee: '300', fine: '0',
      previous_due: '0', discount: '0',
    },
  });

  const fetchFees = () => {
    setLoading(true);
    const params: any = {};
    if (filterStatus) params.payment_status = filterStatus;
    feesApi.getAll(params)
      .then((res) => {
        const data = res.data?.data || [];
        setFees(data);
        setStats({
          total: data.length,
          paid: data.filter((f: any) => f.payment_status === 'PAID').length,
          pending: data.filter((f: any) => f.payment_status === 'PENDING').length,
          overdue: data.filter((f: any) => f.payment_status === 'OVERDUE').length,
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFees();
    studentsApi.getAll({ limit: 200 }).then((r) => setStudents(r.data?.data?.students || []));
  }, [filterStatus]);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const dueDate = new Date(Number(data.year), Number(data.month), 10);
      await feesApi.create({
        ...data,
        student_id: data.student_id,
        month: Number(data.month),
        year: Number(data.year),
        room_rent: Number(data.room_rent),
        food_fee: Number(data.food_fee),
        electricity_fee: Number(data.electricity_fee),
        water_fee: Number(data.water_fee),
        maintenance_fee: Number(data.maintenance_fee),
        fine: Number(data.fine),
        previous_due: Number(data.previous_due),
        discount: Number(data.discount),
        due_date: dueDate.toISOString(),
      });
      toast.success('Fee created successfully');
      reset();
      setShowModal(false);
      fetchFees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create fee');
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
    { key: 'period', header: 'Period', render: (r: any) => `${MONTH_NAMES[r.month]} ${r.year}` },
    { key: 'total', header: 'Total', render: (r: any) => (
      <span className="font-semibold">₹{Number(r.total_amount).toLocaleString()}</span>
    )},
    { key: 'paid', header: 'Paid', render: (r: any) => (
      <span className="text-emerald-600">₹{Number(r.paid_amount).toLocaleString()}</span>
    )},
    { key: 'balance', header: 'Balance', render: (r: any) => (
      <span className={Number(r.balance_amount) > 0 ? 'text-red-500 font-semibold' : 'text-slate-400'}>
        ₹{Number(r.balance_amount).toLocaleString()}
      </span>
    )},
    { key: 'due', header: 'Due Date', render: (r: any) => formatDate(r.due_date) },
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={statusVariant[r.payment_status] || 'outline'}>{r.payment_status}</Badge>
    )},
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1].map(y => ({ value: String(y), label: String(y) }));

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Fee Management</h2>
            <p className="text-sm text-slate-500">Track and manage student fees</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
            Create Fee
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total Fees" value={stats.total} icon={<IndianRupee className="h-6 w-6" />} color="blue" loading={loading} />
          <StatCard title="Paid" value={stats.paid} icon={<CheckCircle className="h-6 w-6" />} color="emerald" loading={loading} />
          <StatCard title="Pending" value={stats.pending} icon={<TrendingUp className="h-6 w-6" />} color="amber" loading={loading} />
          <StatCard title="Overdue" value={stats.overdue} icon={<AlertCircle className="h-6 w-6" />} color="red" loading={loading} />
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['', 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE'].map((s) => (
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
            <Table columns={columns} data={fees} loading={loading} emptyMessage="No fees found" />
          </CardContent>
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Fee" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Student" options={[
            { value: '', label: 'Select student...' },
            ...students.map((s) => ({ value: s.id, label: `${s.name} (${s.hall_ticket_number})` })),
          ]} error={errors.student_id?.message as string}
            {...register('student_id', { required: 'Required' })} />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Month" options={[{ value: '', label: 'Select...' }, ...MONTHS]}
              error={errors.month?.message as string}
              {...register('month', { required: 'Required' })} />
            <Select label="Year" options={[{ value: '', label: 'Select...' }, ...years]}
              error={errors.year?.message as string}
              {...register('year', { required: 'Required' })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Room Rent (₹)" type="number" {...register('room_rent', { required: 'Required' })} />
            <Input label="Food Fee (₹)" type="number" {...register('food_fee')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Electricity (₹)" type="number" {...register('electricity_fee')} />
            <Input label="Water (₹)" type="number" {...register('water_fee')} />
            <Input label="Maintenance (₹)" type="number" {...register('maintenance_fee')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Fine (₹)" type="number" {...register('fine')} />
            <Input label="Previous Due (₹)" type="number" {...register('previous_due')} />
            <Input label="Discount (₹)" type="number" {...register('discount')} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Create Fee</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
