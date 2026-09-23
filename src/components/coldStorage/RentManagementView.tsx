import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateRentSummary } from '../../utils/stockEngine';
import { Modal } from '../common/Modal';
import {
  Receipt,
  PlusCircle,
  DollarSign,
  Calendar,
  CreditCard,
  Building,
  Download,
  FileText,
  Printer,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { SortIcon } from '../common/SortIcon';
import { RentPayment } from '../../types';

// Safe normalization helpers to prevent undefined runtime errors with legacy or partial records
const formatPaymentMethod = (payment?: Partial<RentPayment> | null): string => {
  if (!payment) return 'Bank Transfer';
  if (payment.paymentMethod) {
    return String(payment.paymentMethod).replace(/_/g, ' ');
  }
  if (payment.paymentMode) {
    return String(payment.paymentMode).replace(/_/g, ' ');
  }
  return 'Bank Transfer';
};

const getPaymentAmount = (payment?: Partial<RentPayment> | null): number => {
  if (!payment) return 0;
  return payment.amount ?? payment.amountPaid ?? 0;
};

const getPaymentRef = (payment?: Partial<RentPayment> | null): string => {
  if (!payment) return '-';
  return payment.referenceNo || payment.paymentRef || payment.voucherNo || '-';
};

export const RentManagementView: React.FC = () => {
  const [isPrintLedgerOpen, setIsPrintLedgerOpen] = useState(false);
  const {
    coldStorages,
    stockTransactions,
    deliveryTransactions,
    rentPayments,
    addRentPayment,
    deleteRentPayment,
    hasPermission,
    companySettings,
    currentUser,
    isRentModalOpen,
    setIsRentModalOpen,
    addToast,
  } = useApp();

  // Rent Payment Form State
  const [coldStorageId, setColdStorageId] = useState(coldStorages[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(50000);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cheque' | 'cash'>('bank_transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [bankName, setBankName] = useState('Islami Bank Bangladesh Ltd.');
  const [remarks, setRemarks] = useState('');
  const [voucherItem, setVoucherItem] = useState<any | null>(null);

  const rentLedger = calculateRentSummary(
    coldStorages,
    stockTransactions,
    deliveryTransactions,
    rentPayments
  );

  // Sorting for Facility Rent Statements
  type RentSortField = 'name' | 'bags' | 'rent' | 'paid' | 'due' | 'status';
  const [rentSortField, setRentSortField] = useState<RentSortField>('name');
  const [rentSortDir, setRentSortDir] = useState<'asc' | 'desc'>('asc');

  const handleRentSort = (field: RentSortField) => {
    if (rentSortField === field) {
      setRentSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setRentSortField(field);
      setRentSortDir('asc');
    }
  };

  const sortedRentItems = useMemo(() => {
    return [...rentLedger.items].sort((a, b) => {
      let cmp = 0;
      switch (rentSortField) {
        case 'name':
          cmp = a.coldStorageName.localeCompare(b.coldStorageName);
          break;
        case 'bags':
          cmp = a.totalStorageBags - b.totalStorageBags;
          break;
        case 'rent':
          cmp = a.totalRentAmount - b.totalRentAmount;
          break;
        case 'paid':
          cmp = a.rentPaidAmount - b.rentPaidAmount;
          break;
        case 'due':
          cmp = a.rentDueAmount - b.rentDueAmount;
          break;
        case 'status':
          cmp = a.paymentStatus.localeCompare(b.paymentStatus);
          break;
      }
      return rentSortDir === 'asc' ? cmp : -cmp;
    });
  }, [rentLedger.items, rentSortField, rentSortDir]);

  // Sorting for Rent Transactions
  type TxnSortField = 'date' | 'storage' | 'method' | 'ref' | 'bank' | 'amount';
  const [txnSortField, setTxnSortField] = useState<TxnSortField>('date');
  const [txnSortDir, setTxnSortDir] = useState<'asc' | 'desc'>('desc');

  const handleTxnSort = (field: TxnSortField) => {
    if (txnSortField === field) {
      setTxnSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTxnSortField(field);
      setTxnSortDir('asc');
    }
  };

  const sortedRentPayments = useMemo(() => {
    return [...rentPayments].sort((a, b) => {
      let cmp = 0;
      switch (txnSortField) {
        case 'date':
          cmp = a.date.localeCompare(b.date);
          break;
        case 'storage': {
          const sA = coldStorages.find((c) => c.id === a.coldStorageId)?.name || '';
          const sB = coldStorages.find((c) => c.id === b.coldStorageId)?.name || '';
          cmp = sA.localeCompare(sB);
          break;
        }
        case 'method': {
          const mA = (a.paymentMethod || (a as any).method || '').toString();
          const mB = (b.paymentMethod || (b as any).method || '').toString();
          cmp = mA.localeCompare(mB);
          break;
        }
        case 'ref': {
          const rA = (a.referenceNo || (a as any).chequeNo || '').toString();
          const rB = (b.referenceNo || (b as any).chequeNo || '').toString();
          cmp = rA.localeCompare(rB);
          break;
        }
        case 'bank': {
          const bA = a.bankName || '';
          const bB = b.bankName || '';
          cmp = bA.localeCompare(bB);
          break;
        }
        case 'amount': {
          const amA = a.amount || (a as any).paidAmount || 0;
          const amB = b.amount || (b as any).paidAmount || 0;
          cmp = amA - amB;
          break;
        }
      }
      return txnSortDir === 'asc' ? cmp : -cmp;
    });
  }, [rentPayments, txnSortField, txnSortDir, coldStorages]);

  const handleOpenRentModal = (csId?: string) => {
    if (csId) setColdStorageId(csId);
    setDate(new Date().toISOString().split('T')[0]);
    setAmount(50000);
    setReferenceNo(`TXN-${Date.now().toString().slice(-6)}`);
    setRemarks('');
    setIsRentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coldStorageId || amount <= 0) return;

    const paymentModeMap: Record<string, 'Bank Transfer' | 'Cheque' | 'Cash'> = {
      bank_transfer: 'Bank Transfer',
      cheque: 'Cheque',
      cash: 'Cash',
    };

    addRentPayment({
      coldStorageId,
      date,
      paymentRef: referenceNo.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      amountPaid: amount,
      paymentMode: paymentModeMap[paymentMethod] || 'Bank Transfer',
      remarks: remarks.trim() || undefined,
      amount,
      referenceNo: referenceNo.trim() || undefined,
      bankName: paymentMethod !== 'cash' ? bankName : undefined,
      paymentMethod,
    });

    setIsRentModalOpen(false);
  };

  const handleExportRentExcel = () => {
    const rows = rentLedger.items.map((item) => {
      const storage = coldStorages.find((c) => c.id === item.coldStorageId);
      return {
        facility: item.coldStorageName,
        code: storage?.code || item.coldStorageId,
        storedBags: item.totalStorageBags,
        totalRent: item.totalRentAmount,
        totalPaid: item.rentPaidAmount,
        totalDue: item.rentDueAmount,
        status: item.paymentStatus.toUpperCase(),
      };
    });

    const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

    exportToExcel(
      rows,
      [
        { header: 'Storage Facility', key: 'facility', width: 28 },
        { header: 'Code', key: 'code', width: 12 },
        { header: 'Total Bags', key: 'storedBags', width: 14, isNumeric: true },
        { header: 'Total Rent (BDT)', key: 'totalRent', width: 18, isNumeric: true },
        { header: 'Total Paid (BDT)', key: 'totalPaid', width: 18, isNumeric: true },
        { header: 'Total Due (BDT)', key: 'totalDue', width: 18, isNumeric: true },
        { header: 'Payment Status', key: 'status', width: 16 },
      ],
      'Cold_Storage_Rent_Ledger_2024',
      'Cold Storage Rent Ledger & Payment Audit',
      companySettings,
      `Total Rent: ${rentLedger.totalRentAmount.toLocaleString()} BDT | Due: ${rentLedger.totalDueAmount.toLocaleString()} BDT`,
      { printedBy: printedByName, includeSummary: true }
    );
  };

  const handleExportRentPdf = () => {
    const rows = rentLedger.items.map((item) => {
      const storage = coldStorages.find((c) => c.id === item.coldStorageId);
      return {
        facility: storage?.code || item.coldStorageName,
        bags: item.totalStorageBags.toLocaleString(),
        total: item.totalRentAmount.toLocaleString(),
        paid: item.rentPaidAmount.toLocaleString(),
        due: item.rentDueAmount.toLocaleString(),
        status: item.paymentStatus.toUpperCase(),
      };
    });

    const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

    exportToPdf(
      rows,
      [
        { header: 'Facility', key: 'facility', width: 24 },
        { header: 'Total Bags', key: 'bags', width: 16, align: 'right', isNumeric: true },
        { header: 'Total Rent', key: 'total', width: 18, align: 'right', isNumeric: true },
        { header: 'Paid', key: 'paid', width: 18, align: 'right', isNumeric: true },
        { header: 'Due', key: 'due', width: 18, align: 'right', isNumeric: true },
        { header: 'Status', key: 'status', width: 16, align: 'center' },
      ],
      'Cold_Storage_Rent_Ledger_2024',
      'Cold Storage Rent Ledger & Financial Audit',
      companySettings,
      'l',
      `Outstanding Payable: ${rentLedger.totalDueAmount.toLocaleString()} BDT`,
      { printedBy: printedByName, includeSummary: true }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Cold Storage Rent & Financial Ledger
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Calculate storage lease payables, record bank disbursements, and manage facility dues
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          {(hasPermission('manage_rent') || hasPermission('view_reports')) && (
            <button
              onClick={() => handleOpenRentModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="uppercase">RECORD RENT PAYMENT</span>
            </button>
          )}

          <button
            onClick={handleExportRentExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors uppercase"
          >
            <Download className="w-4 h-4 text-sky-500" />
            <span className="hidden sm:inline">EXCEL</span>
          </button>

          <button
            onClick={handleExportRentPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors uppercase"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={() => setIsPrintLedgerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors uppercase"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">PRINT</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Rent Incurred */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Calculated Rent
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {rentLedger.totalRentAmount === 0
              ? '-'
              : `${rentLedger.totalRentAmount.toLocaleString()} ${companySettings.currency}`}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Based on active season bag allocations
          </p>
        </div>

        {/* Total Rent Paid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Rent Paid
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {rentLedger.totalPaidAmount === 0
              ? '-'
              : `${rentLedger.totalPaidAmount.toLocaleString()} ${companySettings.currency}`}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Disbursed to cold storage owners
          </p>
        </div>

        {/* Total Rent Due */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Outstanding Rent Payable
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {rentLedger.totalDueAmount === 0
              ? '-'
              : `${rentLedger.totalDueAmount.toLocaleString()} ${companySettings.currency}`}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Remaining liability for season 2024
          </p>
        </div>
      </div>

      {/* Facility Rent Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Facility-wise Rent Statements
          </h3>
          <span className="text-xs text-slate-400">
            {rentLedger.items.length} Facilities
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th
                  onClick={() => handleRentSort('name')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    rentSortField === 'name'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>COLD STORAGE FACILITY</span>
                    <SortIcon field="name" currentField={rentSortField} direction={rentSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleRentSort('bags')}
                  className={`py-3 px-4 text-right cursor-pointer select-none transition-colors group ${
                    rentSortField === 'bags'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>BAGS INCURRED</span>
                    <SortIcon field="bags" currentField={rentSortField} direction={rentSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleRentSort('rent')}
                  className={`py-3 px-4 text-right cursor-pointer select-none transition-colors group ${
                    rentSortField === 'rent'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>TOTAL RENT</span>
                    <SortIcon field="rent" currentField={rentSortField} direction={rentSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleRentSort('paid')}
                  className={`py-3 px-4 text-right cursor-pointer select-none transition-colors group ${
                    rentSortField === 'paid'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>PAID AMOUNT</span>
                    <SortIcon field="paid" currentField={rentSortField} direction={rentSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleRentSort('due')}
                  className={`py-3 px-4 text-right cursor-pointer select-none transition-colors group ${
                    rentSortField === 'due'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>OUTSTANDING DUE</span>
                    <SortIcon field="due" currentField={rentSortField} direction={rentSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleRentSort('status')}
                  className={`py-3 px-4 text-center cursor-pointer select-none transition-colors group ${
                    rentSortField === 'status'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="inline-flex items-center justify-center gap-1.5">
                    <span>STATUS</span>
                    <SortIcon field="status" currentField={rentSortField} direction={rentSortDir} />
                  </div>
                </th>
                <th className="py-3 px-4 text-center no-print">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedRentItems.map((item) => {
                const storage = coldStorages.find((c) => c.id === item.coldStorageId);
                const isPaid = item.paymentStatus === 'Paid in Full';
                const isPartial = item.paymentStatus === 'Partial';

                return (
                  <tr
                    key={item.coldStorageId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>{item.coldStorageName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {storage?.code || item.coldStorageId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {item.totalStorageBags === 0 ? '-' : `${item.totalStorageBags.toLocaleString()} Bags`}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {item.totalRentAmount === 0 ? '-' : `${item.totalRentAmount.toLocaleString()} ${companySettings.currency}`}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.rentPaidAmount === 0 ? '-' : `${item.rentPaidAmount.toLocaleString()} ${companySettings.currency}`}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                      {item.rentDueAmount === 0 ? '-' : `${item.rentDueAmount.toLocaleString()} ${companySettings.currency}`}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : isPartial
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {isPaid && <CheckCircle2 className="w-3 h-3" />}
                        {isPartial && <Clock className="w-3 h-3" />}
                        {item.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center no-print">
                      {hasPermission('manage_settings' as any) && item.rentDueAmount > 0 && (
                        <button
                          onClick={() => handleOpenRentModal(item.coldStorageId)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                          DISBURSE
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Transactions History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Rent Payment Transactions & Audit Trail
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Disbursements, bank vouchers, and payment records
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {rentPayments.length} Payment Vouchers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th
                  onClick={() => handleTxnSort('date')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    txnSortField === 'date'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>DATE</span>
                    <SortIcon field="date" currentField={txnSortField} direction={txnSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleTxnSort('storage')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    txnSortField === 'storage'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>COLD STORAGE</span>
                    <SortIcon field="storage" currentField={txnSortField} direction={txnSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleTxnSort('method')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    txnSortField === 'method'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>PAYMENT METHOD</span>
                    <SortIcon field="method" currentField={txnSortField} direction={txnSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleTxnSort('ref')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    txnSortField === 'ref'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>REFERENCE / CHEQUE</span>
                    <SortIcon field="ref" currentField={txnSortField} direction={txnSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleTxnSort('bank')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    txnSortField === 'bank'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>BANK NAME</span>
                    <SortIcon field="bank" currentField={txnSortField} direction={txnSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleTxnSort('amount')}
                  className={`py-3 px-4 text-right cursor-pointer select-none transition-colors group ${
                    txnSortField === 'amount'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>AMOUNT</span>
                    <SortIcon field="amount" currentField={txnSortField} direction={txnSortDir} />
                  </div>
                </th>
                <th className="py-3 px-4 text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedRentPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No rent payment transactions recorded yet.
                  </td>
                </tr>
              ) : (
                sortedRentPayments.map((p) => {
                  const storage = coldStorages.find((c) => c.id === p.coldStorageId);
                  const pAmount = getPaymentAmount(p);
                  const pMethod = formatPaymentMethod(p);
                  const pRef = getPaymentRef(p);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {p.date}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                        {storage?.name || p.coldStorageId}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {pMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {pRef}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {p.bankName || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {pAmount.toLocaleString()} {companySettings.currency}
                      </td>
                      <td className="py-3 px-4 text-center no-print">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setVoucherItem(p)}
                            title="Print Voucher"
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {hasPermission('manage_rent') && (
                            <button
                              onClick={() => deleteRentPayment(p.id)}
                              title="Delete Payment"
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Entry Modal */}
      {isRentModalOpen && (
        <Modal
          isOpen={isRentModalOpen}
          onClose={() => setIsRentModalOpen(false)}
          title="Record Cold Storage Rent Payment"
          subtitle="Post bank disbursement or cash voucher to facility ledger"
          maxWidth="lg"
        >
          <form onSubmit={handleSavePayment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cold Storage Facility <span className="text-rose-500">*</span>
              </label>
              <select
                value={coldStorageId}
                onChange={(e) => setColdStorageId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                {coldStorages.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.name} ({cs.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount ({companySettings.currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="bank_transfer">Bank Transfer / BEFTN</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cheque / Transaction No
                </label>
                <input
                  type="text"
                  placeholder="e.g. CHQ-993821"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {paymentMethod !== 'cash' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Issuing Bank
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dutch-Bangla Bank / Islami Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Payment Note
              </label>
              <input
                type="text"
                placeholder="e.g. 1st installment for 2024 seed storage season"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRentModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Post Payment Voucher
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Voucher Modal */}
      {voucherItem && (
        <Modal
          isOpen={true}
          onClose={() => setVoucherItem(null)}
          title="Payment Disbursement Voucher"
          subtitle="Official financial acknowledgement"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                {companySettings.companyName}
              </h4>
              <p className="text-slate-500">{companySettings.address}</p>
              <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
                OFFICIAL PAYMENT RECEIPT
              </div>
            </div>

            <div className="space-y-2 py-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {voucherItem.date}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Paid To:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {coldStorages.find((c) => c.id === voucherItem.coldStorageId)?.name || voucherItem.coldStorageId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {getPaymentAmount(voucherItem).toLocaleString()} {companySettings.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="capitalize text-slate-800 dark:text-slate-200">
                  {formatPaymentMethod(voucherItem)}
                </span>
              </div>
              {(voucherItem.referenceNo || voucherItem.paymentRef) && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference / Txn:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {getPaymentRef(voucherItem)}
                  </span>
                </div>
              )}
              {voucherItem.bankName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {voucherItem.bankName}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-8 grid grid-cols-2 text-center text-slate-400 text-[11px]">
              <div className="border-t border-slate-300 dark:border-slate-700 pt-1">
                Accounts Officer
              </div>
              <div className="border-t border-slate-300 dark:border-slate-700 pt-1">
                Authorized Signatory
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700 no-print">
              <button
                onClick={() => setVoucherItem(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const vAmount = getPaymentAmount(voucherItem);
                  const vMethod = formatPaymentMethod(voucherItem).toUpperCase();
                  const vRef = getPaymentRef(voucherItem);
                  const vNo = voucherItem.voucherNo || vRef;
                  exportToPdf(
                    [
                      {
                        voucherNo: vNo,
                        date: voucherItem.date,
                        facility: coldStorages.find((c) => c.id === voucherItem.coldStorageId)?.name || voucherItem.coldStorageId,
                        amount: vAmount,
                        method: vMethod,
                        reference: vRef,
                        bank: voucherItem.bankName || 'N/A',
                      },
                    ],
                    [
                      { header: 'Voucher No', key: 'voucherNo' },
                      { header: 'Date', key: 'date' },
                      { header: 'Paid To Facility', key: 'facility' },
                      { header: 'Amount (BDT)', key: 'amount' },
                      { header: 'Payment Mode', key: 'method' },
                      { header: 'Reference', key: 'reference' },
                      { header: 'Bank', key: 'bank' },
                    ],
                    `Rent_Voucher_${vNo}`,
                    'COLD STORAGE RENT PAYMENT RECEIPT VOUCHER',
                    companySettings,
                    'p',
                    `Facility: ${coldStorages.find((c) => c.id === voucherItem.coldStorageId)?.name || voucherItem.coldStorageId}`
                  );
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-700"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
              <button
                onClick={() => {
                  if (!voucherItem) return;
                  const vAmount = getPaymentAmount(voucherItem);
                  const vRef = getPaymentRef(voucherItem);
                  validateAndTriggerPrint({
                    data: [{ ...voucherItem, amount: vAmount, referenceNo: vRef }],
                    reportTitle: `Rent Payment Receipt - ${vRef}`,
                    expectedMinRecords: 1,
                    databaseCheck: () => {
                      const exists = rentPayments.some((r) => r.id === voucherItem.id);
                      if (!exists) {
                        return { isConsistent: false, reason: 'Payment voucher record not found in active database.' };
                      }
                      if (vAmount <= 0) {
                        return { isConsistent: false, reason: 'Voucher amount is missing or non-positive.' };
                      }
                      return { isConsistent: true };
                    },
                    onSuccess: () => {
                      addToast('Voucher data verified with database. Opening print dialog...', 'success');
                    },
                    onError: (msg) => {
                      addToast(msg, 'error');
                    },
                  });
                }}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-white bg-sky-600 hover:bg-sky-700"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Voucher
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rent Ledger Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintLedgerOpen}
        onClose={() => setIsPrintLedgerOpen(false)}
        documentTitle="COLD STORAGE RENT LEDGER & FINANCIAL AUDIT"
        subtitle={`Total Rent Due: ${rentLedger.totalDueAmount.toLocaleString()} ${companySettings.currency}`}
        columns={[
          { header: 'Facility Name', key: 'facility', width: 28 },
          { header: 'Stored Bags', key: 'bags', width: 16, align: 'right', isNumeric: true },
          { header: 'Total Rent (BDT)', key: 'total', width: 18, align: 'right', isNumeric: true },
          { header: 'Paid (BDT)', key: 'paid', width: 18, align: 'right', isNumeric: true },
          { header: 'Due (BDT)', key: 'due', width: 18, align: 'right', isNumeric: true },
          { header: 'Status', key: 'status', width: 14, align: 'center' },
        ]}
        data={rentLedger.items.map((item) => ({
          facility: item.coldStorageName,
          bags: item.totalStorageBags,
          total: item.totalRentAmount,
          paid: item.rentPaidAmount,
          due: item.rentDueAmount,
          status: item.paymentStatus.toUpperCase(),
        }))}
        summaryItems={[
          {
            label: 'Total Storage Rent',
            value: `${rentLedger.totalRentAmount.toLocaleString()} ${companySettings.currency}`,
          },
          {
            label: 'Total Rent Paid',
            value: `${rentLedger.totalPaidAmount.toLocaleString()} ${companySettings.currency}`,
          },
          {
            label: 'Outstanding Due',
            value: `${rentLedger.totalDueAmount.toLocaleString()} ${companySettings.currency}`,
          },
        ]}
        filename="Cold_Storage_Rent_Ledger_2024"
        orientation="l"
      />
    </div>
  );
};
