'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { Bell, Send } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { notificationsApi } from '@/lib/api';

export default function AdminNotificationsPage() {
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onBroadcast = async (data: any) => {
    setSending(true);
    try {
      const res = await notificationsApi.broadcast({
        title: data.title,
        message: data.message,
        role: data.role || undefined,
      });
      toast.success(res.data?.message || 'Notification sent!');
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout requireAdmin>
      <Toaster position="top-right" />
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Notifications</h2>
          <p className="text-sm text-slate-500">Broadcast messages to students or all users</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Broadcast Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onBroadcast)} className="space-y-4">
              <Input
                label="Title"
                placeholder="Notification title"
                error={errors.title?.message as string}
                {...register('title', { required: 'Title is required' })}
              />
              <Textarea
                label="Message"
                placeholder="Write your message here..."
                rows={4}
                error={errors.message?.message as string}
                {...register('message', { required: 'Message is required' })}
              />
              <Select
                label="Target Audience"
                options={[
                  { value: '', label: 'All Users' },
                  { value: 'STUDENT', label: 'Students Only' },
                  { value: 'ADMIN', label: 'Admins Only' },
                ]}
                {...register('role')}
              />
              <Button type="submit" loading={sending} leftIcon={<Send className="h-4 w-4" />}>
                Send Notification
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Broadcast notifications are sent to all users matching the selected role. 
            Students will see them in their notification bell.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
