'use client';
import { useEffect, useState, useCallback } from 'react';
import { IndianRupee, AlertCircle, CheckCircle, Clock, CreditCard, Zap } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { feesApi, feePaymentsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const statusVariant: Record<string, any> = {
  PAID: 'success', PARTIAL: 'info', PENDING: 'warning', OVERDUE: 'danger',
};

// Load Razorpay script dynamically
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function StudentFeesPage() {
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    Promise.all([feesApi.getMyFees(), feesApi.getMySummary()])
      .then(([feesRes, summaryRes]) => {
        setFees(feesRes.data?.data || []);
        setSummary(summaryRes.data?.data || null);
      })
      .catch(() => toast.error('Failed to load fee data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePayNow = async (fee: any) => {
    setPayingFeeId(fee.id);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet connection.');
        return;
      }

      // Create Razorpay order from backend
      const orderRes = await feePaymentsApi.createOrder(fee.id.toString());
      const order = orderRes.data?.data || orderRes.data;

      // If Razorpay keys aren't configured, show a helpful message
      if (order.is_mock) {
        toast.error(
          'Razorpay keys not configured. Add your test keys to backend .env to enable payments.',
          { duration: 6000 }
        );
        return;
      }

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'SmartHostel Management',
        description: `Fee for ${MONTH_NAMES[fee.month]} ${fee.year}`,
        image: '/logo.png',
        order_id: order.order_id,
        prefill: {
          name: order.student_name,
          email: order.student_email,
          contact: order.student_phone,
        },
        theme: { color: '#3B82F6' },
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            await feePaymentsApi.verifyPayment({
              fee_id: order.fee_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! 🎉');
            fetchData(); // Refresh fees
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: 'ℹ️' });
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setPayingFeeId(null);
    }
  };

  const pendingFees = fees.filter((f) => f.payment_status !== 'PAID');

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Fees</h2>
          <p className="text-sm text-slate-500">View your fee details and pay online</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <IndianRupee className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Amount</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    ₹{Number(summary.total_amount).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Paid</p>
                  <p className="text-lg font-bold text-emerald-600">
                    ₹{Number(summary.total_paid).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Due</p>
                  <p className="text-lg font-bold text-red-600">
                    ₹{Number(summary.total_due).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pending</p>
                  <p className="text-lg font-bold text-amber-600">
                    {summary.pending_count} fee{summary.pending_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Pending Fees — Pay Now Cards */}
        {!loading && pendingFees.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Pending Payments
            </h3>
            {pendingFees.map((fee) => (
              <Card key={fee.id} className="border-l-4 border-l-amber-400">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Period & Status */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {MONTH_NAMES[fee.month]} {fee.year}
                      </span>
                      <Badge variant={statusVariant[fee.payment_status] || 'outline'}>
                        {fee.payment_status}
                      </Badge>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500">
                      {[
                        { label: 'Room Rent', val: fee.room_rent },
                        { label: 'Food', val: fee.food_fee },
                        { label: 'Electricity', val: fee.electricity_fee },
                        { label: 'Water', val: fee.water_fee },
                        { label: 'Maintenance', val: fee.maintenance_fee },
                        { label: 'Fine', val: fee.fine },
                        { label: 'Prev. Due', val: fee.previous_due },
                        { label: 'Discount', val: fee.discount, negative: true },
                      ].filter(({ val }) => Number(val) > 0).map(({ label, val, negative }) => (
                        <div key={label} className="flex justify-between bg-slate-50 dark:bg-slate-800 rounded px-2 py-1">
                          <span>{label}</span>
                          <span className={negative ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}>
                            {negative ? '-' : ''}₹{Number(val).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amount & Pay Button */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="text-right">
                      {Number(fee.paid_amount) > 0 && (
                        <p className="text-xs text-slate-400">
                          Paid: <span className="text-emerald-600">₹{Number(fee.paid_amount).toLocaleString()}</span>
                        </p>
                      )}
                      <p className="text-xs text-slate-500">Balance Due</p>
                      <p className="text-2xl font-bold text-red-600">
                        ₹{Number(fee.balance_amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">Due: {formatDate(fee.due_date)}</p>
                    </div>
                    <Button
                      onClick={() => handlePayNow(fee)}
                      loading={payingFeeId === fee.id.toString()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Pay ₹{Number(fee.balance_amount).toLocaleString()} Now
                    </Button>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> Secured by Razorpay
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* All Fees History Table */}
        <Card>
          <CardHeader><CardTitle>Fee History</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
              </div>
            ) : fees.length === 0 ? (
              <div className="py-10 text-center">
                <IndianRupee className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-400">No fee records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      {['Period', 'Total', 'Paid', 'Balance', 'Due Date', 'Status', ''].map((h) => (
                        <th key={h} className="pb-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide pr-4">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {fees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-100">
                          {MONTH_NAMES[fee.month]} {fee.year}
                        </td>
                        <td className="py-3 pr-4">₹{Number(fee.total_amount).toLocaleString()}</td>
                        <td className="py-3 pr-4 text-emerald-600">₹{Number(fee.paid_amount).toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <span className={Number(fee.balance_amount) > 0 ? 'text-red-500 font-semibold' : 'text-slate-400'}>
                            ₹{Number(fee.balance_amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">{formatDate(fee.due_date)}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusVariant[fee.payment_status] || 'outline'}>
                            {fee.payment_status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {fee.payment_status !== 'PAID' && (
                            <Button
                              size="sm"
                              onClick={() => handlePayNow(fee)}
                              loading={payingFeeId === fee.id.toString()}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5"
                            >
                              Pay Now
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
