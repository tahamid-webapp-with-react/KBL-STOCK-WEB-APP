/**
 * Global formatting utility for Potato Cold Storage Management System.
 * Strict Mandate: Wherever a numeric value is 0 (or null/empty), display '-' instead of '0'.
 */

export const formatNumberWithDash = (
  val: number | string | undefined | null,
  unit?: string
): string => {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return '-';
  return unit ? `${num.toLocaleString()} ${unit}` : num.toLocaleString();
};

export const formatBagsWithDash = (
  val: number | string | undefined | null
): string => {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return '-';
  return `${num.toLocaleString()} Bags`;
};

export const formatKgWithDash = (
  val: number | string | undefined | null
): string => {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return '-';
  return `${num.toLocaleString()} KG`;
};

export const formatMtWithDash = (
  val: number | string | undefined | null,
  decimals = 2
): string => {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return '-';
  return `${num.toFixed(decimals)} MT`;
};

export const formatCurrencyWithDash = (
  val: number | string | undefined | null,
  currency = '৳'
): string => {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return '-';
  return `${currency} ${num.toLocaleString()}`;
};

export const formatPercentWithDash = (
  val: number | string | undefined | null,
  decimals = 1
): string => {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return '-';
  return `${num.toFixed(decimals)}%`;
};
