'use client';
import { useEffect, useState } from 'react';
import { User, Mail, Phone, Hash, BookOpen, Building2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getProfile()
      .then((res) => setProfile(res.data?.data))
      .finally(() => setLoading(false));
  }, []);

  const data = profile || user;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Profile</h2>
          <p className="text-sm text-slate-500">Your account information</p>
        </div>

        {/* Avatar Card */}
        <Card className="text-center py-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
            {data ? getInitials(data.full_name) : '?'}
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{data?.full_name}</h3>
          <p className="text-sm text-slate-500">{data?.email}</p>
          <div className="mt-2">
            <Badge variant={data?.role === 'ADMIN' ? 'info' : 'success'}>{data?.role}</Badge>
          </div>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { icon: User, label: 'Full Name', value: data?.full_name },
                  { icon: Mail, label: 'Email', value: data?.email },
                  { icon: Phone, label: 'Phone', value: data?.phone || 'Not provided' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Info */}
        {data?.student && (
          <Card>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { icon: Hash, label: 'Hall Ticket', value: data.student.hall_ticket_number },
                  { icon: BookOpen, label: 'Course', value: data.student.course },
                  { icon: Building2, label: 'Department', value: data.student.department?.department_name },
                  { icon: User, label: 'Semester', value: `Semester ${data.student.semester?.semester_number} (${data.student.semester?.academic_year})` },
                  { icon: User, label: 'Gender', value: data.student.gender },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
