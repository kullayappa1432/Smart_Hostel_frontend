'use client';
import { useEffect, useState } from 'react';
import { Plus, IndianRupee, UtensilsCrossed, Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { attenderApi, studentsApi } from '@/lib/api';

const EXPENSE_TYPES = [
  { value: 'FOOD', label: 'Food' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OTHER', label: 'Other' },
];

const typeVariant: Record<string, any> = {
  FOOD: 'success', MAINTENANCE: 'warning', OTHER: 'outline',
};

const today = new Date().toISOString().split('T')[0];
const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

export default function AttenderExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    defaultValues: { date: today, expense_type: 'FOOD', amount: '' },
  });

  const fetchExpenses = () => {
    setLoading(true);
    const params: any = { from_date: fromDate, to_date: toDate };
    if (filterType) params.expense_type = filterType;
    attenderApi.getExpenses(params)
      .then((res) => setExpenses(res.data?.data || []))
      .finally(() => setLoading(false));
  };

  const fetchMonthlySummary = () => {
    setLoading(true);
    attenderApi.getMonthlySummary(month, year)
      .then((res) => setMonthlySummary(res.data?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    studentsApi.getAll({ limit: 200 }).then((r) => setStudents(r.data?.data?.students || []));
  }, []);

  useEffect(() => {
    if (viewMode === 'daily') fetchExpenses();
    else fetchMonthlySummary();
  }, [viewMode, fromDate, toDate, filterType, month, year]);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await attenderApi.recordExpense({
        student_id: Number(data.student_id),
        expense_type: data.expense_type,
        amount: Number(data.amount),
        date: data.date,
        remarks: data.remarks,
      });
      toast.success('Expense recorded successfully');
      reset({ date: today, expense_type: 'FOOD', amount: '' });
      setShowModal(false);
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const totalToday = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const foodTotal = expenses.filter((e) => e.remarks?.includes('FOOD')).reduce((sum, e) => sum + Number(e.amount), 0);
  const maintenanceTotal = expenses.filter((e) => e.remarks?.includes('MAINTENANCE')).reduce((sum, e) => sum + Number(e.amount), 0);

  const dailyCols = [
    { key: 'student', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.student?.name}</p>
        <p className="text-xs text-slate-500">{r.student?.hall_ticket_number}</p>
      </div>
    )},
    { key: 'type', header: 'Type', render: (r: any) => {
      const type = r.remarks?.split(':')[0]?.trim() || 'OTHER';
      return <Badge variant={typeVariant[type] || 'outline'}>{type}</Badge>;
    }},
    { key: 'amount', header: 'Amount', render: (r: any) => (
      <span className="font-semibold text-slate-800 dark:text-slate-100">₹{Number(r.amount).toLocaleString()}</span>
    )},
    { key: 'date', header: 'Date', render: (r: any) => new Date(r.paid_on).toLocaleDateString('en-IN') },
    { key: 'remarks', header: 'Remarks', render: (r: any) => (
      <span className="text-xs text-slate-500">{r.remarks?.split(':').slice(1).join(':').trim() || '—'}</span>
    )},
  ];

  const monthlyCols = [
    { key: 'student', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.student?.name}</p>
        <p className="text-xs text-slate-500">{r.student?.hall_ticket_number}</p>
      </div>
    )},
    { key: 'food', header: 'Food Fee', render: (r: any) => `₹${r.food_fee.toLocaleString()}` },
    { key: 'maintenance', header: 'Maintenance', render: (r: any) => `₹${r.maintenance_fee.toLocaleString()}` },
    { key: 'total', header: 'Total', render: (r: any) => (
      <span className="font-semibold">₹{r.total_amount.toLocaleString()}</span>
    )},
    { key: 'paid', header: 'Paid', render: (r: any) => (
      <span className="text-emerald-600">₹{r.paid_amount.toLocaleString()}</span>
    )},
    { key: 'balance', header: 'Balance', render: (r: any) => (
      <span className={r.balance_amount > 0 ? 'text-red-500 font-semibold' : 'text-slate-400'}>
        ₹{r.balance_amount.toLocaleString()}
      </span>
    )},
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={r.payment_status === 'PAID' ? 'success' : 'warning'}>{r.payment_status}</Badge>
    )},
  ];

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <DashboardLayout requireAttender>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Expenses</h2>
            <p className="text-sm text-slate-500">Track food and maintenance expenses</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
            Record Expense
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          {(['daily', 'monthly'] as const).map((m) => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${viewMode === m ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}>
              {m} View
            </button>
          ))}
        </div>

        {viewMode === 'daily' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                {['', 'FOOD', 'MAINTENANCE', 'OTHER'].map((t) => (
                  <button key={t} onClick={() => setFilterType(t)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}>
                    {t || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard title="Total" value={`₹${totalToday.toLocaleString()}`} icon={<IndianRupee className="h-6 w-6" />} color="blue" loading={loading} />
              <StatCard title="Food" value={`₹${foodTotal.toLocaleString()}`} icon={<UtensilsCrossed className="h-6 w-6" />} color="emerald" loading={loading} />
              <StatCard title="Maintenance" value={`₹${maintenanceTotal.toLocaleString()}`} icon={<Wrench className="h-6 w-6" />} color="amber" loading={loading} />
            </div>

            <Card>
              <CardContent className="-mx-6 -mb-6">
                <Table columns={dailyCols} data={expenses} loading={loading} emptyMessage="No expenses found for this period" />
              </CardContent>
            </Card>
          </>
        )}

        {viewMode === 'monthly' && (
          <>
            {/* Month/Year selector */}
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Month</label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Summary — {MONTHS[month - 1]} {year}</CardTitle>
              </CardHeader>
              <CardContent className="-mx-6 -mb-6">
                <Table columns={monthlyCols} data={monthlySummary} loading={loading} emptyMessage="No data for this month" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Record Expense Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Expense" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Student" options={[
            { value: '', label: 'Select student...' },
            ...students.map((s) => ({ value: s.id, label: `${s.name} (${s.hall_ticket_number})` })),
          ]} error={errors.student_id?.message as string}
            {...register('student_id', { required: 'Required' })} />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Expense Type" options={[{ value: '', label: 'Select...' }, ...EXPENSE_TYPES]}
              error={errors.expense_type?.message as string}
              {...register('expense_type', { required: 'Required' })} />
            <Input label="Amount (₹)" type="number" placeholder="150"
              error={errors.amount?.message as string}
              {...register('amount', { required: 'Required', min: 1 })} />
          </div>

          <Input label="Date" type="date"
            error={errors.date?.message as string}
            {...register('date', { required: 'Required' })} />

          <Input label="Remarks (optional)" placeholder="Breakfast, dinner, plumbing..."
            {...register('remarks')} />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting}>Record</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
