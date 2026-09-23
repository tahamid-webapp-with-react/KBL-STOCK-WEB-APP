import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  Scale,
  Weight,
  Package,
  Boxes,
  RotateCcw,
  Filter,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { SortIcon } from '../common/SortIcon';

export const StockBalanceView: React.FC = () => {
  const [isPrintBalanceOpen, setIsPrintBalanceOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const {
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    potatoTypes,
    companySettings,
    addToast,
  } = useApp();

  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [unitMode, setUnitMode] = useState<'bags' | 'kg' | 'mt'>('bags');
  const [search, setSearch] = useState('');

  // Compute multi-dimensional stock balances dynamically
  const balanceItems = useMemo(() => {
    // Map of unique combinations
    const comboMap: Record<
      string,
      {
        coldStorageId: string;
        varietyId: string;
        classId: string;
        gradeId: string;
        productionBlockId: string;
        potatoTypeId: string;
        receivedBags: number;
        receivedKg: number;
        receivedMt: number;
        deliveredBags: number;
        deliveredKg: number;
        deliveredMt: number;
      }
    > = {};

    stockTransactions.forEach((s) => {
      const key = `${s.coldStorageId}|${s.varietyId}|${s.classId}|${s.gradeId}|${s.productionBlockId}|${s.potatoTypeId}`;
      if (!comboMap[key]) {
        comboMap[key] = {
          coldStorageId: s.coldStorageId,
          varietyId: s.varietyId,
          classId: s.classId,
          gradeId: s.gradeId,
          productionBlockId: s.productionBlockId,
          potatoTypeId: s.potatoTypeId,
          receivedBags: 0,
          receivedKg: 0,
          receivedMt: 0,
          deliveredBags: 0,
          deliveredKg: 0,
          deliveredMt: 0,
        };
      }
      comboMap[key].receivedBags += s.sackQuantity;
      comboMap[key].receivedKg += s.totalKg;
      comboMap[key].receivedMt += s.totalMt;
    });

    deliveryTransactions.forEach((d) => {
      const key = `${d.coldStorageId}|${d.varietyId}|${d.classId}|${d.gradeId}|${d.productionBlockId}|${d.potatoTypeId}`;
      if (!comboMap[key]) {
        comboMap[key] = {
          coldStorageId: d.coldStorageId,
          varietyId: d.varietyId,
          classId: d.classId,
          gradeId: d.gradeId,
          productionBlockId: d.productionBlockId,
          potatoTypeId: d.potatoTypeId,
          receivedBags: 0,
          receivedKg: 0,
          receivedMt: 0,
          deliveredBags: 0,
          deliveredKg: 0,
          deliveredMt: 0,
        };
      }
      comboMap[key].deliveredBags += d.sackQuantity;
      comboMap[key].deliveredKg += d.totalKg;
      comboMap[key].deliveredMt += d.totalMt;
    });

    return Object.values(comboMap).map((item) => {
      const remainingBags = Math.max(0, item.receivedBags - item.deliveredBags);
      const remainingKg = Math.max(0, item.receivedKg - item.deliveredKg);
      const remainingMt = Number(Math.max(0, item.receivedMt - item.deliveredMt).toFixed(2));
      const remainingPct =
        item.receivedBags > 0 ? (remainingBags / item.receivedBags) * 100 : 0;
      const deliveredPct =
        item.receivedBags > 0 ? (item.deliveredBags / item.receivedBags) * 100 : 0;

      const storage = coldStorages.find((c) => c.id === item.coldStorageId);
      const variety = varieties.find((v) => v.id === item.varietyId);
      const seedClass = seedClasses.find((c) => c.id === item.classId);
      const grade = grades.find((g) => g.id === item.gradeId);
      const block = productionBlocks.find((b) => b.id === item.productionBlockId);
      const potatoType = potatoTypes.find((t) => t.id === item.potatoTypeId);

      return {
        ...item,
        storageName: storage?.name || item.coldStorageId,
        storageCode: storage?.code || '',
        varietyName: variety?.name || item.varietyId,
        className: seedClass?.name || item.classId,
        gradeName: grade?.name || item.gradeId,
        blockName: block?.name || '-',
        typeName: potatoType?.name || '-',
        remainingBags,
        remainingKg,
        remainingMt,
        remainingPct,
        deliveredPct,
      };
    });
  }, [
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    potatoTypes,
  ]);

  // Filters
  const filteredBalances = useMemo(() => {
    return balanceItems.filter((item) => {
      if (selectedStorage && item.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && item.varietyId !== selectedVariety) return false;
      if (selectedClass && item.classId !== selectedClass) return false;
      if (selectedGrade && item.gradeId !== selectedGrade) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          item.storageName.toLowerCase().includes(q) ||
          item.varietyName.toLowerCase().includes(q) ||
          item.className.toLowerCase().includes(q) ||
          item.gradeName.toLowerCase().includes(q) ||
          item.blockName.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [balanceItems, selectedStorage, selectedVariety, selectedClass, selectedGrade, search]);

  // Sorting
  type BalanceSortField = 'storage' | 'variety' | 'class' | 'grade' | 'block' | 'received' | 'delivered' | 'balance' | 'status';
  const [sortField, setSortField] = useState<BalanceSortField>('storage');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: BalanceSortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedBalances = useMemo(() => {
    return [...filteredBalances].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'storage':
          comparison = (a.storageName || '').localeCompare(b.storageName || '');
          break;
        case 'variety':
          comparison = (a.varietyName || '').localeCompare(b.varietyName || '');
          break;
        case 'class':
          comparison = (a.className || '').localeCompare(b.className || '');
          break;
        case 'grade':
          comparison = (a.gradeName || '').localeCompare(b.gradeName || '');
          break;
        case 'block':
          comparison = (a.blockName || '').localeCompare(b.blockName || '');
          break;
        case 'received':
          comparison = a.receivedBags - b.receivedBags;
          break;
        case 'delivered':
          comparison = a.deliveredBags - b.deliveredBags;
          break;
        case 'balance':
          comparison = a.remainingBags - b.remainingBags;
          break;
        case 'status':
          comparison = a.remainingPct - b.remainingPct;
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filteredBalances, sortField, sortDir]);

  // Dynamic Aggregates computed from the active table data (filteredBalances)
  const totalReceivedBags = useMemo(
    () => filteredBalances.reduce((acc, i) => acc + i.receivedBags, 0),
    [filteredBalances]
  );
  const totalReceivedKg = useMemo(
    () => filteredBalances.reduce((acc, i) => acc + i.receivedKg, 0),
    [filteredBalances]
  );
  const totalReceivedMt = useMemo(
    () => Number((totalReceivedKg / 1000).toFixed(2)),
    [totalReceivedKg]
  );

  const totalDeliveredBags = useMemo(
    () => filteredBalances.reduce((acc, i) => acc + i.deliveredBags, 0),
    [filteredBalances]
  );
  const totalDeliveredKg = useMemo(
    () => filteredBalances.reduce((acc, i) => acc + i.deliveredKg, 0),
    [filteredBalances]
  );
  const totalDeliveredMt = useMemo(
    () => Number((totalDeliveredKg / 1000).toFixed(2)),
    [totalDeliveredKg]
  );

  const totalRemainingBags = useMemo(
    () => filteredBalances.reduce((acc, i) => acc + i.remainingBags, 0),
    [filteredBalances]
  );
  const totalRemainingKg = useMemo(
    () => filteredBalances.reduce((acc, i) => acc + i.remainingKg, 0),
    [filteredBalances]
  );
  const totalRemainingMt = useMemo(
    () => Number((totalRemainingKg / 1000).toFixed(2)),
    [totalRemainingKg]
  );

  const avgRemainingKgPerBag = useMemo(() => {
    if (totalRemainingBags === 0) return 0;
    return Number((totalRemainingKg / totalRemainingBags).toFixed(1));
  }, [totalRemainingBags, totalRemainingKg]);

  const availabilityPercentage = useMemo(() => {
    if (totalReceivedBags === 0) return 0;
    return Number(((totalRemainingBags / totalReceivedBags) * 100).toFixed(1));
  }, [totalRemainingBags, totalReceivedBags]);

  const uniqueFacilitiesCount = useMemo(() => {
    return new Set(filteredBalances.map((i) => i.coldStorageId)).size;
  }, [filteredBalances]);

  const uniqueVarietiesCount = useMemo(() => {
    return new Set(filteredBalances.map((i) => i.varietyId)).size;
  }, [filteredBalances]);

  const hasActiveFilters = Boolean(
    selectedStorage || selectedVariety || selectedClass || selectedGrade || search.trim()
  );

  const handleResetFilters = () => {
    setSelectedStorage('');
    setSelectedVariety('');
    setSelectedClass('');
    setSelectedGrade('');
    setSearch('');
  };

  const handleExportExcel = async () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const rows = filteredBalances.map((item, idx) => ({
        sl: idx + 1,
        facility: item.storageName,
        variety: item.varietyName,
        class: item.className,
        grade: item.gradeName,
        block: item.blockName,
        type: item.typeName,
        receivedBags: item.receivedBags,
        deliveredBags: item.deliveredBags,
        remainingBags: item.remainingBags,
        remainingKg: item.remainingKg,
        remainingMt: item.remainingMt,
        remainingPct: `${item.remainingPct.toFixed(1)}%`,
      }));

      await exportToExcel(
        rows,
        [
          { header: 'SL', key: 'sl', width: 6, align: 'center' },
          { header: 'Facility / Cold Storage', key: 'facility', width: 24, align: 'left' },
          { header: 'Variety', key: 'variety', width: 16, align: 'left' },
          { header: 'Class', key: 'class', width: 14, align: 'left' },
          { header: 'Grade', key: 'grade', width: 12, align: 'center' },
          { header: 'Block', key: 'block', width: 18, align: 'left' },
          { header: 'Type', key: 'type', width: 14, align: 'left' },
          { header: 'Received Bags', key: 'receivedBags', width: 14, align: 'right', isNumeric: true, numFmt: '#,##0' },
          { header: 'Delivered Bags', key: 'deliveredBags', width: 14, align: 'right', isNumeric: true, numFmt: '#,##0' },
          { header: 'Remaining Bags', key: 'remainingBags', width: 14, align: 'right', isNumeric: true, numFmt: '#,##0' },
          { header: 'Remaining KG', key: 'remainingKg', width: 14, align: 'right', isNumeric: true, numFmt: '#,##0.00' },
          { header: 'Remaining MT', key: 'remainingMt', width: 12, align: 'right', isNumeric: true, numFmt: '#,##0.00' },
          { header: 'Availability', key: 'remainingPct', width: 14, align: 'center' },
        ],
        'Potato_Stock_Balance_Matrix_2024',
        'Stock Balance & Availability Matrix',
        companySettings,
        `Total Remaining: ${totalRemainingBags.toLocaleString()} Bags (${totalRemainingMt.toFixed(2)} MT) | Matching Lots: ${filteredBalances.length}`,
        {
          orientation: 'landscape',
          sheetName: 'Stock Balance',
          includeSummary: true,
          summaryColumns: ['receivedBags', 'deliveredBags', 'remainingBags', 'remainingKg', 'remainingMt'],
          accentColor: 'FF0284C7', // Sky-600 Corporate Accent
        }
      );

      if (addToast) {
        addToast('Stock Balance Excel exported with zebra striping and totals!', 'success');
      }
    } catch (err) {
      console.error('Failed to export stock balance to Excel:', err);
      if (addToast) {
        addToast('Failed to export Excel file. Please try again.', 'error');
      }
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = () => {
    const rows = filteredBalances.map((item) => ({
      facility: item.storageCode || item.storageName,
      variety: item.varietyName,
      class: item.className,
      grade: item.gradeName,
      received: item.receivedBags.toLocaleString(),
      delivered: item.deliveredBags.toLocaleString(),
      remaining: item.remainingBags.toLocaleString(),
      mt: item.remainingMt,
      pct: `${item.remainingPct.toFixed(0)}%`,
    }));

    exportToPdf(
      rows,
      [
        { header: 'Facility', key: 'facility' },
        { header: 'Variety', key: 'variety' },
        { header: 'Class', key: 'class' },
        { header: 'Grade', key: 'grade' },
        { header: 'Received', key: 'received' },
        { header: 'Delivered', key: 'delivered' },
        { header: 'Remaining', key: 'remaining' },
        { header: 'MT', key: 'mt' },
        { header: '% Left', key: 'pct' },
      ],
      'Potato_Stock_Balance_2024',
      'Potato Seed Stock Balance & Availability',
      companySettings,
      'l',
      `In Hand: ${totalRemainingBags.toLocaleString()} Bags`
    );
  };

  const handlePrintBalance = () => {
    validateAndTriggerPrint({
      data: balanceItems,
      reportTitle: 'Potato Seed Stock Balance & Availability',
      expectedMinRecords: 1,
      databaseCheck: () => {
        if (balanceItems.length === 0) {
          return { isConsistent: false, reason: 'Balance records list is empty.' };
        }
        for (const item of balanceItems) {
          if (item.remainingBags < 0) {
            return {
              isConsistent: false,
              reason: `Discrepancy: Negative remaining stock balance (${item.remainingBags} bags).`,
            };
          }
        }
        return { isConsistent: true };
      },
      onSuccess: () => {
        addToast(`Balance verified (${balanceItems.length} categories). Opening print dialog...`, 'success');
      },
      onError: (msg) => {
        addToast(msg, 'error');
      },
    });
  };

  const handleOpenPrintPreview = () => {
    if (balanceItems.length === 0) {
      addToast('No balance data available to preview.', 'error');
      return;
    }
    setIsPrintBalanceOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Cold Storage Stock Details
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time balance formula: Received - Delivered = Remaining Stock
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* Unit Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setUnitMode('bags')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                unitMode === 'bags'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Bags
            </button>
            <button
              onClick={() => setUnitMode('kg')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                unitMode === 'kg'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              KG
            </button>
            <button
              onClick={() => setUnitMode('mt')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                unitMode === 'mt'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              MT
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            title="Download Excel with zebra striping and dynamic totals"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-xs group"
          >
            {isExportingExcel ? (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="font-semibold">Download Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={handleOpenPrintPreview}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Open printable report preview"
          >
            <Printer className="w-4 h-4 text-sky-500" />
            <span className="hidden sm:inline font-semibold">Print</span>
          </button>
        </div>
      </div>

      {/* Dynamic Summary Statistics Card: Calculates Total Weight & Total Bags from Active Table Data */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-xs relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute -right-16 -top-16 w-60 h-60 bg-gradient-to-bl from-sky-500/10 via-emerald-500/5 to-transparent rounded-full pointer-events-none" />

        {/* Card Header & Dynamic Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  Stock Balance & Weight Summary
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Live Table Data
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dynamically calculated from <strong className="text-slate-700 dark:text-slate-200">{filteredBalances.length} active row{filteredBalances.length === 1 ? '' : 's'}</strong> across {uniqueFacilitiesCount} cold storage{uniqueFacilitiesCount === 1 ? '' : 's'} &amp; {uniqueVarietiesCount} variet{uniqueVarietiesCount === 1 ? 'y' : 'ies'}
              </p>
            </div>
          </div>

          {/* Quick Active Filter Indicator & Reset */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 self-start sm:self-auto bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                Filtered View Active
              </span>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors"
                title="Reset all filters to view full inventory balance"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* 4 Core Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Net Stock Bags in Hand */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50/80 to-emerald-50/20 dark:from-emerald-950/40 dark:to-emerald-950/10 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Total Stock Bags
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                In Hand
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 tracking-tight">
                {totalRemainingBags === 0 ? '-' : totalRemainingBags.toLocaleString()}
                {totalRemainingBags !== 0 && (
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 ml-1.5">
                    Bags
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 mt-1.5 font-medium">
                <span>{availabilityPercentage > 0 ? `${availabilityPercentage}% of received` : '-'}</span>
                <span>Avg ~{avgRemainingKgPerBag > 0 ? `${avgRemainingKgPerBag} kg/bag` : '-'}</span>
              </div>
            </div>
            {/* Visual ratio progress bar */}
            <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/50 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, availabilityPercentage)}%` }}
              />
            </div>
          </div>

          {/* 2. Total Net Weight (MT & KG) */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-sky-50/80 to-sky-50/20 dark:from-sky-950/40 dark:to-sky-950/10 border border-sky-200/80 dark:border-sky-800/60 shadow-xs relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-800 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Weight className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Total Net Weight
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-200/70 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200">
                Metric Tons
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl md:text-3xl font-extrabold text-sky-950 dark:text-sky-100 tracking-tight">
                {totalRemainingMt === 0
                  ? '-'
                  : totalRemainingMt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {totalRemainingMt !== 0 && (
                  <span className="text-sm font-semibold text-sky-700 dark:text-sky-300 ml-1.5">
                    MT
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-sky-700 dark:text-sky-400 mt-1.5 font-medium">
                <span>{totalRemainingKg === 0 ? '-' : `${totalRemainingKg.toLocaleString()} Kilograms`}</span>
                <span>Active Table</span>
              </div>
            </div>
            <div className="w-full bg-sky-200/60 dark:bg-sky-900/50 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-sky-600 dark:bg-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, totalReceivedMt > 0 ? (totalRemainingMt / totalReceivedMt) * 100 : 0)}%` }}
              />
            </div>
          </div>

          {/* 3. Inbound Received (Bags & Weight) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Inbound Received
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Intake
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {totalReceivedBags === 0 ? '-' : totalReceivedBags.toLocaleString()}
                {totalReceivedBags !== 0 && (
                  <span className="text-xs font-semibold text-slate-500 ml-1.5">
                    Bags
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                <span>Weight: {totalReceivedMt === 0 ? '-' : `${totalReceivedMt.toFixed(2)} MT`}</span>
                <span>{totalReceivedKg === 0 ? '-' : `${totalReceivedKg.toLocaleString()} kg`}</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-3">
              <div className="bg-indigo-500 h-full rounded-full w-full" />
            </div>
          </div>

          {/* 4. Outbound Dispatches (Bags & Weight) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Outbound Delivered
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                Dispatched
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl md:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                {totalDeliveredBags === 0 ? '-' : totalDeliveredBags.toLocaleString()}
                {totalDeliveredBags !== 0 && (
                  <span className="text-xs font-semibold text-amber-600/70 ml-1.5">
                    Bags
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                <span>Weight: {totalDeliveredMt === 0 ? '-' : `${totalDeliveredMt.toFixed(2)} MT`}</span>
                <span>{totalDeliveredKg === 0 ? '-' : `${totalDeliveredKg.toLocaleString()} kg`}</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, totalReceivedBags > 0 ? (totalDeliveredBags / totalReceivedBags) * 100 : 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs no-print">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cultivar / block..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <select
          value={selectedStorage}
          onChange={(e) => setSelectedStorage(e.target.value)}
          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Cold Storages</option>
          {coldStorages.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedVariety}
          onChange={(e) => setSelectedVariety(e.target.value)}
          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Varieties</option>
          {varieties.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Seed Classes</option>
          {seedClasses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Grades</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Balance Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th
                  onClick={() => handleSort('storage')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    sortField === 'storage'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>COLD STORAGE</span>
                    <SortIcon field="storage" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('variety')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    sortField === 'variety'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>VARIETY</span>
                    <SortIcon field="variety" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('class')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    sortField === 'class'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>SEED CLASS</span>
                    <SortIcon field="class" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('grade')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    sortField === 'grade'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>GRADE</span>
                    <SortIcon field="grade" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('block')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    sortField === 'block'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>PRODUCTION BLOCK</span>
                    <SortIcon field="block" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('received')}
                  className={`py-3 px-4 text-right cursor-pointer select-none transition-colors group ${
                    sortField === 'received'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>RECEIVED</span>
                    <SortIcon field="received" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('delivered')}
                  className={`py-3 px-4 text-right cursor-pointer select-none transition-colors group ${
                    sortField === 'delivered'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>DELIVERED</span>
                    <SortIcon field="delivered" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('balance')}
                  className={`py-3 px-4 text-right cursor-pointer select-none transition-colors group ${
                    sortField === 'balance'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>REMAINING BALANCE</span>
                    <SortIcon field="balance" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className={`py-3 px-4 text-center w-36 cursor-pointer select-none transition-colors group ${
                    sortField === 'status'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>STORAGE STATUS</span>
                    <SortIcon field="status" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedBalances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching stock balance records.
                  </td>
                </tr>
              ) : (
                sortedBalances.map((item, idx) => {
                  const receivedVal =
                    item.receivedBags === 0
                      ? '-'
                      : unitMode === 'bags'
                      ? item.receivedBags.toLocaleString()
                      : unitMode === 'kg'
                      ? `${item.receivedKg.toLocaleString()} KG`
                      : `${item.receivedMt} MT`;

                  const deliveredVal =
                    item.deliveredBags === 0
                      ? '-'
                      : unitMode === 'bags'
                      ? item.deliveredBags.toLocaleString()
                      : unitMode === 'kg'
                      ? `${item.deliveredKg.toLocaleString()} KG`
                      : `${item.deliveredMt} MT`;

                  const remainingVal =
                    item.remainingBags === 0
                      ? '-'
                      : unitMode === 'bags'
                      ? item.remainingBags.toLocaleString()
                      : unitMode === 'kg'
                      ? `${item.remainingKg.toLocaleString()} KG`
                      : `${item.remainingMt} MT`;

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.storageName}
                      </td>
                      <td className="py-3 px-4 font-medium text-sky-600 dark:text-sky-400">
                        {item.varietyName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item.className}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {item.gradeName}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {item.blockName}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                        {receivedVal}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-600 dark:text-amber-400">
                        {deliveredVal}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {remainingVal}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, item.remainingPct)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {item.remainingPct.toFixed(0)}% available
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredBalances.length > 0 && (
              <tfoot className="bg-slate-100 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                <tr>
                  <td colSpan={5} className="py-3 px-4 uppercase tracking-wider">
                    TOTAL BALANCE ({filteredBalances.length} COMBINATIONS)
                  </td>
                  <td className="py-3 px-4 text-right">
                    {totalReceivedBags === 0
                      ? '-'
                      : unitMode === 'bags'
                      ? totalReceivedBags.toLocaleString()
                      : unitMode === 'kg'
                      ? `${(totalReceivedBags * 50).toLocaleString()} KG`
                      : `${((totalReceivedBags * 50) / 1000).toFixed(1)} MT`}
                  </td>
                  <td className="py-3 px-4 text-right text-amber-600 dark:text-amber-400">
                    {totalDeliveredBags === 0
                      ? '-'
                      : unitMode === 'bags'
                      ? totalDeliveredBags.toLocaleString()
                      : unitMode === 'kg'
                      ? `${(totalDeliveredBags * 50).toLocaleString()} KG`
                      : `${((totalDeliveredBags * 50) / 1000).toFixed(1)} MT`}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                    {totalRemainingBags === 0
                      ? '-'
                      : unitMode === 'bags'
                      ? totalRemainingBags.toLocaleString()
                      : unitMode === 'kg'
                      ? `${totalRemainingKg.toLocaleString()} KG`
                      : `${totalRemainingMt} MT`}
                  </td>
                  <td className="py-3 px-4 text-center text-xs">
                    {totalReceivedBags > 0
                      ? `${((totalRemainingBags / totalReceivedBags) * 100).toFixed(1)}% In Storage`
                      : '-'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Stock Balance Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintBalanceOpen}
        onClose={() => setIsPrintBalanceOpen(false)}
        documentTitle="POTATO SEED STOCK BALANCE & AVAILABILITY REPORT"
        subtitle={`Summary across cold storages • Remaining Stock: ${totalRemainingBags === 0 ? '-' : totalRemainingBags.toLocaleString()} Bags (${totalRemainingMt === 0 ? '-' : `${totalRemainingMt} MT`})`}
        columns={[
          { header: 'Cold Storage', key: 'storage' },
          { header: 'Variety', key: 'variety' },
          { header: 'Class', key: 'class' },
          { header: 'Grade', key: 'grade' },
          { header: 'Received Bags', key: 'received' },
          { header: 'Delivered Bags', key: 'delivered' },
          { header: 'Remaining Bags', key: 'remaining' },
          { header: 'Remaining MT', key: 'mt' },
          { header: 'Availability', key: 'pct' },
        ]}
        data={filteredBalances.map((item) => ({
          storage: item.storageName,
          variety: item.varietyName,
          class: item.className,
          grade: item.gradeName,
          received: item.receivedBags === 0 ? '-' : item.receivedBags,
          delivered: item.deliveredBags === 0 ? '-' : item.deliveredBags,
          remaining: item.remainingBags === 0 ? '-' : item.remainingBags,
          mt: item.remainingMt === 0 ? '-' : item.remainingMt,
          pct: item.remainingPct === 0 ? '-' : `${item.remainingPct.toFixed(1)}%`,
        }))}
        summaryItems={[
          { label: 'Total Received', value: totalReceivedBags === 0 ? '-' : `${totalReceivedBags.toLocaleString()} Bags` },
          { label: 'Total Delivered', value: totalDeliveredBags === 0 ? '-' : `${totalDeliveredBags.toLocaleString()} Bags` },
          { label: 'Current Balance', value: totalRemainingBags === 0 ? '-' : `${totalRemainingBags.toLocaleString()} Bags` },
          { label: 'Balance in MT', value: totalRemainingMt === 0 ? '-' : `${totalRemainingMt} MT` },
        ]}
        filename="Potato_Stock_Balance_Report_2024"
        orientation="l"
      />
    </div>
  );
};
