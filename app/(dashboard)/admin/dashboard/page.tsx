'use client';
import { useEffect, useState } from 'react';
import { Users, BedDouble, IndianRupee, MessageSquareWarning, CalendarDays, UserCheck, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/Card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { studentsApi, roomsApi, feesApi, complaintsApi, leaveRequestsApi, visitorsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useHydrated } from '@/hooks/useHydrated';
import { useAuthStore } from '@/store/auth.store';

export default function AdminDashboard() {
  const hydrated = useHydrated();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0, rooms: 0, pendingFees: 0, complaints: 0,
    pendingLeaves: 0, activeVisitors: 0,
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;

    Promise.all([
      studentsApi.getAll({ limit: 5 }),
      roomsApi.getAllRooms(),
      feesApi.getAll({ payment_status: 'PENDING' }),
      complaintsApi.getAllComplaints({ limit: 5 }),
      leaveRequestsApi.getPending(),
      visitorsApi.getActive(),
    ]).then(([studRes, roomRes, feeRes, compRes, leaveRes, visitorRes]) => {
      setStats({
        students: studRes.data?.data?.total || 0,
        rooms: roomRes.data?.data?.rooms?.length || 0,
        pendingFees: feeRes.data?.data?.length || 0,
        complaints: compRes.data?.data?.total || 0,
        pendingLeaves: leaveRes.data?.data?.length || 0,
        activeVisitors: visitorRes.data?.data?.length || 0,
      });
      setRecentStudents(studRes.data?.data?.students || []);
      setRecentComplaints(compRes.data?.data?.complaints || []);
      setPendingLeaves(leaveRes.data?.data?.slice(0, 5) || []);
    }).catch((err) => {
      console.error('Failed to load dashboard data:', err.response?.data?.message || err.message);
    }).finally(() => setLoading(false));
  }, [hydrated, isAuthenticated]);

  const studentColumns = [
    { key: 'name', header: 'Name', render: (r: any) => r.name },
    { key: 'hall_ticket', header: 'Hall Ticket', render: (r: any) => r.hall_ticket_number },
    { key: 'dept', header: 'Department', render: (r: any) => r.department?.department_code },
    { key: 'sem', header: 'Semester', render: (r: any) => `Sem ${r.semester?.semester_number}` },
    { key: 'gender', header: 'Gender', render: (r: any) => <Badge variant="outline">{r.gender}</Badge> },
  ];

  const complaintColumns = [
    { key: 'student', header: 'Student', render: (r: any) => r.student?.name },
    { key: 'title', header: 'Title', render: (r: any) => (
      <span className="text-sm font-medium">{r.title}</span>
    )},
    { key: 'priority', header: 'Priority', render: (r: any) => (
      <Badge variant={r.priority === 'URGENT' ? 'danger' : r.priority === 'HIGH' ? 'warning' : 'outline'}>
        {r.priority}
      </Badge>
    )},
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={r.status === 'RESOLVED' ? 'success' : r.status === 'IN_PROGRESS' ? 'info' : 'warning'}>
        {r.status}
      </Badge>
    )},
  ];

  const leaveColumns = [
    { key: 'student', header: 'Student', render: (r: any) => r.student?.name },
    { key: 'dates', header: 'Period', render: (r: any) => `${formatDate(r.from_date)} → ${formatDate(r.to_date)}` },
    { key: 'reason', header: 'Reason', render: (r: any) => (
      <span className="text-xs text-slate-500 line-clamp-1 max-w-xs">{r.reason}</span>
    )},
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant="warning">{r.status}</Badge>
    )},
  ];

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h2>
          <p className="text-sm text-slate-500">System overview and quick stats</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Students" value={stats.students} icon={<Users className="h-6 w-6" />} color="blue" loading={loading} />
          <StatCard title="Rooms" value={stats.rooms} icon={<BedDouble className="h-6 w-6" />} color="indigo" loading={loading} />
          <StatCard title="Pending Fees" value={stats.pendingFees} icon={<IndianRupee className="h-6 w-6" />} color="amber" loading={loading} />
          <StatCard title="Complaints" value={stats.complaints} icon={<MessageSquareWarning className="h-6 w-6" />} color="red" loading={loading} />
          <StatCard title="Leave Requests" value={stats.pendingLeaves} icon={<CalendarDays className="h-6 w-6" />} color="purple" loading={loading} />
          <StatCard title="Visitors Inside" value={stats.activeVisitors} icon={<UserCheck className="h-6 w-6" />} color="emerald" loading={loading} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Recent Students</CardTitle></CardHeader>
            <CardContent className="-mx-6 -mb-6">
              <Table columns={studentColumns} data={recentStudents} loading={loading} emptyMessage="No students yet" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Complaints</CardTitle></CardHeader>
            <CardContent className="-mx-6 -mb-6">
              <Table columns={complaintColumns} data={recentComplaints} loading={loading} emptyMessage="No complaints yet" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Pending Leave Requests</CardTitle></CardHeader>
          <CardContent className="-mx-6 -mb-6">
            <Table columns={leaveColumns} data={pendingLeaves} loading={loading} emptyMessage="No pending leave requests" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
