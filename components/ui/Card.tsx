import { cn } from '@/lib/utils';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export function Card({ className, children, hover, gradient, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-slate-100 bg-white p-6 shadow-sm',
        'dark:border-slate-800 dark:bg-slate-900',
        hover && 'card-hover cursor-pointer',
        gradient && 'gradient-card',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn('text-base font-semibold text-slate-800 dark:text-slate-100', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn(className)}>{children}</div>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'red' | 'purple';
  loading?: boolean;
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

export function StatCard({ title, value, subtitle, icon, trend, color = 'blue', loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-8 w-16 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
          <div className="skeleton h-12 w-12 rounded-xl" />
        </div>
      </Card>
    );
  }

  return (
    <Card hover className="slide-up">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <p className={cn('text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-rose-500')}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', colorMap[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
