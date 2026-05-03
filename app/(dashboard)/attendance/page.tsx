'use client';
import { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { attendanceApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    attendanceApi.getMyAttendance()
      .then((res) => {
        setRecords(res.data?.data?.records || []);
        setSummary(res.data?.data?.summary || {});
      })
      .finally(() => setLoading(false));
  }, []);

  const pct = Number(summary.percentage?.replace('%', '') || 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Attendance</h2>
          <p className="text-sm text-slate-500">Your daily attendance record</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Days', value: summary.total || 0, color: 'text-slate-800 dark:text-slate-100' },
            { label: 'Present', value: summary.present || 0, color: 'text-emerald-600' },
            { label: 'Absent', value: summary.absent || 0, color: 'text-red-500' },
            { label: 'Percentage', value: summary.percentage || '0%', color: pct >= 75 ? 'text-emerald-600' : 'text-red-500' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="text-center">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
            </Card>
          ))}
        </div>

        {/* Progress bar */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Overall Attendance</span>
            <span className={cn('text-sm font-bold', pct >= 75 ? 'text-emerald-600' : 'text-red-500')}>
              {summary.percentage || '0%'}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className={cn('h-3 rounded-full transition-all duration-500', pct >= 75 ? 'bg-emerald-500' : 'bg-red-500')}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          {pct < 75 && (
            <p className="mt-2 text-xs text-red-500">⚠️ Attendance below 75% — please attend regularly</p>
          )}
        </Card>

        {/* Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>
          <CardContent className="-mx-6 -mb-6">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton h-10 rounded-xl" />
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarCheck className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-400">No attendance records yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {records.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{formatDate(r.date)}</span>
                    <Badge variant={r.status === 'PRESENT' ? 'success' : 'danger'}>
                      {r.status}
                    </Badge>
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
