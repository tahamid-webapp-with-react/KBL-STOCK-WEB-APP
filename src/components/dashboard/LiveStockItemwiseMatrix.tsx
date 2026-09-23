import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TableDensity } from '../../types';
import { calculateLiveStockMatrix } from '../../utils/stockEngine';
import {
  Download,
  FileSpreadsheet,
  RotateCcw,
  Eye,
  EyeOff,
  Boxes,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  Layers,
  Calendar,
  Building2,
  Rows3,
  Rows4,
  FileText,
  Printer,
} from 'lucide-react';
import { ExportColumn, exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { SortIcon } from '../common/SortIcon';

interface ColumnStyle {
  headerBg: string;
  headerText: string;
  headerBorder: string;
  cellBg: string;
  cellBorder: string;
  cellText: string;
  subtotalText: string;
  grandTotalBg: string;
  grandTotalBorder: string;
  grandTotalText: string;
}

const getVarietyColorStyle = (varietyKey: string): ColumnStyle => {
  const key = varietyKey.toUpperCase();
  if (key.includes('ASTERIX')) {
    return {
      headerBg: 'bg-rose-50/90 dark:bg-rose-950/40',
      headerText: 'text-rose-800 dark:text-rose-200',
      headerBorder: 'border-rose-300 dark:border-rose-800',
      cellBg: 'bg-rose-50/35 dark:bg-rose-950/15',
      cellBorder: 'border-rose-200 dark:border-rose-800/60',
      cellText: 'text-rose-950 dark:text-rose-100',
      subtotalText: 'text-rose-900 dark:text-rose-200',
      grandTotalBg: 'bg-rose-100/80 dark:bg-rose-900/40',
      grandTotalBorder: 'border-rose-400 dark:border-rose-700',
      grandTotalText: 'text-rose-900 dark:text-rose-100',
    };
  }
  if (key.includes('DIAMANT')) {
    return {
      headerBg: 'bg-sky-50/90 dark:bg-sky-950/40',
      headerText: 'text-sky-800 dark:text-sky-200',
      headerBorder: 'border-sky-300 dark:border-sky-800',
      cellBg: 'bg-sky-50/35 dark:bg-sky-950/15',
      cellBorder: 'border-sky-200 dark:border-sky-800/60',
      cellText: 'text-sky-950 dark:text-sky-100',
      subtotalText: 'text-sky-900 dark:text-sky-200',
      grandTotalBg: 'bg-sky-100/80 dark:bg-sky-900/40',
      grandTotalBorder: 'border-sky-400 dark:border-sky-700',
      grandTotalText: 'text-sky-900 dark:text-sky-100',
    };
  }
  if (key.includes('GRANOLA')) {
    return {
      headerBg: 'bg-amber-50/90 dark:bg-amber-950/40',
      headerText: 'text-amber-800 dark:text-amber-200',
      headerBorder: 'border-amber-300 dark:border-amber-800',
      cellBg: 'bg-amber-50/35 dark:bg-amber-950/15',
      cellBorder: 'border-amber-200 dark:border-amber-800/60',
      cellText: 'text-amber-950 dark:text-amber-100',
      subtotalText: 'text-amber-900 dark:text-amber-200',
      grandTotalBg: 'bg-amber-100/80 dark:bg-amber-900/40',
      grandTotalBorder: 'border-amber-400 dark:border-amber-700',
      grandTotalText: 'text-amber-900 dark:text-amber-100',
    };
  }
  if (key.includes('SUN') || key.includes('SHINE')) {
    return {
      headerBg: 'bg-orange-50/90 dark:bg-orange-950/40',
      headerText: 'text-orange-800 dark:text-orange-200',
      headerBorder: 'border-orange-300 dark:border-orange-800',
      cellBg: 'bg-orange-50/35 dark:bg-orange-950/15',
      cellBorder: 'border-orange-200 dark:border-orange-800/60',
      cellText: 'text-orange-950 dark:text-orange-100',
      subtotalText: 'text-orange-900 dark:text-orange-200',
      grandTotalBg: 'bg-orange-100/80 dark:bg-orange-900/40',
      grandTotalBorder: 'border-orange-400 dark:border-orange-700',
      grandTotalText: 'text-orange-900 dark:text-orange-100',
    };
  }
  // Total column
  if (key === 'TOTAL') {
    return {
      headerBg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
      headerText: 'text-emerald-800 dark:text-emerald-200',
      headerBorder: 'border-emerald-300 dark:border-emerald-800',
      cellBg: 'bg-emerald-50/35 dark:bg-emerald-950/15',
      cellBorder: 'border-emerald-200 dark:border-emerald-800/60',
      cellText: 'text-emerald-950 dark:text-emerald-100',
      subtotalText: 'text-emerald-900 dark:text-emerald-200',
      grandTotalBg: 'bg-emerald-100/90 dark:bg-emerald-900/50',
      grandTotalBorder: 'border-emerald-400 dark:border-emerald-600',
      grandTotalText: 'text-emerald-950 dark:text-emerald-100',
    };
  }
  // Fallback for any other custom variety
  return {
    headerBg: 'bg-teal-50/90 dark:bg-teal-950/40',
    headerText: 'text-teal-800 dark:text-teal-200',
    headerBorder: 'border-teal-300 dark:border-teal-800',
    cellBg: 'bg-teal-50/35 dark:bg-teal-950/15',
    cellBorder: 'border-teal-200 dark:border-teal-800/60',
    cellText: 'text-teal-950 dark:text-teal-100',
    subtotalText: 'text-teal-900 dark:text-teal-200',
    grandTotalBg: 'bg-teal-100/80 dark:bg-teal-900/40',
    grandTotalBorder: 'border-teal-400 dark:border-teal-700',
    grandTotalText: 'text-teal-900 dark:text-teal-100',
  };
};

export interface LiveStockItemwiseMatrixProps {
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
}

export const LiveStockItemwiseMatrix: React.FC<LiveStockItemwiseMatrixProps> = ({
  density: propDensity,
  onDensityChange,
}) => {
  const {
    stockTransactions,
    deliveryTransactions,
    varieties,
    seedClasses,
    grades,
    potatoTypes,
    filters,
    setFilters,
    resetFilters,
    coldStorages,
    companySettings,
    currentUser,
    addToast,
  } = useApp();

  const [internalDensity, setInternalDensity] = useState<TableDensity>(() => {
    try {
      const saved = localStorage.getItem('app_dashboard_table_density');
      if (saved === 'compact' || saved === 'normal' || saved === 'comfortable') return saved;
    } catch {
      // ignore in sandboxed environments
    }
    return 'comfortable';
  });

  const density = propDensity || internalDensity;

  const setDensity = (newDensity: TableDensity) => {
    setInternalDensity(newDensity);
    try {
      localStorage.setItem('app_dashboard_table_density', newDensity);
    } catch {
      // ignore
    }
    if (onDensityChange) {
      onDensityChange(newDensity);
    }
  };

  const isCompact = density === 'compact';

  const densityStyles = {
    canvasPadding: density === 'compact' ? 'p-2 sm:p-2.5' : density === 'comfortable' ? 'py-3.5 px-4 sm:py-4 sm:px-6' : 'py-2 px-3 sm:py-2.5 sm:px-4',
    thCorner: density === 'compact' ? 'px-3 py-1.5 text-[11px] w-56' : density === 'comfortable' ? 'px-4 py-3 text-xs w-64' : 'px-3.5 py-2 text-xs w-60',
    thCol: density === 'compact' ? 'px-3 py-1.5 text-[11px] w-24' : density === 'comfortable' ? 'px-4 py-3 text-xs w-28' : 'px-3.5 py-2 text-xs w-26',
    gapHeight: density === 'compact' ? 'h-1' : density === 'comfortable' ? 'h-2' : 'h-1.5',
    grandTotalLabel: density === 'compact' ? 'py-0.5 px-2 text-xs sm:text-sm' : density === 'comfortable' ? 'py-1.5 px-3 text-sm' : 'py-1 px-2.5 text-xs sm:text-sm',
    grandTotalCellTd: density === 'compact' ? 'p-0.5' : density === 'comfortable' ? 'py-1 px-0.5' : 'p-0.5',
    grandTotalCellBox: density === 'compact' ? 'py-0.5 px-1 text-xs' : density === 'comfortable' ? 'py-1 px-2 text-sm' : 'py-0.5 px-1.5 text-xs sm:text-sm',
    subtotalLabel: density === 'compact' ? 'py-0.5 px-2 text-[11px]' : density === 'comfortable' ? 'py-1 px-3 text-xs sm:text-sm' : 'py-0.5 px-2.5 text-xs',
    subtotalCell: density === 'compact' ? 'py-0.5 px-1 text-[11px]' : density === 'comfortable' ? 'py-1 px-2 text-xs sm:text-sm' : 'py-0.5 px-1.5 text-xs',
    singleLabel: density === 'compact' ? 'py-0.5 px-2 text-[11px]' : density === 'comfortable' ? 'py-1 px-3 text-xs sm:text-sm' : 'py-0.5 px-2.5 text-xs',
    singleCell: density === 'compact' ? 'py-0.5 px-1 text-[11px]' : density === 'comfortable' ? 'py-1 px-2 text-xs sm:text-sm' : 'py-0.5 px-1.5 text-xs',
    regularLabel: density === 'compact' ? 'py-0.5 px-2 text-[11px]' : density === 'comfortable' ? 'py-1 px-3 text-xs sm:text-sm' : 'py-0.5 px-2.5 text-xs',
    regularCell: density === 'compact' ? 'py-0.5 px-1 text-[11px]' : density === 'comfortable' ? 'py-1 px-2 text-xs sm:text-sm' : 'py-0.5 px-1.5 text-xs',
    drawerTh: density === 'compact' ? 'px-2.5 py-1.5 text-[10.5px]' : density === 'comfortable' ? 'px-3.5 py-2.5 text-xs' : 'px-3 py-2 text-[11px]',
    drawerTd: density === 'compact' ? 'px-2.5 py-1 text-[10.5px]' : density === 'comfortable' ? 'px-3.5 py-2 text-xs' : 'px-3 py-1.5 text-[11.5px]',
  };

  const [showEmptyGrid, setShowEmptyGrid] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedVarietyKey, setSelectedVarietyKey] = useState<string>('ALL');

  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    columns: ExportColumn[];
    data: Record<string, any>[];
    summaryItems?: { label: string; value: string | number }[];
  }>({
    isOpen: false,
    title: '',
    columns: [],
    data: [],
  });

  const matrixData = React.useMemo(() => {
    return calculateLiveStockMatrix(
      stockTransactions,
      deliveryTransactions,
      varieties,
      seedClasses,
      grades,
      potatoTypes,
      filters
    );
  }, [
    stockTransactions,
    deliveryTransactions,
    varieties,
    seedClasses,
    grades,
    potatoTypes,
    filters,
  ]);

  const activeStorage = React.useMemo(() => {
    if (!filters.coldStorageId) return 'ALL COLD STORAGES';
    const cs = coldStorages.find((c) => c.id === filters.coldStorageId);
    return cs ? cs.name.toUpperCase() : 'FILTERED COLD STORAGE';
  }, [filters.coldStorageId, coldStorages]);

  const hasZeroResults = matrixData.grandTotal === 0;

  const handleExportExcel = () => {
    const exportRows: any[] = [];
    matrixData.rows.forEach((r) => {
      if (r.type === 'gap') {
        exportRows.push({
          item: '',
          asterix: '',
          diamant: '',
          granola: '',
          sunshine: '',
          total: '',
        });
      } else {
        exportRows.push({
          item: r.label.toUpperCase(),
          asterix: r.values.ASTERIX === 0 ? '-' : r.values.ASTERIX || '-',
          diamant: r.values.DIAMANT === 0 ? '-' : r.values.DIAMANT || '-',
          granola: r.values.GRANOLA === 0 ? '-' : r.values.GRANOLA || '-',
          sunshine: r.values['SUN-SHINE'] === 0 ? '-' : r.values['SUN-SHINE'] || '-',
          total: r.total === 0 ? '-' : r.total || '-',
        });
      }
    });

    const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

    exportToExcel(
      exportRows,
      [
        { header: 'ITEM / CATEGORY', key: 'item', width: 28 },
        { header: 'ASTERIX', key: 'asterix', width: 14, isNumeric: true },
        { header: 'DIAMANT', key: 'diamant', width: 14, isNumeric: true },
        { header: 'GRANOLA', key: 'granola', width: 14, isNumeric: true },
        { header: 'SUN-SHINE', key: 'sunshine', width: 14, isNumeric: true },
        { header: 'TOTAL', key: 'total', width: 16, isNumeric: true },
      ],
      `LIVE_STOCK_ITEMWISE_${activeStorage.replace(/\s+/g, '_')}`,
      `LIVE STOCK DETAILS ITEM-WISE (${activeStorage})`,
      companySettings,
      `LIVE STOCK BREAKDOWN - ${new Date().toLocaleDateString()}`,
      { printedBy: printedByName, includeSummary: true }
    );
    addToast(`Live Stock Matrix (${activeStorage}) exported to Excel successfully!`, 'success');
  };

  const handleExportPdf = () => {
    const exportRows: any[] = [];
    matrixData.rows.forEach((r) => {
      if (r.type === 'gap') {
        exportRows.push({
          item: '',
          asterix: '',
          diamant: '',
          granola: '',
          sunshine: '',
          total: '',
        });
      } else {
        exportRows.push({
          item: r.label.toUpperCase(),
          asterix: r.values.ASTERIX === 0 ? '-' : r.values.ASTERIX || '-',
          diamant: r.values.DIAMANT === 0 ? '-' : r.values.DIAMANT || '-',
          granola: r.values.GRANOLA === 0 ? '-' : r.values.GRANOLA || '-',
          sunshine: r.values['SUN-SHINE'] === 0 ? '-' : r.values['SUN-SHINE'] || '-',
          total: r.total === 0 ? '-' : r.total || '-',
        });
      }
    });

    const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

    exportToPdf(
      exportRows,
      [
        { header: 'ITEM / CATEGORY', key: 'item' },
        { header: 'ASTERIX', key: 'asterix', isNumeric: true },
        { header: 'DIAMANT', key: 'diamant', isNumeric: true },
        { header: 'GRANOLA', key: 'granola', isNumeric: true },
        { header: 'SUN-SHINE', key: 'sunshine', isNumeric: true },
        { header: 'TOTAL', key: 'total', isNumeric: true },
      ],
      `ITEM_WISE_STOCK_SUMMARY_${activeStorage.replace(/\s+/g, '_')}`,
      `ITEM-WISE STOCK SUMMARY (${activeStorage})`,
      companySettings,
      'l',
      `Facility: ${activeStorage}`,
      { printedBy: printedByName, includeSummary: true }
    );
    addToast(`Item-Wise Stock Summary (${activeStorage}) exported to PDF successfully!`, 'success');
  };

  const handlePrint = () => {
    const previewRows: Record<string, any>[] = [];
    matrixData.rows.forEach((r) => {
      if (r.type === 'gap') {
        previewRows.push({
          item: '',
          asterix: '',
          diamant: '',
          granola: '',
          sunshine: '',
          total: '',
        });
      } else {
        previewRows.push({
          item: r.label.toUpperCase(),
          asterix: r.values.ASTERIX === 0 ? '-' : r.values.ASTERIX || '-',
          diamant: r.values.DIAMANT === 0 ? '-' : r.values.DIAMANT || '-',
          granola: r.values.GRANOLA === 0 ? '-' : r.values.GRANOLA || '-',
          sunshine: r.values['SUN-SHINE'] === 0 ? '-' : r.values['SUN-SHINE'] || '-',
          total: r.total === 0 ? '-' : r.total || '-',
        });
      }
    });

    setPrintModalState({
      isOpen: true,
      title: `LIVE STOCK MATRIX (${activeStorage.toUpperCase()})`,
      subtitle: `Facility: ${activeStorage} • Currency: ${companySettings.currency || 'BDT'}`,
      columns: [
        { header: 'ITEM / CATEGORY', key: 'item', width: 32, align: 'left' },
        { header: 'ASTERIX (BAGS)', key: 'asterix', width: 16, align: 'right', isNumeric: true },
        { header: 'DIAMANT (BAGS)', key: 'diamant', width: 16, align: 'right', isNumeric: true },
        { header: 'GRANOLA (BAGS)', key: 'granola', width: 16, align: 'right', isNumeric: true },
        { header: 'SUN-SHINE (BAGS)', key: 'sunshine', width: 16, align: 'right', isNumeric: true },
        { header: 'TOTAL (BAGS)', key: 'total', width: 18, align: 'right', isNumeric: true },
      ],
      data: previewRows,
      summaryItems: [
        { label: 'Facility', value: activeStorage },
        { label: 'Grand Total Bags', value: Number(matrixData.grandTotal || 0).toLocaleString() },
        { label: 'Active Items', value: matrixData.rows.filter(r => r.type !== 'gap').length },
      ],
    });
  };

  const renderCellValue = (val: number | undefined) => {
    if (val === undefined || val === null || val === 0) return '-';
    return val.toLocaleString();
  };

  const totalColStyle = getVarietyColorStyle('TOTAL');

  // Helper to get variety column key from variety ID
  const getVarietyColKey = (varietyId: string): string => {
    const v = varieties.find((item) => item.id === varietyId);
    const name = (v?.name || '').toUpperCase();
    const code = (v?.code || '').toUpperCase();
    if (code === 'AST' || name.includes('ASTERIX')) return 'ASTERIX';
    if (code === 'DIA' || name.includes('DIAMANT')) return 'DIAMANT';
    if (code === 'GRA' || name.includes('GRANOLA')) return 'GRANOLA';
    if (code === 'SUN' || name.includes('SUN-SHINE') || name.includes('SUNSHINE')) return 'SUN-SHINE';
    return 'OTHER';
  };

  // Helper to match row criteria
  const matchesRowCriteria = (rowId: string, classId: string, gradeId: string, typeId?: string) => {
    const cls = seedClasses.find((c) => c.id === classId);
    const grd = grades.find((g) => g.id === gradeId);
    const typ = potatoTypes.find((p) => p.id === typeId);

    const className = (cls?.name || '').toLowerCase();
    const classCode = (cls?.code || '').toUpperCase();
    const gradeName = (grd?.name || '').toLowerCase();
    const gradeCode = (grd?.code || '').toUpperCase();
    const typeName = (typ?.name || '').toLowerCase();
    const typeCode = (typ?.code || '').toUpperCase();

    switch (rowId) {
      case 'certify-a':
        return (classCode === 'CS' || className.includes('certif')) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'certify-b':
        return (classCode === 'CS' || className.includes('certif')) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'certify-us':
        return (classCode === 'CS' || className.includes('certif')) && (gradeCode === 'US' || gradeName.includes('under size') || gradeName.includes('us'));
      case 'total-certify':
        return classCode === 'CS' || className.includes('certif');

      case 'foundation-a':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'foundation-b':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'foundation-us':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'US' || gradeName.includes('under size') || gradeName.includes('us'));
      case 'foundation-os':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'OS' || gradeName.includes('over size') || gradeName.includes('os'));
      case 'total-foundation':
        return classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'));

      case 'mini-tuber':
      case 'total-mini-tuber':
        return classCode === 'MT' || classCode === 'BRD' || className.includes('mini tuber') || className.includes('breeder');

      case 'table-potato':
      case 'total-table-potato':
        return gradeCode === 'TP' || gradeName.includes('tp') || typeCode === 'TABLE' || typeName.includes('table');

      case 'pre-foundation-a':
        return (classCode === 'PF' || classCode === 'PFS' || className.includes('pre')) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'pre-foundation-b':
        return (classCode === 'PF' || classCode === 'PFS' || className.includes('pre')) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'pre-foundation-us':
        return (classCode === 'PF' || classCode === 'PFS' || className.includes('pre')) && (gradeCode === 'US' || gradeName.includes('under size') || gradeName.includes('us'));
      case 'total-pre-foundation':
        return classCode === 'PF' || classCode === 'PFS' || className.includes('pre');

      case 'tls-a':
        return (classCode === 'TLS' || className.includes('tls')) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'tls-b':
        return (classCode === 'TLS' || className.includes('tls')) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'total-tls':
        return classCode === 'TLS' || className.includes('tls');

      case 'non-traceable':
      case 'total-non-traceable':
        return classCode === 'NT' || className.includes('non traceable') || className.includes('non-traceable');
      case 'grand-total':
      default:
        return true;
    }
  };

  // Get live stock balance records per SR for expanded drawer (Stock In - Stock Out = Balance Stock)
  const getExpandedRowDetails = (rowId: string, varietyKey: string) => {
    const matchedStock = stockTransactions.filter((s) => {
      if (s.status !== 'approved') return false;
      if (filters.coldStorageId && s.coldStorageId !== filters.coldStorageId) return false;
      if (varietyKey !== 'ALL' && getVarietyColKey(s.varietyId) !== varietyKey) return false;
      return matchesRowCriteria(rowId, s.classId, s.gradeId, s.potatoTypeId);
    });

    const matchedDelivery = deliveryTransactions.filter((d) => {
      if (d.status !== 'approved' && d.status !== 'completed') return false;
      if (filters.coldStorageId && d.coldStorageId !== filters.coldStorageId) return false;
      if (varietyKey !== 'ALL' && getVarietyColKey(d.varietyId) !== varietyKey) return false;
      return matchesRowCriteria(rowId, d.classId, d.gradeId, d.potatoTypeId);
    });

    // We calculate the live remaining stock quantity for each SR (Stock In minus Stock Out = Balance Stock)
    const directDeliveryBySr: Record<string, number> = {};
    const unallocatedDeliveries: {
      coldStorageId: string;
      varietyId: string;
      classId: string;
      gradeId: string;
      remainingBags: number;
    }[] = [];

    matchedDelivery.forEach((d) => {
      const qty = d.sackQuantity || 0;
      if (qty <= 0) return;
      if (d.srNo) {
        const srKey = `${d.coldStorageId}|${d.varietyId}|${d.srNo}`;
        directDeliveryBySr[srKey] = (directDeliveryBySr[srKey] || 0) + qty;
      } else {
        unallocatedDeliveries.push({
          coldStorageId: d.coldStorageId,
          varietyId: d.varietyId,
          classId: d.classId,
          gradeId: d.gradeId,
          remainingBags: qty,
        });
      }
    });

    // Process stock records chronologically
    const sortedStocks = [...matchedStock].sort((a, b) => a.date.localeCompare(b.date));

    // First apply direct SR deductions
    const stockWorkList = sortedStocks.map((s) => {
      const srKey = `${s.coldStorageId}|${s.varietyId}|${s.srNo}`;
      const directDel = directDeliveryBySr[srKey] || 0;
      const deducted = Math.min(s.sackQuantity, directDel);
      directDeliveryBySr[srKey] = directDel - deducted;
      return {
        stock: s,
        remainingBags: s.sackQuantity - deducted,
      };
    });

    // Next, apply generic / unallocated deliveries FIFO
    unallocatedDeliveries.forEach((del) => {
      let needed = del.remainingBags;
      for (const item of stockWorkList) {
        if (needed <= 0) break;
        if (
          item.remainingBags > 0 &&
          item.stock.coldStorageId === del.coldStorageId &&
          item.stock.varietyId === del.varietyId &&
          item.stock.classId === del.classId &&
          item.stock.gradeId === del.gradeId
        ) {
          const take = Math.min(item.remainingBags, needed);
          item.remainingBags -= take;
          needed -= take;
        }
      }
    });

    // Also if any direct delivery SR had leftover quantity, deduct from same variety & storage
    Object.entries(directDeliveryBySr).forEach(([srKey, leftoverQty]) => {
      if (leftoverQty <= 0) return;
      const [csId, varId] = srKey.split('|');
      let needed = leftoverQty;
      for (const item of stockWorkList) {
        if (needed <= 0) break;
        if (
          item.remainingBags > 0 &&
          item.stock.coldStorageId === csId &&
          item.stock.varietyId === varId
        ) {
          const take = Math.min(item.remainingBags, needed);
          item.remainingBags -= take;
          needed -= take;
        }
      }
    });

    // Build final live stock rows for current stock quantity (Balance Stock > 0)
    const liveStockItems = stockWorkList
      .filter((item) => item.remainingBags > 0)
      .map((item) => {
        const s = item.stock;
        const cs = coldStorages.find((c) => c.id === s.coldStorageId);
        const v = varieties.find((varItem) => varItem.id === s.varietyId);
        const cls = seedClasses.find((c) => c.id === s.classId);
        const grd = grades.find((g) => g.id === s.gradeId);
        const kgPerBag = s.kgPerBag || 50;
        const totalMt = Number(((item.remainingBags * kgPerBag) / 1000).toFixed(2));

        return {
          id: s.id,
          date: s.date,
          coldStorage: cs?.name || cs?.code || '-',
          srNo: s.srNo || '-',
          kblChallan: s.kblChallanNo || '-',
          variety: v?.name || '-',
          className: cls?.name || '-',
          grade: grd?.name || '-',
          bag: item.remainingBags,
          kgPerBag,
          totalMt,
        };
      });

    const totalBags = liveStockItems.reduce((acc, row) => acc + row.bag, 0);
    const totalMt = liveStockItems.reduce((acc, row) => acc + row.totalMt, 0);

    return {
      items: liveStockItems,
      totalBags,
      totalMt,
    };
  };

  // Interface for detail drawer records
  interface ExpandedBatchItem {
    id: string;
    date: string;
    coldStorage: string;
    srNo: string;
    kblChallan: string;
    variety: string;
    className: string;
    grade: string;
    bag: number;
    kgPerBag: number;
    totalMt: number;
  }

  // Expanded detail drawer component with Search Bar, Pagination and Rows Per Page
  const ExpandedBatchDetailDrawer: React.FC<{
    row: (typeof matrixData.rows)[0];
    selectedVarietyKey: string;
    details: {
      items: ExpandedBatchItem[];
      totalBags: number;
      totalMt: number;
    };
    colSpan: number;
    densityStyles: {
      drawerTh: string;
      drawerTd: string;
    };
    onClose: () => void;
  }> = ({ row, selectedVarietyKey, details, colSpan, densityStyles, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10); // Default is 10 as requested
    const [sortField, setSortField] = useState<string>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: string) => {
      if (sortField === field) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    };

    // Filter items based on user search input
    const filteredItems = React.useMemo(() => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return details.items;

      return details.items.filter((item) => {
        return (
          item.date.toLowerCase().includes(q) ||
          item.coldStorage.toLowerCase().includes(q) ||
          item.srNo.toLowerCase().includes(q) ||
          item.kblChallan.toLowerCase().includes(q) ||
          item.variety.toLowerCase().includes(q) ||
          item.className.toLowerCase().includes(q) ||
          (item.grade && item.grade.toLowerCase().includes(q)) ||
          item.bag.toString().includes(q) ||
          item.kgPerBag.toString().includes(q) ||
          item.totalMt.toString().includes(q)
        );
      });
    }, [details.items, searchQuery]);

    // Sorted items
    const sortedItems = React.useMemo(() => {
      return [...filteredItems].sort((a, b) => {
        let valA: any = (a as any)[sortField];
        let valB: any = (b as any)[sortField];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }, [filteredItems, sortField, sortDir]);

    // Aggregate totals for the filtered set
    const filteredTotalBags = React.useMemo(() => {
      return filteredItems.reduce((acc, item) => acc + item.bag, 0);
    }, [filteredItems]);

    const filteredTotalMt = React.useMemo(() => {
      return filteredItems.reduce((acc, item) => acc + item.totalMt, 0);
    }, [filteredItems]);

    // Calculate pagination slices
    const totalItems = sortedItems.length;
    const totalPages = rowsPerPage === -1 ? 1 : Math.max(1, Math.ceil(totalItems / rowsPerPage));
    const effectivePage = Math.min(Math.max(1, currentPage), totalPages);

    const startIndex = rowsPerPage === -1 ? 0 : (effectivePage - 1) * rowsPerPage;
    const endIndex = rowsPerPage === -1 ? totalItems : Math.min(startIndex + rowsPerPage, totalItems);
    const paginatedItems = rowsPerPage === -1 ? sortedItems : sortedItems.slice(startIndex, endIndex);

    // Export handlers for this specific batch breakdown
    const handleExportDrawerExcel = () => {
      if (filteredItems.length === 0) {
        addToast('No records available to export', 'error');
        return;
      }

      const exportData = filteredItems.map((item) => ({
        date: item.date,
        coldStorage: item.coldStorage,
        srNo: item.srNo,
        kblChallan: item.kblChallan,
        variety: item.variety,
        classGrade: `${item.className} ${item.grade && item.grade !== '-' ? `(${item.grade})` : ''}`.trim(),
        bag: item.bag,
        kgPerBag: item.kgPerBag,
        totalMt: item.totalMt,
      }));

      exportToExcel(
        exportData,
        [
          { header: 'Date', key: 'date', width: 14 },
          { header: 'Cold Storage', key: 'coldStorage', width: 22 },
          { header: 'SR No', key: 'srNo', width: 12 },
          { header: 'KBL Challan', key: 'kblChallan', width: 16 },
          { header: 'Variety', key: 'variety', width: 14 },
          { header: 'Class & Grade', key: 'classGrade', width: 22 },
          { header: 'Bag', key: 'bag', width: 12 },
          { header: 'Kg/Bag', key: 'kgPerBag', width: 10 },
          { header: 'Total MT', key: 'totalMt', width: 12 },
        ],
        `BATCH_BREAKDOWN_${row.label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
        `Batch Breakdown: ${row.label} (${activeStorage})`,
        companySettings,
        `Facility: ${activeStorage} | Total Records: ${filteredItems.length} | Total Bags: ${filteredTotalBags.toLocaleString()} | Total MT: ${filteredTotalMt.toFixed(2)}`
      );
      addToast(`Batch records for ${row.label} exported to Excel!`, 'success');
    };

    const handleExportDrawerPdf = () => {
      if (filteredItems.length === 0) {
        addToast('No records available to export', 'error');
        return;
      }

      const exportRows = filteredItems.map((item) => ({
        date: item.date,
        storageSr: `${item.coldStorage} [${item.srNo}]`,
        challan: item.kblChallan,
        variety: item.variety,
        classGrade: `${item.className} ${item.grade && item.grade !== '-' ? item.grade : ''}`.trim(),
        bag: item.bag.toLocaleString(),
        kgBag: item.kgPerBag.toString(),
        totalMt: item.totalMt.toFixed(2),
      }));

      exportToPdf(
        exportRows,
        [
          { header: 'Date', key: 'date' },
          { header: 'Cold Storage & SR', key: 'storageSr' },
          { header: 'KBL Challan', key: 'challan' },
          { header: 'Variety', key: 'variety' },
          { header: 'Class & Grade', key: 'classGrade' },
          { header: 'Bag', key: 'bag' },
          { header: 'Kg/Bag', key: 'kgBag' },
          { header: 'Total MT', key: 'totalMt' },
        ],
        `BATCH_BREAKDOWN_${row.label.replace(/\s+/g, '_')}`,
        `Batch Breakdown: ${row.label} (${activeStorage})`,
        companySettings,
        'l',
        `Facility: ${activeStorage} | Total Bags: ${filteredTotalBags.toLocaleString()} | Total MT: ${filteredTotalMt.toFixed(2)}`
      );
      addToast(`Batch records for ${row.label} exported to PDF!`, 'success');
    };

    const handleDrawerPrint = () => {
      if (filteredItems.length === 0) {
        addToast('No records available to print', 'error');
        return;
      }

      const previewRows = filteredItems.map((item, idx) => ({
        index: idx + 1,
        date: item.date,
        storageSr: `${item.coldStorage} [${item.srNo}]`,
        challan: item.kblChallan,
        variety: item.variety,
        classGrade: `${item.className} ${item.grade && item.grade !== '-' ? item.grade : ''}`.trim(),
        bag: item.bag,
        kgBag: item.kgPerBag,
        totalMt: item.totalMt,
      }));

      setPrintModalState({
        isOpen: true,
        title: `BATCH DETAILS: ${row.label.toUpperCase()} (${activeStorage})`,
        subtitle: `Facility: ${activeStorage} • Total Bags: ${filteredTotalBags.toLocaleString()} • Total MT: ${filteredTotalMt.toFixed(2)}`,
        columns: [
          { header: '#', key: 'index', width: 6, align: 'center' },
          { header: 'Date', key: 'date', width: 14, align: 'left' },
          { header: 'Cold Storage & SR', key: 'storageSr', width: 22, align: 'left' },
          { header: 'Challan', key: 'challan', width: 16, align: 'left' },
          { header: 'Variety', key: 'variety', width: 16, align: 'left' },
          { header: 'Class / Grade', key: 'classGrade', width: 16, align: 'left' },
          { header: 'Bags', key: 'bag', width: 12, align: 'right', isNumeric: true },
          { header: 'Kg/Bag', key: 'kgBag', width: 10, align: 'right', isNumeric: true },
          { header: 'Total MT', key: 'totalMt', width: 12, align: 'right', isNumeric: true },
        ],
        data: previewRows,
        summaryItems: [
          { label: 'Category', value: row.label },
          { label: 'Total Records', value: filteredItems.length },
          { label: 'Total Bags', value: filteredTotalBags.toLocaleString() },
          { label: 'Total MT', value: `${filteredTotalMt.toFixed(2)} MT` },
        ],
      });
    };

    return (
      <tr key={`${row.id}-expanded`} className="bg-slate-50/90 dark:bg-slate-900/90 border-y-2 border-sky-500 dark:border-sky-400">
        <td colSpan={colSpan} className="p-1.5 sm:p-2.5">
          <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 px-3 py-2.5 sm:px-4 sm:py-3 shadow-md text-left">
            {/* Top Bar: Title on left, Search Bar (no placeholder) + Excel, PDF, Print, Close right-aligned */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 mb-2 border-b border-slate-200 dark:border-slate-750">
              {/* Left Side: Category / Variety Context Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {row.label.toUpperCase()} {selectedVarietyKey !== 'ALL' ? `(${selectedVarietyKey.toUpperCase()})` : ''} LIVE BATCH DETAILS
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {sortedItems.length} {sortedItems.length === 1 ? 'RECORD' : 'RECORDS'}
                </span>
              </div>

              {/* Right Side: Search Bar (no placeholder) + Icon-only Action Buttons (Excel, PDF, Print) + Close */}
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 ml-auto">
                {/* Search Bar without placeholder */}
                <div className="relative w-44 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder=""
                    className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs transition-all"
                    aria-label="Search batch records"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      title="CLEAR SEARCH"
                      aria-label="CLEAR SEARCH"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Excel Export Button (Icon only) */}
                <button
                  type="button"
                  onClick={handleExportDrawerExcel}
                  className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800/80 shadow-2xs transition-colors cursor-pointer"
                  title="EXPORT TO EXCEL"
                  aria-label="EXPORT TO EXCEL"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* PDF Save Button (Icon only) */}
                <button
                  type="button"
                  onClick={handleExportDrawerPdf}
                  className="p-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 rounded-lg border border-rose-200 dark:border-rose-800/80 shadow-2xs transition-colors cursor-pointer"
                  title="SAVE AS PDF"
                  aria-label="SAVE AS PDF"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>

                {/* Print Button (Icon only) */}
                <button
                  type="button"
                  onClick={handleDrawerPrint}
                  className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs transition-colors cursor-pointer"
                  title="PRINT RECORDS"
                  aria-label="PRINT RECORDS"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shrink-0"
                  title="CLOSE BREAKDOWN"
                  aria-label="CLOSE BREAKDOWN"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Stock Table with current stock quantity */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-750 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-750 text-[11px]">
                  <tr>
                    <th
                      onClick={() => handleSort('date')}
                      className={`${densityStyles.drawerTh} cursor-pointer select-none transition-colors group ${
                        sortField === 'date'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>DATE</span>
                        <SortIcon field="date" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('coldStorage')}
                      className={`${densityStyles.drawerTh} cursor-pointer select-none transition-colors group ${
                        sortField === 'coldStorage'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>COLD STORAGE & SR NO</span>
                        <SortIcon field="coldStorage" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('kblChallan')}
                      className={`${densityStyles.drawerTh} cursor-pointer select-none transition-colors group ${
                        sortField === 'kblChallan'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>KBL CHALLAN</span>
                        <SortIcon field="kblChallan" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('variety')}
                      className={`${densityStyles.drawerTh} cursor-pointer select-none transition-colors group ${
                        sortField === 'variety'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>VARIETY</span>
                        <SortIcon field="variety" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('className')}
                      className={`${densityStyles.drawerTh} cursor-pointer select-none transition-colors group ${
                        sortField === 'className'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>CLASS & GRADE</span>
                        <SortIcon field="className" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('bag')}
                      className={`${densityStyles.drawerTh} text-right cursor-pointer select-none transition-colors group ${
                        sortField === 'bag'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <span>BAG</span>
                        <SortIcon field="bag" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('kgPerBag')}
                      className={`${densityStyles.drawerTh} text-right cursor-pointer select-none transition-colors group ${
                        sortField === 'kgPerBag'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <span>KG/BAG</span>
                        <SortIcon field="kgPerBag" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('totalMt')}
                      className={`${densityStyles.drawerTh} text-right cursor-pointer select-none transition-colors group ${
                        sortField === 'totalMt'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <span>TOTAL MT</span>
                        <SortIcon field="totalMt" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                        {searchQuery ? (
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <p className="text-xs">No records matching &ldquo;{searchQuery}&rdquo; found.</p>
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                            >
                              Clear search filter
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs">No active stock remaining for this item.</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className={`${densityStyles.drawerTd} whitespace-nowrap`}>{item.date}</td>
                        <td className={densityStyles.drawerTd}>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{item.coldStorage}</span>
                            <span className="inline-flex items-center text-[10.5px] font-mono font-medium px-1.5 py-0.5 rounded bg-sky-100/90 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
                              {item.srNo}
                            </span>
                          </div>
                        </td>
                        <td className={`${densityStyles.drawerTd} font-semibold text-slate-800 dark:text-slate-200`}>{item.kblChallan}</td>
                        <td className={`${densityStyles.drawerTd} font-medium`}>{item.variety}</td>
                        <td className={densityStyles.drawerTd}>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.className}</span>
                            {item.grade && item.grade !== '-' && (
                              <>
                                <span className="text-slate-400 dark:text-slate-500">·</span>
                                <span className="text-slate-600 dark:text-slate-400">{item.grade}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className={`${densityStyles.drawerTd} text-right font-bold text-slate-900 dark:text-white`}>
                          {item.bag > 0 ? item.bag.toLocaleString() : '-'}
                        </td>
                        <td className={`${densityStyles.drawerTd} text-right text-slate-600 dark:text-slate-400`}>
                          {item.kgPerBag > 0 ? item.kgPerBag : '-'}
                        </td>
                        <td className={`${densityStyles.drawerTd} text-right font-bold text-emerald-600 dark:text-emerald-400`}>
                          {item.totalMt > 0 ? item.totalMt.toFixed(2) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredItems.length > 0 && (
                  <tfoot className="bg-slate-100/90 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                    <tr>
                      <td colSpan={5} className={`${densityStyles.drawerTh} text-left uppercase tracking-wider text-slate-900 dark:text-white`}>
                        TOTAL {searchQuery ? `(FILTERED ${filteredItems.length} OF ${details.items.length})` : ''}
                      </td>
                      <td className={`${densityStyles.drawerTh} text-right font-black text-slate-900 dark:text-white`}>
                        {filteredTotalBags > 0 ? filteredTotalBags.toLocaleString() : '-'}
                      </td>
                      <td className={`${densityStyles.drawerTh} text-right text-slate-400`}>
                        -
                      </td>
                      <td className={`${densityStyles.drawerTh} text-right font-black text-emerald-600 dark:text-emerald-400`}>
                        {filteredTotalMt > 0 ? filteredTotalMt.toFixed(2) : '-'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Footer Pagination Bar */}
            {filteredItems.length > 0 && (
              <div className="pt-2.5 mt-2 border-t border-slate-200 dark:border-slate-750 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 select-none">
                {/* Left Side: Minimal Rows selector and item counter */}
                <div className="flex items-center flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">Rows:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-1.5 py-0.5 text-xs font-semibold rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 shadow-2xs cursor-pointer"
                      aria-label="Rows per page"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={-1}>All</option>
                    </select>
                  </div>

                  <span className="text-slate-300 dark:text-slate-600">·</span>

                  <span className="font-medium text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs">
                    {rowsPerPage === -1 ? (
                      `${totalItems}`
                    ) : (
                      `${totalItems === 0 ? 0 : startIndex + 1}–${endIndex} of ${totalItems}`
                    )}
                  </span>
                </div>

                {/* Right Side: Icon-only buttons for pagination */}
                <div className="flex items-center gap-1">
                  {/* First Page Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={effectivePage <= 1}
                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title="First page"
                    aria-label="First page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Previous Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={effectivePage <= 1}
                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Page Indicator */}
                  <div className="px-2 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
                    {effectivePage} / {totalPages}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={effectivePage >= totalPages}
                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title="Next page"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Last Page Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={effectivePage >= totalPages}
                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title="Last page"
                    aria-label="Last page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Render expanded detail drawer for a selected row
  const renderExpandedDrawer = (row: (typeof matrixData.rows)[0]) => {
    const details = getExpandedRowDetails(row.id, selectedVarietyKey);

    return (
      <ExpandedBatchDetailDrawer
        key={`${row.id}-expanded`}
        row={row}
        selectedVarietyKey={selectedVarietyKey}
        details={details}
        colSpan={matrixData.columns.length + 2}
        densityStyles={densityStyles}
        onClose={() => setExpandedRowId(null)}
      />
    );
  };

  // Toggle row expansion or target specific variety
  const handleToggleRow = (rowId: string, varietyKey = 'ALL') => {
    if (expandedRowId === rowId && selectedVarietyKey === varietyKey) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(rowId);
      setSelectedVarietyKey(varietyKey);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
      {/* Header bar: Matches the exact bg-slate-800 text-slate-100 dark:bg-slate-850 dark:text-white header row of Cold Storage Wise Summary */}
      <div className="px-4 sm:px-5 py-2 sm:py-2.5 border-b-2 border-slate-900 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5 bg-slate-800 text-slate-100 dark:bg-slate-850 dark:text-white">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-slate-700 text-slate-200 border border-slate-600 shadow-xs">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              ITEM-WISE STOCK SUMMARY
            </h3>
          </div>
        </div>

        {/* Right side: Compact Filter Dropdown + Icon Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* Cold Storage Filter Dropdown: shifted to the left from the right-side buttons */}
          <select
            value={filters.coldStorageId || ''}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                coldStorageId: e.target.value || undefined,
              }));
            }}
            className="text-xs font-semibold rounded-lg border border-slate-700 bg-slate-750 hover:bg-slate-700 text-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 shadow-2xs w-[215px] cursor-pointer transition-colors mr-2 sm:mr-3.5"
            title="Filter by Cold Storage"
            aria-label="Filter by Cold Storage"
          >
            <option value="" className="bg-slate-800 text-white">All Cold Storages (Consolidated)</option>
            {coldStorages.map((cs) => (
              <option key={cs.id} value={cs.id} className="bg-slate-800 text-white">
                {cs.name} ({cs.code})
              </option>
            ))}
          </select>

          {/* Export Matrix / Excel (Icon only) */}
          <button
            onClick={handleExportExcel}
            className="p-1.5 text-emerald-300 bg-slate-750 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Export Matrix to Excel"
            aria-label="Export Matrix to Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          {/* Export PDF (Icon only) */}
          <button
            onClick={handleExportPdf}
            className="p-1.5 text-rose-300 bg-slate-750 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Export Matrix to PDF"
            aria-label="Export Matrix to PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
          </button>

          {/* Print (Icon only) */}
          <button
            onClick={handlePrint}
            className="p-1.5 text-slate-200 bg-slate-750 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Print Matrix"
            aria-label="Print Matrix"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
          </button>

          {/* Toggle Empty Grid (Icon only) */}
          {hasZeroResults && (
            <button
              onClick={() => setShowEmptyGrid(!showEmptyGrid)}
              className="p-1.5 text-slate-200 bg-slate-750 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shadow-2xs cursor-pointer"
              title={showEmptyGrid ? 'Show Empty Table Grid' : 'Hide Empty Grid'}
              aria-label={showEmptyGrid ? 'Show Empty Table Grid' : 'Hide Empty Grid'}
            >
              {showEmptyGrid ? (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Zero-Results Placeholder or Full Spreadsheet Matrix */}
      {hasZeroResults && !showEmptyGrid ? (
        <div className="py-12 px-6 text-center select-none bg-slate-50/40 dark:bg-slate-900/40">
          <div className="max-w-md mx-auto space-y-4">
            {/* Custom Aesthetic Vector Illustration */}
            <div className="relative inline-flex items-center justify-center">
              <svg
                className="w-32 h-32 text-slate-300 dark:text-slate-700"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Decorative concentric dashed circles */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="text-emerald-200 dark:text-emerald-900/40"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="42"
                  fill="currentColor"
                  className="text-emerald-50/60 dark:text-emerald-950/20"
                />

                {/* Warehouse pallet base */}
                <path
                  d="M32 78L60 90L88 78L60 66L32 78Z"
                  fill="currentColor"
                  className="text-amber-100 dark:text-amber-950/40"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M32 78V84L60 96V90L32 78Z"
                  fill="currentColor"
                  className="text-amber-200 dark:text-amber-900/60"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M88 78V84L60 96V90L88 78Z"
                  fill="currentColor"
                  className="text-amber-300 dark:text-amber-900/80"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />

                {/* Left seed potato sack */}
                <path
                  d="M40 56C40 48 45 42 52 42C59 42 64 48 64 56C64 68 62 76 52 76C42 76 40 68 40 56Z"
                  fill="currentColor"
                  className="text-rose-100 dark:text-rose-950/40"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M48 42L48 40C48 38 56 38 56 40L56 42"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Right seed potato sack */}
                <path
                  d="M58 54C58 46 63 40 70 40C77 40 82 46 82 54C82 66 80 74 70 74C60 74 58 66 58 54Z"
                  fill="currentColor"
                  className="text-sky-100 dark:text-sky-950/40"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M66 40L66 38C66 36 74 36 74 38L74 40"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Subtle leaf accent */}
                <path
                  d="M60 30C66 26 70 28 72 32C68 34 64 34 60 30Z"
                  fill="currentColor"
                  className="text-emerald-400 dark:text-emerald-500"
                />
              </svg>

              {/* Zero Stock Badge */}
              <div className="absolute -bottom-1 -right-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-xs flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-black tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                  - BAGS
                </span>
              </div>
            </div>

            {/* Title and Explanation */}
            <div>
              <h4 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                NO LIVE STOCK AVAILABLE
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 uppercase font-medium leading-relaxed">
                NO ACTIVE INVENTORY BATCHES FOUND FOR <span className="font-bold text-slate-700 dark:text-slate-300">{activeStorage}</span>.
                ALL STORED LOTS HAVE BEEN DISPATCHED OR NO RECEIPT HAS BEEN REGISTERED UNDER THIS SCOPE.
              </p>
            </div>

            {/* Action Bar to Restore View */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET ALL FILTERS</span>
              </button>

              <button
                onClick={() => setShowEmptyGrid(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>VIEW EMPTY SPREADSHEET MATRIX</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Spreadsheet Matrix Canvas */
        <div className={`${densityStyles.canvasPadding} overflow-x-auto transition-all`}>
          <div className="min-w-[720px] max-w-4xl mx-auto">
            <table className="w-full border-collapse select-text">
              <thead>
                <tr className="border-b-2 border-slate-800 dark:border-slate-200">
                  <th className={`${densityStyles.thCorner} text-left font-black text-slate-900 dark:text-white uppercase tracking-wider`}>
                    {/* Empty top-left header as per template */}
                  </th>
                  {matrixData.columns.map((col) => {
                    const colStyle = getVarietyColorStyle(col.key);
                    return (
                      <th
                        key={col.key}
                        className={`${densityStyles.thCol} text-center font-black uppercase tracking-wider border-t border-x ${colStyle.headerBg} ${colStyle.headerText} ${colStyle.headerBorder}`}
                      >
                        {col.label.toUpperCase()}
                      </th>
                    );
                  })}
                  <th
                    className={`${densityStyles.thCol} text-center font-black uppercase tracking-wider border-t border-x ${totalColStyle.headerBg} ${totalColStyle.headerText} ${totalColStyle.headerBorder}`}
                  >
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrixData.rows.map((row) => {
                  const isExpanded = expandedRowId === row.id;

                  // Gap row
                  if (row.type === 'gap') {
                    return (
                      <tr key={row.id} className={densityStyles.gapHeight}>
                        <td colSpan={matrixData.columns.length + 2} className="p-0" />
                      </tr>
                    );
                  }

                  // Grand total row
                  if (row.type === 'grandtotal') {
                    return (
                      <React.Fragment key={row.id}>
                        <tr key={row.id} className="pt-2 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                          <td
                            onClick={() => handleToggleRow(row.id, 'ALL')}
                            className={`${densityStyles.grandTotalLabel} text-left font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest cursor-pointer select-none`}
                            title="Click to view total inventory movement logs"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              )}
                              <span>{row.label.toUpperCase()}</span>
                            </div>
                          </td>
                          {matrixData.columns.map((col) => {
                            const cellVal = row.values[col.key] || 0;
                            const colStyle = getVarietyColorStyle(col.key);
                            return (
                              <td
                                key={col.key}
                                onClick={() => handleToggleRow(row.id, col.key)}
                                className={`${densityStyles.grandTotalCellTd} text-center cursor-pointer`}
                                title={`Click to view logs for ${col.label}`}
                              >
                                <div
                                  className={`border-2 ${colStyle.grandTotalBorder} ${colStyle.grandTotalBg} ${colStyle.grandTotalText} ${densityStyles.grandTotalCellBox} font-black uppercase rounded-sm shadow-2xs hover:brightness-95 transition-all`}
                                >
                                  {renderCellValue(cellVal)}
                                </div>
                              </td>
                            );
                          })}
                          <td
                            onClick={() => handleToggleRow(row.id, 'ALL')}
                            className={`${densityStyles.grandTotalCellTd} text-center cursor-pointer`}
                            title="Click to view logs for all varieties"
                          >
                            <div
                              className={`border-2 ${totalColStyle.grandTotalBorder} ${totalColStyle.grandTotalBg} ${totalColStyle.grandTotalText} ${densityStyles.grandTotalCellBox} font-black uppercase rounded-sm shadow-2xs hover:brightness-95 transition-all`}
                            >
                              {renderCellValue(row.total)}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && renderExpandedDrawer(row)}
                      </React.Fragment>
                    );
                  }

                  // Subtotal rows (e.g. Total Certify, Total Foundation, Total Pre-Foundation, TLS)
                  if (row.type === 'subtotal') {
                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          key={row.id}
                          className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td
                            onClick={() => handleToggleRow(row.id, 'ALL')}
                            className={`${densityStyles.subtotalLabel} text-left font-black text-slate-900 dark:text-white uppercase tracking-wider cursor-pointer select-none`}
                            title="Click to expand batch logs"
                          >
                            <div className="flex items-center gap-1.5">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                              <span>{row.label.toUpperCase()}</span>
                            </div>
                          </td>
                          {matrixData.columns.map((col) => {
                            const cellVal = row.values[col.key] || 0;
                            const colStyle = getVarietyColorStyle(col.key);
                            return (
                              <td
                                key={col.key}
                                onClick={() => handleToggleRow(row.id, col.key)}
                                className={`${densityStyles.subtotalCell} text-center font-bold uppercase cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${colStyle.subtotalText}`}
                                title={`Click to view logs for ${col.label}`}
                              >
                                {renderCellValue(cellVal)}
                              </td>
                            );
                          })}
                          <td
                            onClick={() => handleToggleRow(row.id, 'ALL')}
                            className={`${densityStyles.subtotalCell} text-center font-black uppercase cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${totalColStyle.subtotalText}`}
                            title="Click to view logs for all varieties"
                          >
                            {renderCellValue(row.total)}
                          </td>
                        </tr>
                        {isExpanded && renderExpandedDrawer(row)}
                      </React.Fragment>
                    );
                  }

                  // Single item row (e.g. Total Mini Tuber, Total Table Potato (TP), Total Non Traceable with SR)
                  if (row.type === 'single') {
                    return (
                      <React.Fragment key={row.id}>
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td
                            onClick={() => handleToggleRow(row.id, 'ALL')}
                            className={`${densityStyles.singleLabel} text-left font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider cursor-pointer select-none`}
                            title="Click to view logs"
                          >
                            <div className="flex items-center gap-1.5">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                              <span>{row.label.toUpperCase()}</span>
                            </div>
                          </td>
                          {matrixData.columns.map((col) => {
                            const cellVal = row.values[col.key] || 0;
                            const colStyle = getVarietyColorStyle(col.key);
                            return (
                              <td
                                key={col.key}
                                onClick={() => handleToggleRow(row.id, col.key)}
                                className={`${densityStyles.singleCell} text-center font-semibold uppercase cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${colStyle.cellText}`}
                                title={`Click to view logs for ${col.label}`}
                              >
                                {renderCellValue(cellVal)}
                              </td>
                            );
                          })}
                          <td
                            onClick={() => handleToggleRow(row.id, 'ALL')}
                            className={`${densityStyles.singleCell} text-center font-bold uppercase cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${totalColStyle.cellText}`}
                            title="Click to view logs for all varieties"
                          >
                            {renderCellValue(row.total)}
                          </td>
                        </tr>
                        {isExpanded && renderExpandedDrawer(row)}
                      </React.Fragment>
                    );
                  }

                  // Standard Data Row inside Boxed Group (Certify A/B/US, Foundation A/B/US/OS, Pre-Foundation A/B/US, TLS A/B)
                  return (
                    <React.Fragment key={row.id}>
                      <tr key={row.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors">
                        {/* Item label in clean uppercase with expand toggle */}
                        <td
                          onClick={() => handleToggleRow(row.id, 'ALL')}
                          className={`${densityStyles.regularLabel} text-left font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap uppercase tracking-wider cursor-pointer select-none`}
                          title="Click to expand batch history & movement logs"
                        >
                          <div className="flex items-center gap-1.5">
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-500 shrink-0 opacity-70 hover:opacity-100" />
                            )}
                            <span>{row.label.toUpperCase()}</span>
                          </div>
                        </td>

                        {/* Variety Columns with Box Border Grids and Light Thematic Colors */}
                        {matrixData.columns.map((col) => {
                          const cellVal = row.values[col.key] || 0;
                          const colStyle = getVarietyColorStyle(col.key);
                          return (
                            <td
                              key={col.key}
                              onClick={() => handleToggleRow(row.id, col.key)}
                              className={`border ${colStyle.cellBorder} ${colStyle.cellBg} ${colStyle.cellText} ${densityStyles.regularCell} text-center font-semibold uppercase cursor-pointer hover:brightness-95 active:scale-95 transition-all`}
                              title={`Click to view batch history & movement logs for ${col.label}`}
                            >
                              {renderCellValue(cellVal)}
                            </td>
                          );
                        })}

                        {/* Row Total cell */}
                        <td
                          onClick={() => handleToggleRow(row.id, 'ALL')}
                          className={`border ${totalColStyle.cellBorder} ${totalColStyle.cellBg} ${totalColStyle.cellText} ${densityStyles.regularCell} text-center font-bold uppercase cursor-pointer hover:brightness-95 active:scale-95 transition-all`}
                          title="Click to view all batch logs for this category"
                        >
                          {renderCellValue(row.total)}
                        </td>
                      </tr>
                      {isExpanded && renderExpandedDrawer(row)}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Stock Matrix / Batch Detail Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState((prev) => ({ ...prev, isOpen: false }))}
        documentTitle={printModalState.title}
        subtitle={printModalState.subtitle}
        columns={printModalState.columns}
        data={printModalState.data}
        summaryItems={printModalState.summaryItems}
      />
    </div>
  );
};
