import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryTransaction } from '../../types';
import { DeliveryModal } from './DeliveryModal';
import {
  Search,
  PlusCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Edit2,
  Trash2,
  Truck,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileCheck2,
  Loader2,
} from 'lucide-react';
import { exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';
import { Modal } from '../common/Modal';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { SortIcon } from '../common/SortIcon';

export const DeliveryRegisterView: React.FC = () => {
  const [isPrintRegisterOpen, setIsPrintRegisterOpen] = useState(false);
  const {
    deliveryTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    deleteDeliveryTransaction,
    hasPermission,
    companySettings,
    currentUser,
    setIsDeliveryModalOpen,
    filters,
    addToast,
  } = useApp();

  const [search, setSearch] = useState(filters.searchQuery || '');
  const [selectedStorage, setSelectedStorage] = useState(filters.coldStorageId || '');
  const [selectedVariety, setSelectedVariety] = useState(filters.varietyId || '');
  const [editingItem, setEditingItem] = useState<DeliveryTransaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [printChallanItem, setPrintChallanItem] = useState<DeliveryTransaction | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Sync with global header search and filters
  useEffect(() => {
    if (filters.searchQuery) {
      setSearch(filters.searchQuery);
    }
  }, [filters.searchQuery]);

  // Sorting
  const [sortField, setSortField] = useState<keyof DeliveryTransaction>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const filteredData = useMemo(() => {
    return deliveryTransactions.filter((item) => {
      if (selectedStorage && item.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && item.varietyId !== selectedVariety) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          item.deliveryNo.toLowerCase().includes(q) ||
          item.customerReceiver.toLowerCase().includes(q) ||
          (item.deliveryReference && item.deliveryReference.toLowerCase().includes(q)) ||
          (item.vehicleNo && item.vehicleNo.toLowerCase().includes(q)) ||
          (item.driverName && item.driverName.toLowerCase().includes(q)) ||
          (item.remarks && item.remarks.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [deliveryTransactions, selectedStorage, selectedVariety, search]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalBags = filteredData.reduce((acc, d) => acc + d.sackQuantity, 0);
  const totalKg = filteredData.reduce((acc, d) => acc + d.totalKg, 0);
  const totalMt = Number((totalKg / 1000).toFixed(2));

  const handleSort = (field: keyof DeliveryTransaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportExcel = async () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const exportRows = sortedData.map((d, idx) => {
        const storage = coldStorages.find((c) => c.id === d.coldStorageId)?.name || d.coldStorageId;
        const variety = varieties.find((v) => v.id === d.varietyId)?.name || d.varietyId;
        const seedClass = seedClasses.find((c) => c.id === d.classId)?.name || d.classId;
        const grade = grades.find((g) => g.id === d.gradeId)?.name || d.gradeId;

        return {
          sl: idx + 1,
          date: d.date,
          deliveryNo: d.deliveryNo,
          reference: d.deliveryReference || '-',
          receiver: d.customerReceiver,
          storage,
          variety,
          seedClass,
          grade,
          bags: d.sackQuantity,
          kgPerBag: d.kgPerBag,
          totalKg: d.totalKg,
          totalMt: d.totalMt,
          vehicleNo: d.vehicleNo || '-',
          driver: d.driverName || '-',
          remarks: d.remarks || '',
        };
      });

      await exportToExcel(
        exportRows,
        [
          { header: 'SL', key: 'sl', width: 6, align: 'center' },
          { header: 'Date', key: 'date', width: 12, align: 'center' },
          { header: 'Delivery No', key: 'deliveryNo', width: 16, align: 'center' },
          { header: 'Gate Pass / Ref', key: 'reference', width: 14, align: 'center' },
          { header: 'Customer / Client Receiver', key: 'receiver', width: 28, align: 'left' },
          { header: 'Cold Storage', key: 'storage', width: 22, align: 'left' },
          { header: 'Variety', key: 'variety', width: 16, align: 'left' },
          { header: 'Class', key: 'seedClass', width: 12, align: 'left' },
          { header: 'Grade', key: 'grade', width: 10, align: 'center' },
          { header: 'Bags', key: 'bags', width: 12, align: 'right', isNumeric: true, numFmt: '#,##0' },
          { header: 'KG/Bag', key: 'kgPerBag', width: 10, align: 'right', isNumeric: true, numFmt: '#,##0.00' },
          { header: 'Total KG', key: 'totalKg', width: 14, align: 'right', isNumeric: true, numFmt: '#,##0.00' },
          { header: 'Total MT', key: 'totalMt', width: 12, align: 'right', isNumeric: true, numFmt: '#,##0.000' },
          { header: 'Vehicle No', key: 'vehicleNo', width: 16, align: 'center' },
          { header: 'Driver', key: 'driver', width: 18, align: 'left' },
          { header: 'Remarks', key: 'remarks', width: 22, align: 'left' },
        ],
        'Potato_Seed_Delivery_Register_2024',
        'Potato Seed Outbound Delivery Register',
        companySettings,
        `Total Dispatched: ${totalBags.toLocaleString()} Bags (${totalMt.toFixed(2)} MT) | Matching Records: ${sortedData.length}`,
        {
          orientation: 'landscape',
          sheetName: 'Delivery Register',
          includeSummary: true,
          summaryColumns: ['bags', 'totalKg', 'totalMt'],
          accentColor: 'FFD97706', // Amber-600 Corporate Accent for Dispatch
          printedBy: currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User',
        }
      );

      if (addToast) {
        addToast('Delivery Register Excel downloaded with print-ready zebra styling!', 'success');
      }
    } catch (err) {
      console.error('Failed to export delivery register to Excel:', err);
      if (addToast) {
        addToast('Failed to download Excel file. Please try again.', 'error');
      }
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = () => {
    const exportRows = sortedData.map((d, idx) => ({
      sl: idx + 1,
      date: d.date,
      delNo: d.deliveryNo,
      receiver: d.customerReceiver,
      storage: coldStorages.find((c) => c.id === d.coldStorageId)?.code || '-',
      variety: varieties.find((v) => v.id === d.varietyId)?.name || '-',
      bags: d.sackQuantity.toLocaleString(),
      kg: d.totalKg.toLocaleString(),
      mt: d.totalMt,
      vehicle: d.vehicleNo || '-',
    }));

    exportToPdf(
      exportRows,
      [
        { header: '#', key: 'sl', width: 6, align: 'center' },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Delivery No', key: 'delNo', width: 16 },
        { header: 'Receiver', key: 'receiver', width: 22 },
        { header: 'Storage', key: 'storage', width: 14 },
        { header: 'Variety', key: 'variety', width: 16 },
        { header: 'Bags', key: 'bags', width: 14, align: 'right', isNumeric: true },
        { header: 'Total KG', key: 'kg', width: 16, align: 'right', isNumeric: true },
        { header: 'MT', key: 'mt', width: 14, align: 'right', isNumeric: true },
        { header: 'Vehicle', key: 'vehicle', width: 16 },
      ],
      'Potato_Seed_Delivery_Register_2024',
      'Potato Seed Outbound Delivery Register',
      companySettings,
      'l',
      `Total Deliveries: ${totalBags.toLocaleString()} Bags (${totalMt.toFixed(2)} MT)`,
      {
        printedBy: currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User',
        includeSummary: true,
      }
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-500" />
            Stock Out from Cold Storage
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track dispatches, farmer distributions, gate passes, and transport orders
          </p>
        </div>

        {/* Top Buttons */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          {hasPermission('add_delivery') && (
            <button
              onClick={() => setIsDeliveryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="uppercase">ISSUE STOCK OUT</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            title="Download Excel with print-ready zebra formatting for offline analysis"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-xs group"
          >
            {isExportingExcel ? (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="font-semibold uppercase">DOWNLOAD EXCEL</span>
            <span className="hidden xl:inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-medium uppercase">
              ZEBRA
            </span>
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors uppercase"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={() => setIsPrintRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors uppercase"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">PRINT</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Deliveries Issued</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {filteredData.length} Shipments
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Total Bags Dispatched</span>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {totalBags.toLocaleString()} Bags
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Total Weight</span>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {totalKg.toLocaleString()} KG
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Metric Tons Dispatched</span>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {totalMt} MT
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs no-print">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Delivery No / Receiver / Vehicle / Gate pass..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <select
          value={selectedStorage}
          onChange={(e) => {
            setSelectedStorage(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Cold Storages</option>
          {coldStorages.map((cs) => (
            <option key={cs.id} value={cs.id}>
              {cs.name} ({cs.code})
            </option>
          ))}
        </select>

        <select
          value={selectedVariety}
          onChange={(e) => {
            setSelectedVariety(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Varieties</option>
          {varieties.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-3 w-10 text-slate-400">#</th>
                <th
                  onClick={() => handleSort('date')}
                  className={`py-3 px-3 cursor-pointer select-none transition-colors group ${
                    sortField === 'date'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>DATE</span>
                    <SortIcon field="date" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('deliveryNo')}
                  className={`py-3 px-3 cursor-pointer select-none transition-colors group ${
                    sortField === 'deliveryNo'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>DELIVERY NO</span>
                    <SortIcon field="deliveryNo" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('deliveryReference')}
                  className={`py-3 px-3 cursor-pointer select-none transition-colors group ${
                    sortField === 'deliveryReference'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>GATE PASS</span>
                    <SortIcon field="deliveryReference" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('customerReceiver')}
                  className={`py-3 px-3 cursor-pointer select-none transition-colors group ${
                    sortField === 'customerReceiver'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>CUSTOMER / RECEIVER</span>
                    <SortIcon field="customerReceiver" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('coldStorageId')}
                  className={`py-3 px-3 cursor-pointer select-none transition-colors group ${
                    sortField === 'coldStorageId'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>COLD STORAGE</span>
                    <SortIcon field="coldStorageId" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('varietyId')}
                  className={`py-3 px-3 cursor-pointer select-none transition-colors group ${
                    sortField === 'varietyId'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>VARIETY</span>
                    <SortIcon field="varietyId" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('classId')}
                  className={`py-3 px-3 cursor-pointer select-none transition-colors group ${
                    sortField === 'classId'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>CLASS</span>
                    <SortIcon field="classId" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('gradeId')}
                  className={`py-3 px-3 cursor-pointer select-none transition-colors group ${
                    sortField === 'gradeId'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>GRADE</span>
                    <SortIcon field="gradeId" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('sackQuantity')}
                  className={`py-3 px-3 text-right cursor-pointer select-none transition-colors group ${
                    sortField === 'sackQuantity'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>BAGS</span>
                    <SortIcon field="sackQuantity" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalKg')}
                  className={`py-3 px-3 text-right cursor-pointer select-none transition-colors group ${
                    sortField === 'totalKg'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>TOTAL KG</span>
                    <SortIcon field="totalKg" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalMt')}
                  className={`py-3 px-3 text-right cursor-pointer select-none transition-colors group ${
                    sortField === 'totalMt'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>TOTAL MT</span>
                    <SortIcon field="totalMt" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('vehicleNo')}
                  className={`py-3 px-3 cursor-pointer select-none transition-colors group ${
                    sortField === 'vehicleNo'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>VEHICLE</span>
                    <SortIcon field="vehicleNo" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th className="py-3 px-3 text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    No delivery records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((d, idx) => {
                  const storage = coldStorages.find((c) => c.id === d.coldStorageId);
                  const variety = varieties.find((v) => v.id === d.varietyId);
                  const seedClass = seedClasses.find((c) => c.id === d.classId);
                  const grade = grades.find((g) => g.id === d.gradeId);

                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-slate-400">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {d.date}
                      </td>
                      <td className="py-3 px-3 font-semibold text-amber-600 dark:text-amber-400">
                        {d.deliveryNo}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {d.deliveryReference || '-'}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white max-w-[160px] truncate">
                        {d.customerReceiver}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {storage?.code || d.coldStorageId}
                      </td>
                      <td className="py-3 px-3 font-medium text-sky-600 dark:text-sky-400">
                        {variety?.name || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {seedClass?.name || '-'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {grade?.name || '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {d.sackQuantity === 0 ? '-' : d.sackQuantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                        {d.totalKg === 0 ? '-' : d.totalKg.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
                        {d.totalMt === 0 ? '-' : d.totalMt}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        {d.vehicleNo || '-'}
                      </td>
                      <td className="py-3 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          {/* Print Challan Button */}
                          <button
                            onClick={() => setPrintChallanItem(d)}
                            title="Print Delivery Challan"
                            className="p-1 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                          </button>
                          {hasPermission('edit_delivery') && (
                            <button
                              onClick={() => setEditingItem(d)}
                              title="Edit Delivery"
                              className="p-1 rounded-md text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission('delete_delivery') && (
                            <button
                              onClick={() => setDeleteConfirmId(d.id)}
                              title="Delete Record"
                              className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs no-print">
          <div className="text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}{' '}
            records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <DeliveryModal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          initialData={editingItem}
        />
      )}

      {/* Print Challan / Gate Pass Modal */}
      {printChallanItem && (
        <Modal
          isOpen={true}
          onClose={() => setPrintChallanItem(null)}
          title="Delivery Challan & Gate Pass"
          subtitle="Official outbound consignment document"
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-slate-800 dark:text-slate-200">
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {companySettings.companyName}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">{companySettings.address}</p>
              <p className="text-slate-500 dark:text-slate-400">
                Phone: {companySettings.phone} | Email: {companySettings.email}
              </p>
              <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold tracking-wider uppercase text-[11px]">
                OUTBOUND DELIVERY CHALLAN & GATE PASS
              </div>
            </div>

            {/* Challan Info Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Challan / Delivery No</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {printChallanItem.deliveryNo}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Date of Dispatch</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {printChallanItem.date}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Consignee / Destination</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {printChallanItem.customerReceiver}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Dispatch Cold Storage</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {coldStorages.find((c) => c.id === printChallanItem.coldStorageId)?.name} (
                  {coldStorages.find((c) => c.id === printChallanItem.coldStorageId)?.location})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Vehicle / Truck Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {printChallanItem.vehicleNo || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Driver Contact</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {printChallanItem.driverName || 'N/A'}
                </span>
              </div>
            </div>

            {/* Commodity Spec Table */}
            <table className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 dark:bg-slate-800 font-semibold">
                <tr>
                  <th className="p-2.5 text-left">Variety</th>
                  <th className="p-2.5 text-left">Seed Class</th>
                  <th className="p-2.5 text-left">Grade</th>
                  <th className="p-2.5 text-right">Bags</th>
                  <th className="p-2.5 text-right">KG/Bag</th>
                  <th className="p-2.5 text-right">Total KG</th>
                  <th className="p-2.5 text-right">Total MT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2.5 font-bold">
                    {varieties.find((v) => v.id === printChallanItem.varietyId)?.name}
                  </td>
                  <td className="p-2.5">
                    {seedClasses.find((c) => c.id === printChallanItem.classId)?.name}
                  </td>
                  <td className="p-2.5">
                    {grades.find((g) => g.id === printChallanItem.gradeId)?.name}
                  </td>
                  <td className="p-2.5 text-right font-bold">
                    {printChallanItem.sackQuantity.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right">{printChallanItem.kgPerBag}</td>
                  <td className="p-2.5 text-right font-medium">
                    {printChallanItem.totalKg.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-bold text-amber-600">
                    {printChallanItem.totalMt} MT
                  </td>
                </tr>
              </tbody>
            </table>

            {printChallanItem.remarks && (
              <p className="text-slate-500 italic">Remarks: {printChallanItem.remarks}</p>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-12 text-center text-slate-500 dark:text-slate-400">
              <div className="border-t border-slate-300 dark:border-slate-600 pt-2 font-medium">
                Store In-Charge
              </div>
              <div className="border-t border-slate-300 dark:border-slate-600 pt-2 font-medium">
                Carrier / Driver
              </div>
              <div className="border-t border-slate-300 dark:border-slate-600 pt-2 font-medium">
                Receiver Signature
              </div>
            </div>

            {/* Print Action */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 no-print">
              <button
                onClick={() => setPrintChallanItem(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  exportToPdf(
                    [
                      {
                        deliveryNo: printChallanItem.deliveryNo,
                        date: printChallanItem.date,
                        receiver: printChallanItem.customerReceiver,
                        storage: coldStorages.find((c) => c.id === printChallanItem.coldStorageId)?.name,
                        vehicle: printChallanItem.vehicleNo,
                        driver: printChallanItem.driverName,
                        variety: varieties.find((v) => v.id === printChallanItem.varietyId)?.name,
                        class: seedClasses.find((c) => c.id === printChallanItem.classId)?.name,
                        grade: grades.find((g) => g.id === printChallanItem.gradeId)?.name,
                        bags: printChallanItem.sackQuantity,
                        kgPerBag: printChallanItem.kgPerBag,
                        totalKg: printChallanItem.totalKg,
                        totalMt: printChallanItem.totalMt,
                      },
                    ],
                    [
                      { header: 'Challan No', key: 'deliveryNo' },
                      { header: 'Date', key: 'date' },
                      { header: 'Receiver', key: 'receiver' },
                      { header: 'Cold Storage', key: 'storage' },
                      { header: 'Vehicle', key: 'vehicle' },
                      { header: 'Variety', key: 'variety' },
                      { header: 'Bags', key: 'bags' },
                      { header: 'Total MT', key: 'totalMt' },
                    ],
                    `Delivery_Challan_${printChallanItem.deliveryNo}`,
                    'OUTBOUND DELIVERY CHALLAN & GATE PASS',
                    companySettings,
                    'p',
                    `Challan: ${printChallanItem.deliveryNo} • Consignee: ${printChallanItem.customerReceiver}`
                  );
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-700"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={() => {
                  if (!printChallanItem) return;
                  validateAndTriggerPrint({
                    data: [printChallanItem],
                    reportTitle: `Delivery Challan - ${printChallanItem.deliveryNo}`,
                    expectedMinRecords: 1,
                    databaseCheck: () => {
                      const exists = deliveryTransactions.some((d) => d.id === printChallanItem.id);
                      if (!exists) {
                        return { isConsistent: false, reason: 'Delivery record not found in active database.' };
                      }
                      if (!printChallanItem.deliveryNo || !printChallanItem.customerReceiver || printChallanItem.sackQuantity <= 0) {
                        return { isConsistent: false, reason: 'Delivery record is incomplete or missing mandatory quantities.' };
                      }
                      return { isConsistent: true };
                    },
                    onSuccess: () => {
                      addToast('Challan data verified with database. Opening print dialog...', 'success');
                    },
                    onError: (msg) => {
                      addToast(msg, 'error');
                    },
                  });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-sky-600 hover:bg-sky-700"
              >
                <Printer className="w-4 h-4" />
                Print Challan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 dark:text-white">Delete Delivery Entry?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this delivery consignment? The dispatched bags will
              be restored back into storage balance.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteDeliveryTransaction(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Delivery Register Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintRegisterOpen}
        onClose={() => setIsPrintRegisterOpen(false)}
        documentTitle="POTATO SEED DELIVERY & DISPATCH REGISTER"
        subtitle={`Total Dispatches: ${filteredData.length} Consignments`}
        columns={[
          { header: 'Date', key: 'date', width: 10 },
          { header: 'Challan No', key: 'deliveryNo', width: 14 },
          { header: 'Consignee / Customer', key: 'customerReceiver', width: 18 },
          { header: 'Storage', key: 'storageName', width: 14 },
          { header: 'Variety', key: 'varietyName', width: 14 },
          { header: 'Class', key: 'className', width: 10 },
          { header: 'Grade', key: 'gradeName', width: 10 },
          { header: 'Vehicle No', key: 'vehicleNo', width: 12 },
          { header: 'Bags Dispatched', key: 'sackQuantity', width: 12, align: 'right', isNumeric: true },
          { header: 'KG/Bag', key: 'kgPerBag', width: 8, align: 'right', isNumeric: true },
          { header: 'Total KG', key: 'totalKg', width: 12, align: 'right', isNumeric: true },
          { header: 'Total MT', key: 'totalMt', width: 10, align: 'right', isNumeric: true },
        ]}
        data={filteredData.map((item) => ({
          ...item,
          storageName: coldStorages.find((c) => c.id === item.coldStorageId)?.name || '',
          varietyName: varieties.find((v) => v.id === item.varietyId)?.name || '',
          className: seedClasses.find((c) => c.id === item.classId)?.name || '',
          gradeName: grades.find((g) => g.id === item.gradeId)?.name || '',
        }))}
        summaryItems={[
          { label: 'Total Consignments', value: filteredData.length },
          {
            label: 'Total Bags Dispatched',
            value: `${filteredData.reduce((acc, i) => acc + i.sackQuantity, 0).toLocaleString()} Bags`,
          },
          {
            label: 'Total Net KG',
            value: `${filteredData.reduce((acc, i) => acc + i.totalKg, 0).toLocaleString()} KG`,
          },
          {
            label: 'Total Dispatched MT',
            value: `${filteredData.reduce((acc, i) => acc + i.totalMt, 0).toFixed(2)} MT`,
          },
        ]}
        filename="Potato_Seed_Delivery_Register_2024"
        orientation="l"
      />
    </div>
  );
};
