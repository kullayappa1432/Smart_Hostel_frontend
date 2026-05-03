'use client';
import { useEffect, useState } from 'react';
import { Users, CalendarCheck, IndianRupee, AlertCircle, UserX, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard, Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { attenderApi, attendanceApi, studentsApi } from '@/lib/api';
import { useHydrated } from '@/hooks/useHydrated';
import { useAuthStore } from '@/store/auth.store';

const today = new Date().toISOString().split('T')[0];

export default function AttenderDashboard() {
  const hydrated = useHydrated();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    Promise.all([
      attenderApi.getDashboard(today),
      attenderApi.getTodayAttendance(today),
      attenderApi.getPendingPayments(),
    ]).then(([dashRes, attRes, pendRes]) => {
      setSummary(dashRes.data?.data || dashRes.data);
      setTodayAttendance(attRes.data?.data || []);
      setPendingPayments((pendRes.data?.data || []).slice(0, 5));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [hydrated, isAuthenticated]);

  const attendanceCols = [
    { key: 'name', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.student?.name}</p>
        <p className="text-xs text-slate-500">{r.student?.hall_ticket_number}</p>
      </div>
    )},
    { key: 'dept', header: 'Dept', render: (r: any) => r.student?.department?.department_code || '—' },
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={r.status === 'PRESENT' ? 'success' : r.status === 'LEAVE' ? 'info' : 'danger'}>
        {r.status}
      </Badge>
    )},
  ];

  const pendingCols = [
    { key: 'student', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.student?.name}</p>
        <p className="text-xs text-slate-500">{r.student?.hall_ticket_number}</p>
      </div>
    )},
    { key: 'period', header: 'Period', render: (r: any) => `${r.month}/${r.year}` },
    { key: 'balance', header: 'Balance', render: (r: any) => (
      <span className="font-semibold text-red-600">₹{Number(r.balance_amount).toLocaleString()}</span>
    )},
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant="warning">{r.payment_status}</Badge>
    )},
  ];

  return (
    <DashboardLayout requireAttender>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Attender Dashboard</h2>
          <p className="text-sm text-slate-500">Daily overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard title="Total Students" value={summary?.total_students ?? '—'} icon={<Users className="h-6 w-6" />} color="blue" loading={loading} />
          <StatCard title="Present Today" value={summary?.present_today ?? '—'} icon={<CheckCircle className="h-6 w-6" />} color="emerald" loading={loading} />
          <StatCard title="Absent Today" value={summary?.absent_today ?? '—'} icon={<UserX className="h-6 w-6" />} color="red" loading={loading} />
          <StatCard title="Food Cost Today" value={summary?.total_food_today ? `₹${summary.total_food_today}` : '₹0'} icon={<IndianRupee className="h-6 w-6" />} color="amber" loading={loading} />
          <StatCard title="Pending Fees" value={summary?.pending_payments ?? '—'} icon={<AlertCircle className="h-6 w-6" />} color="purple" loading={loading} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Today's Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <a href="/attender/attendance" className="text-xs text-blue-500 hover:underline">Mark attendance →</a>
            </CardHeader>
            <CardContent className="-mx-6 -mb-6">
              {todayAttendance.length === 0 && !loading ? (
                <div className="py-8 text-center">
                  <CalendarCheck className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-sm text-slate-400">No attendance marked yet today</p>
                  <a href="/attender/attendance" className="mt-2 inline-block text-sm text-blue-500 hover:underline">
                    Mark attendance now →
                  </a>
                </div>
              ) : (
                <Table columns={attendanceCols} data={todayAttendance.slice(0, 8)} loading={loading} emptyMessage="No attendance today" />
              )}
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <a href="/attender/payments" className="text-xs text-blue-500 hover:underline">View all →</a>
            </CardHeader>
            <CardContent className="-mx-6 -mb-6">
              <Table columns={pendingCols} data={pendingPayments} loading={loading} emptyMessage="No pending payments" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
