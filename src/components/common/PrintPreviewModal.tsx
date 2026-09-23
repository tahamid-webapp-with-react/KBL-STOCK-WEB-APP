import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExportColumn, exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';
import { Printer, Download, FileSpreadsheet, X } from 'lucide-react';

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  subtitle?: string;
  voucherNo?: string;
  date?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  summaryItems?: { label: string; value: string | number }[];
  signatures?: string[];
  filename?: string;
  orientation?: 'p' | 'l';
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  subtitle,
  voucherNo,
  date,
  columns,
  data,
  summaryItems = [],
  signatures = ['Prepared By', 'Verified By (Store In-Charge)', 'Approved Signatory'],
  filename,
  orientation = 'l',
}) => {
  const { companySettings, currentUser, addToast } = useApp();
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const resolvedFilename = filename || (documentTitle ? String(documentTitle).replace(/\s+/g, '_') : 'Report_Document');
  const printTimestamp = `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

  const handlePrint = () => {
    validateAndTriggerPrint({
      data,
      reportTitle: documentTitle,
      expectedMinRecords: 1,
      onValidating: () => setIsValidating(true),
      databaseCheck: () => {
        if (!data || data.length === 0) {
          return { isConsistent: false, reason: 'Report dataset is empty.' };
        }
        return { isConsistent: true };
      },
      onSuccess: () => {
        setIsValidating(false);
        addToast(`Report verified (${data.length} records). Opening print dialog...`, 'success');
      },
      onError: (msg) => {
        setIsValidating(false);
        addToast(msg, 'error');
      },
    });
  };

  const handlePdf = () => {
    exportToPdf(
      data,
      columns,
      resolvedFilename,
      documentTitle,
      companySettings,
      (orientation === 'p' ? 'p' : 'l') as 'p' | 'l',
      subtitle,
      { printedBy: printedByName, includeSummary: true }
    );
    addToast(`"${documentTitle}" exported to PDF successfully!`, 'success');
  };

  const handleExcel = () => {
    exportToExcel(
      data,
      columns,
      resolvedFilename,
      documentTitle,
      companySettings,
      subtitle,
      { printedBy: printedByName, includeSummary: true }
    );
    addToast(`"${documentTitle}" exported to Excel successfully!`, 'success');
  };

  // Precalculate totals for numeric columns
  const summaryCols = [
    'bags',
    'bagquantity',
    'sackquantity',
    'totalkg',
    'totalmt',
    'amount',
    'rentamount',
    'received',
    'delivered',
    'balance',
    'balancebags',
    'totalbags',
    'asterix',
    'diamant',
    'granola',
    'sunshine',
    'total',
  ];

  const columnTotals = columns.map((col, idx) => {
    if (idx === 0) return `TOTAL (${data.length})`;
    const isSumTarget = summaryCols.includes(col.key.toLowerCase()) || col.isNumeric;
    if (isSumTarget) {
      let sum = 0;
      let hasNumericVal = false;
      for (const item of data) {
        const raw = item[col.key];
        const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, ''));
        if (!isNaN(num)) {
          sum += num;
          hasNumericVal = true;
        }
      }
      if (hasNumericVal) {
        if (sum === 0) return '-';
        return Number.isInteger(sum) ? sum.toLocaleString() : (Math.round(sum * 100) / 100).toLocaleString();
      }
    }
    return '';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto modal-backdrop printable-modal-wrapper">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl my-auto flex flex-col max-h-[92vh] printable-modal">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white rounded-t-2xl no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Print & Document Preview</h3>
              <p className="text-[11px] text-slate-400">
                Official Document Preview • {data.length} records ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isValidating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 hover:bg-sky-400 text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isValidating ? 'Checking...' : 'Print Document'}</span>
            </button>

            <button
              onClick={handlePdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Save as PDF</span>
            </button>

            <button
              onClick={handleExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 printable-document-body">
          {/* Printable Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {companySettings.logoUrl ? (
                  <img
                    src={companySettings.logoUrl}
                    alt={companySettings.companyName}
                    className="w-14 h-14 object-contain rounded-lg border border-slate-200 p-1"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xl">
                    {companySettings.companyName.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-900">
                    {companySettings.companyName}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {companySettings.tagline || companySettings.companyTagline || 'Potato Seed Cold Storage & Stock Management'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {companySettings.address} | Phone: {companySettings.phone}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right border-l-2 sm:border-l-0 border-slate-300 pl-3 sm:pl-0 text-xs">
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold uppercase tracking-wider mb-1">
                  Fiscal Year {companySettings.fiscalYear || '2024-2025'}
                </span>
                <div className="text-slate-600">
                  Print Date & Time: <span className="font-semibold text-slate-900">{printTimestamp}</span>
                </div>
                <div className="text-slate-600">
                  Printed By: <span className="font-bold text-slate-900">{printedByName}</span>
                </div>
                {voucherNo && (
                  <div className="text-slate-600 mt-0.5">
                    Doc No: <span className="font-mono font-bold text-slate-900">{voucherNo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  DOCUMENT: {documentTitle}
                </h2>
                {subtitle && <p className="text-xs text-slate-600 mt-0.5 font-medium">{subtitle}</p>}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Currency: <span className="font-semibold text-slate-800">{companySettings.currency || 'BDT'}</span> | Units: Bags / Metric Tons (MT)
              </div>
            </div>
          </div>

          {/* Summary KPIs if present */}
          {summaryItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200">
              {summaryItems.map((item, idx) => (
                <div key={idx} className="border-r last:border-r-0 border-slate-200 pr-2">
                  <span className="block text-[10px] uppercase font-semibold text-slate-500">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tabular Data with Zebra Striping and Separate Formatted Total Row */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-8">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-2.5 px-3 border-b border-slate-700 w-10 text-center uppercase tracking-wider text-[10px]">#</th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`py-2.5 px-3 border-b border-slate-700 font-bold uppercase tracking-wider text-[10px] ${
                        col.align === 'right' || col.isNumeric ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="py-8 text-center text-slate-400 italic"
                    >
                      No records to display.
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                    >
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200">
                        {idx + 1}
                      </td>
                      {columns.map((col) => {
                        const val = row[col.key];
                        const isNum = typeof val === 'number';
                        const alignClass = col.align === 'right' || (col.isNumeric || isNum) ? 'text-right font-mono' : col.align === 'center' ? 'text-center font-mono' : 'text-left';
                        return (
                          <td
                            key={col.key}
                            className={`py-2 px-3 text-slate-800 ${alignClass}`}
                          >
                            {val !== undefined && val !== null
                              ? isNum
                                ? val === 0
                                  ? '-'
                                  : Number.isInteger(val)
                                  ? val.toLocaleString()
                                  : (Math.round(val * 100) / 100).toLocaleString()
                                : val === '0' || val === 0
                                ? '-'
                                : String(val)
                              : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>

              {/* Total Row with Separate Formatting */}
              {data.length > 0 && (
                <tfoot>
                  <tr className="bg-sky-50 text-slate-950 font-bold border-t-2 border-b-2 border-slate-900">
                    <td className="py-2.5 px-3 text-center font-bold text-[11px] border-r border-slate-300">
                      Σ
                    </td>
                    {columns.map((col, idx) => {
                      const totalVal = columnTotals[idx];
                      const alignClass = col.align === 'right' || col.isNumeric ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left';
                      return (
                        <td
                          key={col.key}
                          className={`py-2.5 px-3 font-bold text-slate-900 ${alignClass}`}
                        >
                          {totalVal}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Signatures */}
          <div className="pt-10 mt-10 border-t border-slate-300 grid grid-cols-3 gap-8 text-center text-xs text-slate-700">
            {signatures.map((sig, idx) => (
              <div key={idx} className="space-y-1">
                <div className="border-t border-dashed border-slate-400 pt-2 font-bold uppercase tracking-wider text-[11px]">
                  {sig}
                </div>
                <div className="text-[10px] text-slate-400">Authorized Signature & Seal</div>
              </div>
            ))}
          </div>

          {/* Footer Note with Page Numbering and Printed By */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>
              {companySettings.companyName} • Confidential & Proprietary Record • Printed by: {printedByName}
            </span>
            <span className="font-semibold text-slate-700">
              Page 1 of 1 • Generated: {printTimestamp}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

