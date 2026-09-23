import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export interface SortIconProps {
  active?: boolean;
  direction?: 'asc' | 'desc';
  field?: string;
  currentField?: string;
  className?: string;
  size?: string;
}

/**
 * Standardized Table Header Sort Icon
 * Dynamically switches between:
 * - Inactive (ArrowUpDown with muted opacity, brightens on header hover)
 * - Ascending (ArrowUp with active theme accent color and bold stroke)
 * - Descending (ArrowDown with active theme accent color and bold stroke)
 */
export const SortIcon: React.FC<SortIconProps> = ({
  active,
  direction = 'asc',
  field,
  currentField,
  className = '',
  size = 'w-3.5 h-3.5',
}) => {
  const isActive = active !== undefined ? active : (Boolean(field) && field === currentField);

  if (!isActive) {
    return (
      <span
        className={`inline-flex items-center justify-center text-slate-400 dark:text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity shrink-0 select-none ${className}`}
        aria-hidden="true"
        title="Sort column"
      >
        <ArrowUpDown className={`${size} stroke-[1.75]`} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded px-0.5 py-0.5 bg-sky-100/70 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold shrink-0 shadow-2xs select-none transition-all ${className}`}
      aria-hidden="true"
      title={direction === 'asc' ? 'Sorted ascending' : 'Sorted descending'}
    >
      {direction === 'asc' ? (
        <ArrowUp className={`${size} stroke-[2.5] animate-in fade-in zoom-in-75 duration-150`} />
      ) : (
        <ArrowDown className={`${size} stroke-[2.5] animate-in fade-in zoom-in-75 duration-150`} />
      )}
    </span>
  );
};
