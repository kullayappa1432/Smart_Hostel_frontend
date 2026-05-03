'use client';
import { useState } from 'react';
import { BedDouble, IndianRupee, CalendarCheck, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/Card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { feesApi, notificationsApi, attendanceApi } from '@/lib/api';
import { roomsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useProtectedFetch } from '@/hooks/useProtectedFetch';
import { useAuthStore } from '@/store/auth.store';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [allocation, setAllocation] = useState<any>(null);
  const [feeSummary, setFeeSummary] = useState<any>(null);
  const [pendingFees, setPendingFees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const { isAuthenticated, user } = useAuthStore();

  useProtectedFetch(() => {
    // Only fetch student-specific data if the user is actually a STUDENT
    if (user?.role && user.role !== 'STUDENT') {
      setLoading(false);
      return;
    }

    Promise.all([
      roomsApi.getMyAllocation().catch(() => ({ data: { data: null } })),
      feesApi.getMySummary().catch(() => ({ data: { data: null } })),
      feesApi.getMyFees().catch(() => ({ data: { data: [] } })),
      attendanceApi.getMyAttendance().catch(() => ({ data: { data: { summary: {} } } })),
      notificationsApi.getMyNotifications().catch(() => ({ data: { data: { notifications: [], unreadCount: 0 } } })),
    ]).then(([allocRes, summaryRes, feesRes, attRes, notifRes]) => {
      setAllocation(allocRes.data?.data);
      setFeeSummary(summaryRes.data?.data);
      const allFees = feesRes.data?.data || [];
      setPendingFees(allFees.filter((f: any) => f.payment_status !== 'PAID').slice(0, 3));
      setAttendance(attRes.data?.data?.summary);
      setNotifications(notifRes.data?.data?.notifications?.slice(0, 5) || []);
    }).finally(() => setLoading(false));
  });

  const attendancePct = attendance?.percentage || '0%';
  const totalDue = feeSummary ? Number(feeSummary.total_due) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Dashboard</h2>
          <p className="text-sm text-slate-500">Overview of your hostel status</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="My Room"
            value={allocation?.room?.room_number || 'Not Allocated'}
            subtitle={allocation?.room?.hostel?.hostel_name || '—'}
            icon={<BedDouble className="h-6 w-6" />}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Fee Due"
            value={totalDue > 0 ? `₹${totalDue.toLocaleString()}` : 'All Clear'}
            subtitle={feeSummary ? `${feeSummary.pending_count} pending fee(s)` : '—'}
            icon={<IndianRupee className="h-6 w-6" />}
            color={totalDue > 0 ? 'amber' : 'emerald'}
            loading={loading}
          />
          <StatCard
            title="Attendance"
            value={attendancePct}
            subtitle={`${attendance?.present || 0} present / ${attendance?.total || 0} total`}
            icon={<CalendarCheck className="h-6 w-6" />}
            color="indigo"
            loading={loading}
          />
          <StatCard
            title="Notifications"
            value={notifications.filter((n) => !n.is_read).length}
            subtitle="Unread messages"
            icon={<Bell className="h-6 w-6" />}
            color="rose"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Room Info */}
          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton h-4 w-full rounded" />)}
                </div>
              ) : allocation ? (
                <div className="space-y-3">
                  {[
                    ['Room Number', allocation.room?.room_number],
                    ['Block', allocation.room?.block_name],
                    ['Floor', allocation.room?.floor_number],
                    ['Hostel', allocation.room?.hostel?.hostel_name],
                    ['Bed No', allocation.bed_no || '—'],
                    ['Check In', formatDate(allocation.check_in_date)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <BedDouble className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-sm text-slate-400">No room allocated yet</p>
                  <Link href="/rooms" className="mt-2 inline-block text-sm text-blue-500 hover:underline">
                    Browse available rooms →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Fees */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Status</CardTitle>
              <Link href="/fees" className="text-xs text-blue-500 hover:underline">View all →</Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="skeleton h-16 w-full rounded" />)}
                </div>
              ) : pendingFees.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-2 h-10 w-10 text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-600">All fees paid!</p>
                  <p className="text-xs text-slate-400 mt-1">No pending payments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingFees.map((fee) => (
                    <div key={fee.id} className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {MONTH_NAMES[fee.month]} {fee.year}
                        </p>
                        <p className="text-xs text-slate-500">Due: {formatDate(fee.due_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-red-600">
                          ₹{Number(fee.balance_amount).toLocaleString()}
                        </p>
                        <Badge variant="warning" className="text-xs">{fee.payment_status}</Badge>
                      </div>
                    </div>
                  ))}
                  <Link href="/fees">
                    <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white">
                      <IndianRupee className="h-4 w-4 mr-1" /> Pay Now
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 w-full rounded" />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-400">No notifications</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-slate-300' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
