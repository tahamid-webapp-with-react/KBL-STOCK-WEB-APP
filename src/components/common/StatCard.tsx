import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  unit?: string;
  metricBags?: number;
  metricKg?: number;
  metricMt?: number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  colorScheme?: 'primary' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose';
  onClick?: () => void;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  unit,
  metricBags,
  metricKg,
  metricMt,
  icon: Icon,
  trend,
  colorScheme = 'primary',
  onClick,
  badge,
}) => {
  const colorStyles = {
    primary: {
      border: 'hover:border-sky-500/40',
      iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
      badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    },
    blue: {
      border: 'hover:border-blue-500/40',
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
      badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    },
    rose: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
      badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    },
  }[colorScheme];

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs transition-all duration-200 ${
        onClick ? `cursor-pointer hover:shadow-md ${colorStyles.border}` : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
            {title}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {typeof value === 'number'
                ? value === 0
                  ? '-'
                  : value.toLocaleString()
                : value === '0'
                ? '-'
                : value}
            </span>
            {unit && value !== 0 && value !== '0' && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`p-2.5 rounded-lg ${colorStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          {badge && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colorStyles.badgeBg}`}
            >
              {badge}
            </span>
          )}
        </div>
      </div>

      {(metricBags !== undefined || metricKg !== undefined || metricMt !== undefined) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
          {metricBags !== undefined && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-md">
              <div className="text-[10px] text-slate-400 font-medium">Bags</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {metricBags === 0 ? '-' : metricBags.toLocaleString()}
              </div>
            </div>
          )}
          {metricKg !== undefined && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-md">
              <div className="text-[10px] text-slate-400 font-medium">Total KG</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {metricKg === 0
                  ? '-'
                  : metricKg >= 1000
                  ? `${(metricKg / 1000).toFixed(1)}k`
                  : metricKg.toLocaleString()}
              </div>
            </div>
          )}
          {metricMt !== undefined && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-md">
              <div className="text-[10px] text-slate-400 font-medium">Total MT</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {metricMt === 0 ? '-' : metricMt.toFixed(1)}
              </div>
            </div>
          )}
        </div>
      )}

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
};
