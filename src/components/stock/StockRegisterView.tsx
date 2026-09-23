import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StockTransaction } from '../../types';
import { StockEntryModal } from './StockEntryModal';
import { Modal } from '../common/Modal';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { SortIcon } from '../common/SortIcon';
import {
  Search,
  PlusCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Edit2,
  Trash2,
  Eye,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Columns,
  Loader2,
  Boxes,
} from 'lucide-react';
import { exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';

export type StockSortField =
  | 'date'
  | 'kblChallanNo'
  | 'srNo'
  | 'coldStorage'
  | 'variety'
  | 'class'
  | 'grade'
  | 'block'
  | 'sackQuantity'
  | 'kgPerBag'
  | 'totalKg'
  | 'totalMt';

export const StockRegisterView: React.FC = () => {
  const {
    stockTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    potatoTypes,
    deleteStockTransaction,
    hasPermission,
    companySettings,
    currentUser,
    setIsStockModalOpen,
    filters,
    addToast,
  } = useApp();

  const [search, setSearch] = useState(filters.searchQuery || filters.challanNo || filters.srNo || '');
  const [selectedStorage, setSelectedStorage] = useState(filters.coldStorageId || '');
  const [selectedVariety, setSelectedVariety] = useState(filters.varietyId || '');
  const [selectedClass, setSelectedClass] = useState(filters.classId || '');
  const [selectedGrade, setSelectedGrade] = useState(filters.gradeId || '');
  const [editingItem, setEditingItem] = useState<StockTransaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [printSlipItem, setPrintSlipItem] = useState<StockTransaction | null>(null);
  const [isPrintRegisterOpen, setIsPrintRegisterOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Sync with global header search and filters
  useEffect(() => {
    if (filters.searchQuery) {
      setSearch(filters.searchQuery);
    } else if (filters.challanNo) {
      setSearch(filters.challanNo);
    } else if (filters.srNo) {
      setSearch(filters.srNo);
    }
  }, [filters.searchQuery, filters.challanNo, filters.srNo]);

  // Sorting
  const [sortField, setSortField] = useState<StockSortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState({
    sl: true,
    date: true,
    challan: true,
    sr: true,
    storage: true,
    variety: true,
    class: true,
    grade: true,
    block: true,
    bags: true,
    kgPerBag: true,
    totalKg: true,
    totalMt: true,
    actions: true,
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // Filter & Search
  const filteredData = useMemo(() => {
    return stockTransactions.filter((item) => {
      if (selectedStorage && item.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && item.varietyId !== selectedVariety) return false;
      if (selectedClass && item.classId !== selectedClass) return false;
      if (selectedGrade && item.gradeId !== selectedGrade) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          item.kblChallanNo.toLowerCase().includes(q) ||
          item.srNo.toLowerCase().includes(q) ||
          item.transactionNo.toLowerCase().includes(q) ||
          (item.entryNo && item.entryNo.toLowerCase().includes(q)) ||
          (item.remarks && item.remarks.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [stockTransactions, selectedStorage, selectedVariety, selectedClass, selectedGrade, search]);

  // Sorting
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'variety': {
          const varA = varieties.find((v) => v.id === a.varietyId)?.name || '';
          const varB = varieties.find((v) => v.id === b.varietyId)?.name || '';
          comparison = varA.localeCompare(varB, undefined, { sensitivity: 'base' });
          break;
        }
        case 'coldStorage': {
          const csA = coldStorages.find((c) => c.id === a.coldStorageId)?.code || coldStorages.find((c) => c.id === a.coldStorageId)?.name || '';
          const csB = coldStorages.find((c) => c.id === b.coldStorageId)?.code || coldStorages.find((c) => c.id === b.coldStorageId)?.name || '';
          comparison = csA.localeCompare(csB, undefined, { sensitivity: 'base' });
          break;
        }
        case 'class': {
          const clsA = seedClasses.find((c) => c.id === a.classId)?.name || '';
          const clsB = seedClasses.find((c) => c.id === b.classId)?.name || '';
          comparison = clsA.localeCompare(clsB, undefined, { sensitivity: 'base' });
          break;
        }
        case 'grade': {
          const grA = grades.find((g) => g.id === a.gradeId)?.name || '';
          const grB = grades.find((g) => g.id === b.gradeId)?.name || '';
          comparison = grA.localeCompare(grB, undefined, { sensitivity: 'base' });
          break;
        }
        case 'block': {
          const blkA = productionBlocks.find((p) => p.id === a.productionBlockId)?.name || '';
          const blkB = productionBlocks.find((p) => p.id === b.productionBlockId)?.name || '';
          comparison = blkA.localeCompare(blkB, undefined, { sensitivity: 'base' });
          break;
        }
        case 'date': {
          const timeA = new Date(a.date).getTime() || 0;
          const timeB = new Date(b.date).getTime() || 0;
          comparison = timeA - timeB;
          break;
        }
        case 'sackQuantity': {
          const valA = Number(a.sackQuantity) || 0;
          const valB = Number(b.sackQuantity) || 0;
          comparison = valA - valB;
          break;
        }
        case 'kgPerBag': {
          const valA = Number(a.kgPerBag) || 0;
          const valB = Number(b.kgPerBag) || 0;
          comparison = valA - valB;
          break;
        }
        case 'totalKg': {
          const valA = Number(a.totalKg) || 0;
          const valB = Number(b.totalKg) || 0;
          comparison = valA - valB;
          break;
        }
        case 'totalMt': {
          const valA = Number(a.totalMt) || 0;
          const valB = Number(b.totalMt) || 0;
          comparison = valA - valB;
          break;
        }
        case 'kblChallanNo': {
          const strA = a.kblChallanNo || '';
          const strB = b.kblChallanNo || '';
          comparison = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
          break;
        }
        case 'srNo': {
          const strA = a.srNo || '';
          const strB = b.srNo || '';
          comparison = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
          break;
        }
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection, varieties, coldStorages, seedClasses, grades, productionBlocks]);

  // Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Aggregate stats
  const totalBags = filteredData.reduce((acc, s) => acc + s.sackQuantity, 0);
  const totalKg = filteredData.reduce((acc, s) => acc + s.totalKg, 0);
  const totalMt = Number((totalKg / 1000).toFixed(2));

  const handleSort = (field: StockSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Default to descending for numeric and date metrics, ascending for text fields
      if (
        field === 'date' ||
        field === 'sackQuantity' ||
        field === 'totalKg' ||
        field === 'totalMt'
      ) {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field: StockSortField) => {
    return (
      <SortIcon
        field={field}
        currentField={sortField}
        direction={sortDirection}
        className="ml-1"
      />
    );
  };

  const getHeaderClass = (
    field: StockSortField,
    align: 'left' | 'right' | 'center' = 'left'
  ) => {
    const isSorted = sortField === field;
    return `py-3 px-3 cursor-pointer select-none transition-colors group ${
      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
    } ${
      isSorted
        ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
        : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;
  };

  const handleExportExcel = async () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const exportRows = sortedData.map((s, idx) => {
        const storage = coldStorages.find((c) => c.id === s.coldStorageId)?.name || s.coldStorageId;
        const variety = varieties.find((v) => v.id === s.varietyId)?.name || s.varietyId;
        const seedClass = seedClasses.find((c) => c.id === s.classId)?.name || s.classId;
        const grade = grades.find((g) => g.id === s.gradeId)?.name || s.gradeId;
        const block = productionBlocks.find((b) => b.id === s.productionBlockId)?.name || '-';

        return {
          sl: idx + 1,
          date: s.date,
          challanNo: s.kblChallanNo,
          srNo: s.srNo,
          entryNo: s.entryNo || '-',
          storage,
          variety,
          seedClass,
          grade,
          block,
          bagQuantity: s.sackQuantity,
          kgPerBag: s.kgPerBag,
          totalKg: s.totalKg,
          totalMt: s.totalMt,
          status: s.status ? s.status.toUpperCase() : 'APPROVED',
          remarks: s.remarks || '',
        };
      });

      await exportToExcel(
        exportRows,
        [
          { header: 'SL', key: 'sl', width: 6, align: 'center' },
          { header: 'Date', key: 'date', width: 12, align: 'center' },
          { header: 'KBL Challan', key: 'challanNo', width: 16, align: 'center' },
          { header: 'SR No', key: 'srNo', width: 12, align: 'center' },
          { header: 'Cold Storage', key: 'storage', width: 22, align: 'left' },
          { header: 'Variety', key: 'variety', width: 16, align: 'left' },
          { header: 'Class', key: 'seedClass', width: 12, align: 'left' },
          { header: 'Grade', key: 'grade', width: 10, align: 'center' },
          { header: 'Block', key: 'block', width: 18, align: 'left' },
          { header: 'Bags', key: 'bagQuantity', width: 12, align: 'right', isNumeric: true, numFmt: '#,##0' },
          { header: 'KG/Bag', key: 'kgPerBag', width: 11, align: 'right', isNumeric: true, numFmt: '#,##0.00' },
          { header: 'Total KG', key: 'totalKg', width: 14, align: 'right', isNumeric: true, numFmt: '#,##0.00' },
          { header: 'Total MT', key: 'totalMt', width: 12, align: 'right', isNumeric: true, numFmt: '#,##0.000' },
          { header: 'Status', key: 'status', width: 12, align: 'center' },
          { header: 'Remarks', key: 'remarks', width: 24, align: 'left' },
        ],
        'Potato_Seed_Stock_Register_2024',
        'Potato Seed Stock Inbound Register',
        companySettings,
        `Total Records: ${sortedData.length} | Bags: ${totalBags.toLocaleString()} | MT: ${totalMt.toFixed(3)}`,
        {
          orientation: 'landscape',
          sheetName: 'Stock Inbound Register',
          includeSummary: true,
          summaryColumns: ['bagQuantity', 'totalKg', 'totalMt'],
          accentColor: 'FF0284C7', // Premium Sky Blue Banner
          printedBy: currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User',
        }
      );

      if (addToast) {
        addToast('Stock Register Excel downloaded with print-ready zebra styling!', 'success');
      }
    } catch (err) {
      console.error('Failed to export stock register to Excel:', err);
      if (addToast) {
        addToast('Failed to download Excel file. Please try again.', 'error');
      }
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = () => {
    const exportRows = sortedData.map((s, idx) => ({
      sl: idx + 1,
      date: s.date,
      challan: s.kblChallanNo,
      sr: s.srNo,
      storage: coldStorages.find((c) => c.id === s.coldStorageId)?.code || '-',
      variety: varieties.find((v) => v.id === s.varietyId)?.name || '-',
      class: seedClasses.find((c) => c.id === s.classId)?.code || '-',
      grade: grades.find((g) => g.id === s.gradeId)?.code || '-',
      bags: s.sackQuantity.toLocaleString(),
      totalKg: s.totalKg.toLocaleString(),
      totalMt: s.totalMt,
    }));

    exportToPdf(
      exportRows,
      [
        { header: '#', key: 'sl', width: 6, align: 'center' },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Challan', key: 'challan', width: 16 },
        { header: 'SR', key: 'sr', width: 14 },
        { header: 'Storage', key: 'storage', width: 14 },
        { header: 'Variety', key: 'variety', width: 18 },
        { header: 'Class', key: 'class', width: 12 },
        { header: 'Grade', key: 'grade', width: 12 },
        { header: 'Bags', key: 'bags', width: 14, align: 'right', isNumeric: true },
        { header: 'Total KG', key: 'totalKg', width: 16, align: 'right', isNumeric: true },
        { header: 'MT', key: 'totalMt', width: 14, align: 'right', isNumeric: true },
      ],
      'Potato_Seed_Stock_Register_2024',
      'Potato Seed Inbound Stock Register',
      companySettings,
      'l',
      `Total: ${totalBags.toLocaleString()} Bags (${totalMt.toFixed(2)} MT)`,
      {
        printedBy: currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User',
        includeSummary: true,
      }
    );
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Potato Send to Cold Storage Details
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete gate receipts, challan verifications, and cold storage allotments
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          {hasPermission('add_stock') && (
            <button
              onClick={() => setIsStockModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Send to Cold Storage</span>
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
            <span className="font-semibold">Download Excel</span>
            <span className="hidden xl:inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-medium">
              Zebra
            </span>
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={() => setIsPrintRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Matching Records</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {filteredData.length} Entries
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Total Bags Received</span>
          <div className="text-lg font-bold text-sky-600 dark:text-sky-400">
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
          <span className="text-[11px] text-slate-400 font-medium">Metric Tons (MT)</span>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {totalMt} MT
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Challan / SR / Batch..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Storage Filter */}
          <div>
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
          </div>

          {/* Variety Filter */}
          <div>
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

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Classes</option>
              {seedClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Grades</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset & Column Visibility Toolbar */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {(search || selectedStorage || selectedVariety || selectedClass || selectedGrade) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedStorage('');
                  setSelectedVariety('');
                  setSelectedClass('');
                  setSelectedGrade('');
                  setCurrentPage(1);
                }}
                className="text-sky-600 dark:text-sky-400 font-medium hover:underline flex items-center gap-1"
              >
                Reset Register Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 text-[11px]">
              <tr>
                <th className="py-3 px-3 w-12 text-slate-400">#</th>
                <th
                  onClick={() => handleSort('date')}
                  className={getHeaderClass('date')}
                  title="Click to sort by Date"
                >
                  <div className="flex items-center gap-1.5">
                    <span>DATE</span> {renderSortIcon('date')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('kblChallanNo')}
                  className={getHeaderClass('kblChallanNo')}
                  title="Click to sort by KBL Challan"
                >
                  <div className="flex items-center gap-1.5">
                    <span>KBL CHALLAN</span> {renderSortIcon('kblChallanNo')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('srNo')}
                  className={getHeaderClass('srNo')}
                  title="Click to sort by Store Receipt No"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SR NO</span> {renderSortIcon('srNo')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('coldStorage')}
                  className={getHeaderClass('coldStorage')}
                  title="Click to sort by Cold Storage facility"
                >
                  <div className="flex items-center gap-1.5">
                    <span>COLD STORAGE</span> {renderSortIcon('coldStorage')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('variety')}
                  className={getHeaderClass('variety')}
                  title="Click to sort alphabetically by Variety name"
                >
                  <div className="flex items-center gap-1.5">
                    <span>VARIETY</span> {renderSortIcon('variety')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('class')}
                  className={getHeaderClass('class')}
                  title="Click to sort by Seed Class"
                >
                  <div className="flex items-center gap-1.5">
                    <span>CLASS</span> {renderSortIcon('class')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('grade')}
                  className={getHeaderClass('grade')}
                  title="Click to sort by Seed Grade"
                >
                  <div className="flex items-center gap-1.5">
                    <span>GRADE</span> {renderSortIcon('grade')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('block')}
                  className={getHeaderClass('block')}
                  title="Click to sort by Farm / Production Block"
                >
                  <div className="flex items-center gap-1.5">
                    <span>BLOCK</span> {renderSortIcon('block')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('sackQuantity')}
                  className={getHeaderClass('sackQuantity', 'right')}
                  title="Click to sort by Bags quantity"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>BAGS</span> {renderSortIcon('sackQuantity')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('kgPerBag')}
                  className={getHeaderClass('kgPerBag', 'right')}
                  title="Click to sort by KG per Bag"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>KG/BAG</span> {renderSortIcon('kgPerBag')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalKg')}
                  className={getHeaderClass('totalKg', 'right')}
                  title="Click to sort by Total KG quantity"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>TOTAL KG</span> {renderSortIcon('totalKg')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalMt')}
                  className={getHeaderClass('totalMt', 'right')}
                  title="Click to sort by Total Metric Tons (MT)"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>TOTAL MT</span> {renderSortIcon('totalMt')}
                  </div>
                </th>
                <th className="py-3 px-3 text-center no-print text-slate-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    No stock records matching the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((s, idx) => {
                  const storage = coldStorages.find((c) => c.id === s.coldStorageId);
                  const variety = varieties.find((v) => v.id === s.varietyId);
                  const seedClass = seedClasses.find((c) => c.id === s.classId);
                  const grade = grades.find((g) => g.id === s.gradeId);
                  const block = productionBlocks.find((b) => b.id === s.productionBlockId);

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-slate-400">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {s.date}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-sky-600 dark:text-sky-400">
                          {s.kblChallanNo}
                        </span>
                        {s.entryNo && (
                          <span className="ml-1 text-[10px] text-slate-400">
                            ({s.entryNo})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {s.srNo}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {storage?.code || s.coldStorageId}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        {variety?.name || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {seedClass?.name || '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {grade?.name || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        {block?.name || '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {s.sackQuantity === 0 ? '-' : s.sackQuantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {s.kgPerBag === 0 ? '-' : s.kgPerBag}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                        {s.totalKg === 0 ? '-' : s.totalKg.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {s.totalMt === 0 ? '-' : s.totalMt}
                      </td>
                      <td className="py-3 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setPrintSlipItem(s)}
                            title="Print Store Receipt (SR) / Gate Pass Slip"
                            className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {hasPermission('edit_stock') && (
                            <button
                              onClick={() => setEditingItem(s)}
                              title="Edit record"
                              className="p-1 rounded-md text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission('delete_stock') && (
                            <button
                              onClick={() => setDeleteConfirmId(s.id)}
                              title="Delete record"
                              className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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

        {/* Pagination Footer */}
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
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <StockEntryModal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          initialData={editingItem}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 dark:text-white">Delete Stock Record?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this stock entry? This will adjust the available
              storage balances and audit logs immediately.
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
                  deleteStockTransaction(deleteConfirmId);
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

      {/* Print Store Receipt (SR) & Inward Gate Pass Slip Modal */}
      {printSlipItem && (
        <Modal
          isOpen={true}
          onClose={() => setPrintSlipItem(null)}
          title="Store Receipt (SR) & Stock Inward Slip"
          subtitle="Official receipt for potato seed received into cold storage"
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
              <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold tracking-wider uppercase text-[11px] border border-emerald-200 dark:border-emerald-800">
                STORE RECEIPT (SR) & INWARD GATE PASS
              </div>
            </div>

            {/* Slip Info Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Store Receipt (SR) No</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {printSlipItem.srNo}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Challan Number</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {printSlipItem.challanNo}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Receipt Date</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {printSlipItem.date}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Cold Storage Facility</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {coldStorages.find((c) => c.id === printSlipItem.coldStorageId)?.name} (
                  {coldStorages.find((c) => c.id === printSlipItem.coldStorageId)?.location})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Production Farm / Block</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {printSlipItem.farmBlock || 'Default Block'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Vehicle / Truck Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {printSlipItem.truckNo || 'N/A'}
                </span>
              </div>
            </div>

            {/* Specification Table */}
            <table className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 dark:bg-slate-800 font-semibold">
                <tr>
                  <th className="p-2.5 text-left">Variety</th>
                  <th className="p-2.5 text-left">Seed Class</th>
                  <th className="p-2.5 text-left">Grade</th>
                  <th className="p-2.5 text-right">Sacks</th>
                  <th className="p-2.5 text-right">KG/Bag</th>
                  <th className="p-2.5 text-right">Total KG</th>
                  <th className="p-2.5 text-right">Total MT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2.5 font-bold">
                    {varieties.find((v) => v.id === printSlipItem.varietyId)?.name}
                  </td>
                  <td className="p-2.5">
                    {seedClasses.find((c) => c.id === printSlipItem.classId)?.name}
                  </td>
                  <td className="p-2.5">
                    {grades.find((g) => g.id === printSlipItem.gradeId)?.name}
                  </td>
                  <td className="p-2.5 text-right font-bold">
                    {printSlipItem.sackQuantity.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right">{printSlipItem.kgPerBag}</td>
                  <td className="p-2.5 text-right font-medium">
                    {printSlipItem.totalKg.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-bold text-emerald-600">
                    {printSlipItem.totalMt} MT
                  </td>
                </tr>
              </tbody>
            </table>

            {printSlipItem.remarks && (
              <p className="text-slate-500 italic">Remarks: {printSlipItem.remarks}</p>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-10 text-center text-slate-500 dark:text-slate-400">
              <div className="border-t border-slate-300 dark:border-slate-600 pt-2 font-medium">
                Unloader / Gate Entry
              </div>
              <div className="border-t border-slate-300 dark:border-slate-600 pt-2 font-medium">
                Store In-Charge
              </div>
              <div className="border-t border-slate-300 dark:border-slate-600 pt-2 font-medium">
                Authorized Signatory
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 no-print">
              <button
                onClick={() => setPrintSlipItem(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  exportToPdf(
                    [
                      {
                        srNo: printSlipItem.srNo,
                        challanNo: printSlipItem.challanNo,
                        date: printSlipItem.date,
                        facility: coldStorages.find((c) => c.id === printSlipItem.coldStorageId)?.name,
                        variety: varieties.find((v) => v.id === printSlipItem.varietyId)?.name,
                        class: seedClasses.find((c) => c.id === printSlipItem.classId)?.name,
                        grade: grades.find((g) => g.id === printSlipItem.gradeId)?.name,
                        sacks: printSlipItem.sackQuantity,
                        kgPerBag: printSlipItem.kgPerBag,
                        totalKg: printSlipItem.totalKg,
                        totalMt: printSlipItem.totalMt,
                      },
                    ],
                    [
                      { header: 'SR No', key: 'srNo' },
                      { header: 'Challan No', key: 'challanNo' },
                      { header: 'Date', key: 'date' },
                      { header: 'Cold Storage', key: 'facility' },
                      { header: 'Variety', key: 'variety' },
                      { header: 'Class', key: 'class' },
                      { header: 'Grade', key: 'grade' },
                      { header: 'Sacks', key: 'sacks' },
                      { header: 'Total MT', key: 'totalMt' },
                    ],
                    `SR_Slip_${printSlipItem.srNo}`,
                    'STORE RECEIPT (SR) & STOCK INWARD SLIP',
                    companySettings,
                    'p',
                    `Challan: ${printSlipItem.challanNo} • Facility: ${
                      coldStorages.find((c) => c.id === printSlipItem.coldStorageId)?.name
                    }`
                  );
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-700"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={() => {
                  if (!printSlipItem) return;
                  validateAndTriggerPrint({
                    data: [printSlipItem],
                    reportTitle: `Inbound Stock Slip - ${printSlipItem.srNo}`,
                    expectedMinRecords: 1,
                    databaseCheck: () => {
                      const exists = stockTransactions.some((s) => s.id === printSlipItem.id);
                      if (!exists) {
                        return { isConsistent: false, reason: 'Transaction lot not found in active database.' };
                      }
                      if (!printSlipItem.srNo || !printSlipItem.kblChallanNo || printSlipItem.sackQuantity <= 0) {
                        return { isConsistent: false, reason: 'Slip data is incomplete or has invalid quantities.' };
                      }
                      return { isConsistent: true };
                    },
                    onSuccess: () => {
                      addToast('Slip data verified with database. Launching print dialog...', 'success');
                    },
                    onError: (msg) => {
                      addToast(msg, 'error');
                    },
                  });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <Printer className="w-4 h-4" />
                Print SR Slip
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Full Register Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintRegisterOpen}
        onClose={() => setIsPrintRegisterOpen(false)}
        documentTitle="POTATO SEED INWARD STOCK REGISTER"
        subtitle={`Total Entries: ${filteredData.length} Records`}
        columns={[
          { header: 'Date', key: 'date', width: 10 },
          { header: 'Challan No', key: 'challanNo', width: 14 },
          { header: 'SR No', key: 'srNo', width: 12 },
          { header: 'Storage', key: 'storageName', width: 14 },
          { header: 'Variety', key: 'varietyName', width: 14 },
          { header: 'Class', key: 'className', width: 10 },
          { header: 'Grade', key: 'gradeName', width: 10 },
          { header: 'Block', key: 'farmBlock', width: 10 },
          { header: 'Bags', key: 'sackQuantity', width: 10, align: 'right', isNumeric: true },
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
          { label: 'Total Records', value: filteredData.length },
          {
            label: 'Total Sacks',
            value: `${filteredData.reduce((acc, i) => acc + i.sackQuantity, 0).toLocaleString()} Bags`,
          },
          {
            label: 'Total Net KG',
            value: `${filteredData.reduce((acc, i) => acc + i.totalKg, 0).toLocaleString()} KG`,
          },
          {
            label: 'Total MT',
            value: `${filteredData.reduce((acc, i) => acc + i.totalMt, 0).toFixed(2)} MT`,
          },
        ]}
        filename="Potato_Seed_Stock_Inward_Register_2024"
        orientation="l"
      />
    </div>
  );
};
