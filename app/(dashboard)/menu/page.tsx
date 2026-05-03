'use client';
import { useEffect, useState } from 'react';
import { UtensilsCrossed, Coffee, Sun, Moon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { menuApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function MenuPage() {
  const [loading, setLoading] = useState(true);
  const [todayMenu, setTodayMenu] = useState<any>(null);
  const [weekMenus, setWeekMenus] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 3);
    const to = new Date(today);
    to.setDate(today.getDate() + 3);

    Promise.all([
      menuApi.getTodayMenu().catch(() => ({ data: { data: null } })),
      menuApi.getAllMenus({
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      }).catch(() => ({ data: { data: [] } })),
    ]).then(([todayRes, weekRes]) => {
      setTodayMenu(todayRes.data?.data);
      setWeekMenus(weekRes.data?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const meals = todayMenu ? [
    { label: "Breakfast", icon: Coffee, value: todayMenu.breakfast, color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' },
    { label: "Lunch", icon: Sun, value: todayMenu.lunch, color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' },
    { label: "Dinner", icon: Moon, value: todayMenu.dinner, color: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800' },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Daily Menu</h2>
          <p className="text-sm text-slate-500">Today's hostel meal schedule</p>
        </div>

        {/* Today's Menu */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
            Today — {formatDate(new Date())}
          </h3>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
            </div>
          ) : !todayMenu ? (
            <Card className="py-12 text-center">
              <UtensilsCrossed className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">No menu available for today</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {meals.map(({ label, icon: Icon, value, color }) => (
                <div key={label} className={`rounded-2xl border p-5 ${color}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Menu */}
        {weekMenus.length > 1 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-400">This Week</h3>
            <div className="space-y-3">
              {weekMenus.map((menu) => (
                <Card key={menu.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(menu.date)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs text-slate-500">
                    <div><span className="font-medium text-slate-600 dark:text-slate-400">Breakfast:</span> {menu.breakfast}</div>
                    <div><span className="font-medium text-slate-600 dark:text-slate-400">Lunch:</span> {menu.lunch}</div>
                    <div><span className="font-medium text-slate-600 dark:text-slate-400">Dinner:</span> {menu.dinner}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
