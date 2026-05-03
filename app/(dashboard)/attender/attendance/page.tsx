'use client';
import { useEffect, useState, useCallback } from 'react';
import { CalendarCheck, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { attendanceApi, studentsApi, semestersApi } from '@/lib/api';

type AttStatus = 'PRESENT' | 'ABSENT' | 'LEAVE';

const statusVariant: Record<AttStatus, any> = {
  PRESENT: 'success', ABSENT: 'danger', LEAVE: 'info',
};

export default function AttenderAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<string>('');
  const [semesters, setSemesters] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttStatus>>({});
  const [existingRecords, setExistingRecords] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'mark' | 'history'>('mark');
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    semestersApi.getAll().then((r) => {
      const sems = r.data?.data || [];
      setSemesters(sems);
      const active = sems.find((s: any) => s.is_active);
      if (active) setActiveSemesterId(String(active.id));
    });
  }, []);

  const fetchStudents = useCallback(() => {
    if (!activeSemesterId) return;
    setLoading(true);
    studentsApi.getAll({ limit: 200, semesterId: activeSemesterId })
      .then((res) => {
        const list = res.data?.data?.students || [];
        setStudents(list);
        // Pre-fill attendance state
        const init: Record<string, AttStatus> = {};
        list.forEach((s: any) => { init[s.id] = 'PRESENT'; });
        setAttendance(init);
      })
      .finally(() => setLoading(false));
  }, [activeSemesterId]);

  const fetchExisting = useCallback(() => {
    if (!activeSemesterId) return;
    attendanceApi.getAllAttendance({ semester_id: activeSemesterId, from_date: date, to_date: date })
      .then((res) => {
        const records = res.data?.data || [];
        setExistingRecords(records);
        // Override attendance state with existing records
        const overrides: Record<string, AttStatus> = {};
        records.forEach((r: any) => { overrides[r.student_id] = r.status; });
        setAttendance((prev) => ({ ...prev, ...overrides }));
      });
  }, [activeSemesterId, date]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchExisting(); }, [fetchExisting]);

  const fetchHistory = () => {
    setHistoryLoading(true);
    attendanceApi.getAllAttendance({ semester_id: activeSemesterId ? Number(activeSemesterId) : undefined })
      .then((res) => setHistoryRecords(res.data?.data || []))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    if (viewMode === 'history') fetchHistory();
  }, [viewMode, activeSemesterId]);

  const toggleStatus = (studentId: string) => {
    setAttendance((prev) => {
      const current = prev[studentId] || 'PRESENT';
      const next: AttStatus = current === 'PRESENT' ? 'ABSENT' : current === 'ABSENT' ? 'LEAVE' : 'PRESENT';
      return { ...prev, [studentId]: next };
    });
  };

  const saveAttendance = async () => {
    if (!activeSemesterId || students.length === 0) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({
        student_id: Number(s.id),
        semester_id: Number(activeSemesterId),
        date,
        status: attendance[s.id] || 'PRESENT',
      }));
      await attendanceApi.markBulk(records);
      toast.success(`Attendance saved for ${records.length} students`);
      fetchExisting();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'ABSENT').length;
  const leaveCount = Object.values(attendance).filter((s) => s === 'LEAVE').length;

  const historyCols = [
    { key: 'student', header: 'Student', render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.student?.name}</p>
        <p className="text-xs text-slate-500">{r.student?.hall_ticket_number}</p>
      </div>
    )},
    { key: 'date', header: 'Date', render: (r: any) => new Date(r.date).toLocaleDateString('en-IN') },
    { key: 'status', header: 'Status', render: (r: any) => (
      <Badge variant={statusVariant[r.status as AttStatus] || 'outline'}>{r.status}</Badge>
    )},
    { key: 'remarks', header: 'Remarks', render: (r: any) => r.remarks || '—' },
  ];

  return (
    <DashboardLayout requireAttender>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Attendance</h2>
            <p className="text-sm text-slate-500">Mark and view student attendance</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('mark')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === 'mark' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}>
              Mark Attendance
            </button>
            <button onClick={() => setViewMode('history')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === 'history' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}>
              History
            </button>
          </div>
        </div>

        {viewMode === 'mark' && (
          <>
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Semester</label>
                <select value={activeSemesterId} onChange={(e) => setActiveSemesterId(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select semester</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>Sem {s.semester_number} ({s.academic_year})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard title="Present" value={presentCount} icon={<CheckCircle className="h-6 w-6" />} color="emerald" loading={loading} />
              <StatCard title="Absent" value={absentCount} icon={<XCircle className="h-6 w-6" />} color="red" loading={loading} />
              <StatCard title="On Leave" value={leaveCount} icon={<Clock className="h-6 w-6" />} color="amber" loading={loading} />
            </div>

            {/* Attendance Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Students — Click to toggle status</CardTitle>
                <div className="flex gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Present</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Absent</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Leave</span>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-10 text-center">
                    <CalendarCheck className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">Select a semester to load students</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {students.map((s) => {
                      const status = attendance[s.id] || 'PRESENT';
                      const colors: Record<AttStatus, string> = {
                        PRESENT: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20',
                        ABSENT: 'border-red-300 bg-red-50 dark:bg-red-900/20',
                        LEAVE: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20',
                      };
                      const dotColors: Record<AttStatus, string> = {
                        PRESENT: 'bg-emerald-500', ABSENT: 'bg-red-500', LEAVE: 'bg-blue-500',
                      };
                      return (
                        <button key={s.id} onClick={() => toggleStatus(String(s.id))}
                          className={`text-left p-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${colors[status]}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${dotColors[status]}`} />
                            <span className="text-xs font-medium text-slate-500">{status}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                          <p className="text-xs text-slate-500 truncate">{s.hall_ticket_number}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {students.length > 0 && (
              <div className="flex justify-end">
                <Button onClick={saveAttendance} loading={saving} className="px-8">
                  Save Attendance ({students.length} students)
                </Button>
              </div>
            )}
          </>
        )}

        {viewMode === 'history' && (
          <Card>
            <CardHeader><CardTitle>Attendance History</CardTitle></CardHeader>
            <CardContent className="-mx-6 -mb-6">
              <Table columns={historyCols} data={historyRecords} loading={historyLoading} emptyMessage="No attendance records found" />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
