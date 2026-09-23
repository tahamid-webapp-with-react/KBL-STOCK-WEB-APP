import React from 'react';

interface SkeletonProps {
  className?: string;
}

/**
 * Base atomic skeleton block with smooth wave pulse
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 rounded ${className}`}
    />
  );
};

/**
 * Skeleton loader simulating an executive summary table
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
      {/* Table Header Bar */}
      <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <Skeleton className="w-48 h-4 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-16 h-7 rounded-lg" />
          <Skeleton className="w-16 h-7 rounded-lg" />
          <Skeleton className="w-16 h-7 rounded-lg" />
        </div>
      </div>

      {/* Table Column Headers */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 px-4 py-2 flex items-center gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-3.5 rounded ${
              i === 0 ? 'w-1/4' : i === 1 ? 'w-1/5' : 'w-16 ml-auto'
            }`}
          />
        ))}
      </div>

      {/* Table Data Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="px-4 py-2.5 flex items-center gap-4 bg-slate-50/20 dark:bg-slate-900/40"
          >
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-4 w-1/5 rounded" />
            <Skeleton className="h-4 w-16 ml-auto rounded" />
            <Skeleton className="h-4 w-16 ml-auto rounded" />
            <Skeleton className="h-4 w-16 ml-auto rounded" />
            <Skeleton className="h-4 w-16 ml-auto rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Full Dashboard Skeleton Loader
 * Providing rich visual feedback while stock data loads from the backend
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Title Bar Skeleton */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-5 bg-sky-600/60 rounded-sm animate-pulse" />
          <Skeleton className="w-32 h-5 rounded" />
        </div>
        <Skeleton className="w-24 h-4 rounded" />
      </div>

      {/* Top Cold Storage Summary Table Skeleton */}
      <TableSkeleton rows={4} columns={5} />

      {/* Bottom Live Stock Details Matrix Skeleton */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-7 h-7 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="w-56 h-4 rounded" />
              <Skeleton className="w-36 h-3 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-52 h-8 rounded-xl" />
            <Skeleton className="w-16 h-8 rounded-xl" />
            <Skeleton className="w-8 h-8 rounded-xl" />
            <Skeleton className="w-8 h-8 rounded-xl" />
          </div>
        </div>

        {/* Matrix Rows Skeleton */}
        <div className="p-4 space-y-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-7 w-1/4 rounded-lg" />
              <Skeleton className="h-7 w-1/6 rounded-lg" />
              <Skeleton className="h-7 w-1/6 rounded-lg" />
              <Skeleton className="h-7 w-1/6 rounded-lg" />
              <Skeleton className="h-7 w-1/6 rounded-lg" />
              <Skeleton className="h-7 w-1/6 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Global Skeleton Loader Component
 * Replaces generic spinners with modern shimmering skeleton placeholders
 */
export const GlobalSkeletonLoader: React.FC<{
  type?: 'dashboard' | 'table' | 'cards';
  message?: string;
}> = ({ type = 'dashboard', message = 'Fetching stock inventory data...' }) => {
  return (
    <div className="w-full space-y-3" role="status" aria-label="Loading stock data">
      {/* Subtle status pulse tag */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/50 rounded-lg text-sky-800 dark:text-sky-300 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
          <span>{message}</span>
        </div>
        <span className="text-[11px] text-sky-600/80 dark:text-sky-400/80 font-mono">Syncing...</span>
      </div>

      {/* Render matching skeleton structure */}
      {type === 'table' ? <TableSkeleton rows={6} /> : <DashboardSkeleton />}
    </div>
  );
};
