import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TableDensity } from '../../types';
import { Building2, Plus, Download, FileText, Printer, ChevronDown, Package, X, Search } from 'lucide-react';
import { ColdStorageEmptyState } from '../coldStorage/ColdStorageEmptyState';
import { Modal } from '../common/Modal';
import { exportToExcel, exportToPdf, validateAndTriggerPrint, ExportColumn } from '../../utils/exportUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { SortIcon } from '../common/SortIcon';

interface ColdStorageFacilityTableProps {
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  onPrint?: () => void;
  density?: TableDensity;
}

export const ColdStorageFacilityTable: React.FC<ColdStorageFacilityTableProps> = ({
  onExportExcel,
  onExportPdf,
  onPrint,
  density = 'normal',
}) => {
  const {
    coldStorages,
    stockTransactions,
    deliveryTransactions,
    varieties,
    seedClasses,
    grades,
    companySettings,
    currentUser,
    addColdStorage,
    addToast,
  } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [highlightedFacilityId, setHighlightedFacilityId] = useState<string | null>(null);
  const [expandedFacilityIds, setExpandedFacilityIds] = useState<string[]>([]);
  const [facilitySearchQueries, setFacilitySearchQueries] = useState<Record<string, string>>({});

  const [printModalConfig, setPrintModalConfig] = useState<{
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

  // Main table sorting
  const [csSortField, setCsSortField] = useState<'name' | 'received' | 'delivered' | 'remaining' | 'occupancy'>('name');
  const [csSortDir, setCsSortDir] = useState<'asc' | 'desc'>('asc');

  // Breakdown items sorting
  const [breakdownSortField, setBreakdownSortField] = useState<'varietyName' | 'classAndGrade' | 'received' | 'delivered' | 'remaining' | 'totalMt'>('varietyName');
  const [breakdownSortDir, setBreakdownSortDir] = useState<'asc' | 'desc'>('asc');

  const handleMainSort = (field: 'name' | 'received' | 'delivered' | 'remaining' | 'occupancy') => {
    if (csSortField === field) {
      setCsSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCsSortField(field);
      setCsSortDir('asc');
    }
  };

  const handleBreakdownSort = (field: typeof breakdownSortField) => {
    if (breakdownSortField === field) {
      setBreakdownSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setBreakdownSortField(field);
      setBreakdownSortDir('asc');
    }
  };

  const toggleExpandFacility = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Form state for quick add storage
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('');
  const [capacity, setCapacity] = useState<number>(100000);
  const [rentPerBag, setRentPerBag] = useState<number>(280);
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setCode(`CS-${coldStorages.length + 1}`);
    setName('');
    setLocation('');
    setDistrict('');
    setCapacity(100000);
    setRentPerBag(280);
    setContactPerson('');
    setPhone('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !location.trim()) {
      setFormError('Facility Code, Name, and Location are required.');
      return;
    }

    addColdStorage({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      location: location.trim(),
      district: district.trim() || undefined,
      capacity: Number(capacity) || 0,
      rentPerBag: Number(rentPerBag) || 0,
      contactPerson: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      status: 'active',
      isActive: true,
    });

    addToast(`Storage facility "${name.trim()}" added successfully!`, 'success');
    setIsAddModalOpen(false);
  };

  // Calculate live facility metrics directly from raw transactions
  // This automatically recalculates whenever stock or delivery changes
  const facilityData = useMemo(() => {
    return coldStorages.map((cs) => {
      const received = stockTransactions
        .filter((s) => s.coldStorageId === cs.id)
        .reduce((sum, s) => sum + s.sackQuantity, 0);

      const delivered = deliveryTransactions
        .filter((d) => d.coldStorageId === cs.id)
        .reduce((sum, d) => sum + d.sackQuantity, 0);

      const remaining = received - delivered;

      const occupancy =
        cs.capacity && cs.capacity > 0 ? (remaining / cs.capacity) * 100 : null;

      return {
        id: cs.id,
        code: cs.code,
        name: cs.name,
        location: cs.location || '-',
        capacity: cs.capacity || 0,
        received,
        delivered,
        remaining,
        occupancy,
      };
    });
  }, [coldStorages, stockTransactions, deliveryTransactions]);

  // Overall totals across all cold storages
  const totals = useMemo(() => {
    const totalCapacity = facilityData.reduce((sum, f) => sum + f.capacity, 0);
    const totalReceived = facilityData.reduce((sum, f) => sum + f.received, 0);
    const totalDelivered = facilityData.reduce((sum, f) => sum + f.delivered, 0);
    const totalRemaining = totalReceived - totalDelivered;
    const overallOccupancy =
      totalCapacity > 0 ? (totalRemaining / totalCapacity) * 100 : null;

    return {
      totalCapacity,
      totalReceived,
      totalDelivered,
      totalRemaining,
      overallOccupancy,
    };
  }, [facilityData]);

  // Sortable facilityData
  const sortedFacilityData = useMemo(() => {
    return [...facilityData].sort((a, b) => {
      let valA: any = a[csSortField];
      let valB: any = b[csSortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA === null || valA === undefined) valA = -Infinity;
      if (valB === null || valB === undefined) valB = -Infinity;
      if (valA < valB) return csSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return csSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [facilityData, csSortField, csSortDir]);

  const handleExportFacilityExcel = async (
    facility: (typeof facilityData)[0],
    items: ReturnType<typeof getFacilityItemBreakdown>
  ) => {
    if (items.length === 0) {
      addToast('No items to export for this facility', 'info');
      return;
    }
    const exportColumns = [
      { header: 'POTATO VARIETY', key: 'varietyName', width: 22 },
      { header: 'CLASS & GRADE', key: 'classAndGrade', width: 20 },
      { header: 'RECEIVED (BAGS)', key: 'received', width: 16, align: 'right' as const, isNumeric: true },
      { header: 'DELIVERED (BAGS)', key: 'delivered', width: 16, align: 'right' as const, isNumeric: true },
      { header: 'REMAINING STOCK (BAGS)', key: 'remaining', width: 22, align: 'right' as const, isNumeric: true },
      { header: 'TOTAL MT', key: 'totalMt', width: 16, align: 'right' as const, isNumeric: true },
      { header: 'SR NUMBERS', key: 'srNumbers', width: 30 },
    ];
    const exportData = items.map((item) => ({
      varietyName: item.varietyName,
      classAndGrade:
        item.gradeName && item.gradeName !== '-'
          ? `${item.className} · ${item.gradeName}`
          : item.className,
      received: item.received,
      delivered: item.delivered,
      remaining: item.remaining,
      totalMt: item.totalMt,
      srNumbers: item.srList.join(', ') || '-',
    }));
    const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

    await exportToExcel(
      exportData,
      exportColumns,
      `${facility.name.replace(/\s+/g, '_')}_Stock_Breakdown.xlsx`,
      `${facility.name.toUpperCase()} - ITEM-WISE STOCK BREAKDOWN`,
      companySettings,
      `Cold Storage Facility Breakdown: ${facility.name}`,
      { printedBy: printedByName, includeSummary: true }
    );
    addToast(`Exported ${facility.name} breakdown to Excel`, 'success');
  };

  const handleExportFacilityPdf = (
    facility: (typeof facilityData)[0],
    items: ReturnType<typeof getFacilityItemBreakdown>
  ) => {
    if (items.length === 0) {
      addToast('No items to export for this facility', 'info');
      return;
    }
    const exportColumns = [
      { header: 'POTATO VARIETY', key: 'varietyName', width: 22 },
      { header: 'CLASS & GRADE', key: 'classAndGrade', width: 20 },
      { header: 'RECEIVED', key: 'received', width: 16, align: 'right' as const, isNumeric: true },
      { header: 'DELIVERED', key: 'delivered', width: 16, align: 'right' as const, isNumeric: true },
      { header: 'REMAINING', key: 'remaining', width: 20, align: 'right' as const, isNumeric: true },
      { header: 'TOTAL MT', key: 'totalMt', width: 16, align: 'right' as const, isNumeric: true },
      { header: 'SR NOS', key: 'srNumbers', width: 25 },
    ];
    const exportData = items.map((item) => ({
      varietyName: item.varietyName,
      classAndGrade:
        item.gradeName && item.gradeName !== '-'
          ? `${item.className} · ${item.gradeName}`
          : item.className,
      received: item.received.toLocaleString(),
      delivered: item.delivered.toLocaleString(),
      remaining: item.remaining.toLocaleString(),
      totalMt: item.totalMt.toFixed(2),
      srNumbers: item.srList.join(', ') || '-',
    }));

    const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

    exportToPdf(
      exportData,
      exportColumns,
      `${facility.name.replace(/\s+/g, '_')}_Stock_Breakdown.pdf`,
      `${facility.name.toUpperCase()} - ITEM-WISE STOCK BREAKDOWN`,
      companySettings,
      'l',
      `Facility: ${facility.name} (${facility.code})`,
      { printedBy: printedByName, includeSummary: true }
    );
    addToast(`Generated ${facility.name} PDF report`, 'success');
  };

  const handleExportFacilityPrint = (
    facility: (typeof facilityData)[0],
    items: ReturnType<typeof getFacilityItemBreakdown>
  ) => {
    if (items.length === 0) {
      addToast('No items to print for this facility', 'info');
      return;
    }

    const printColumns: ExportColumn[] = [
      { header: 'POTATO VARIETY', key: 'varietyName', width: 22 },
      { header: 'CLASS & GRADE', key: 'classAndGrade', width: 20 },
      { header: 'RECEIVED', key: 'received', width: 16, align: 'right', isNumeric: true },
      { header: 'DELIVERED', key: 'delivered', width: 16, align: 'right', isNumeric: true },
      { header: 'REMAINING', key: 'remaining', width: 20, align: 'right', isNumeric: true },
      { header: 'TOTAL MT', key: 'totalMt', width: 16, align: 'right', isNumeric: true },
      { header: 'SR NOS', key: 'srNumbers', width: 25 },
    ];

    const printData = items.map((item) => ({
      varietyName: item.varietyName,
      classAndGrade:
        item.gradeName && item.gradeName !== '-'
          ? `${item.className} · ${item.gradeName}`
          : item.className,
      received: item.received,
      delivered: item.delivered,
      remaining: item.remaining,
      totalMt: item.totalMt,
      srNumbers: item.srList.join(', ') || '-',
    }));

    const totalRec = items.reduce((acc, it) => acc + it.received, 0);
    const totalDel = items.reduce((acc, it) => acc + it.delivered, 0);
    const totalRem = items.reduce((acc, it) => acc + it.remaining, 0);
    const totalMt = items.reduce((acc, it) => acc + it.totalMt, 0);

    setPrintModalConfig({
      isOpen: true,
      title: `${facility.name.toUpperCase()} - ITEM-WISE STOCK BREAKDOWN`,
      subtitle: `Facility Code: ${facility.code} • Capacity: ${(facility.capacity || 0).toLocaleString()} Bags`,
      columns: printColumns,
      data: printData,
      summaryItems: [
        { label: 'Facility', value: facility.name },
        { label: 'Total Received', value: totalRec.toLocaleString() },
        { label: 'Total Delivered', value: totalDel.toLocaleString() },
        { label: 'Current Remaining', value: totalRem.toLocaleString() },
        { label: 'Total MT', value: `${totalMt.toFixed(2)} MT` },
      ],
    });
  };

  const getOccupancyColor = (pct: number | null) => {
    if (pct === null) return 'text-slate-400 bg-slate-100 dark:bg-slate-800';
    if (pct > 90) return 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900';
    if (pct > 75) return 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900';
    return 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900';
  };

  // Distinct subtle light / pastel color theme per cold storage row with smooth hover background shift
  const COLD_STORAGE_ROW_PALETTE = [
    {
      bg: 'bg-sky-50/40 dark:bg-sky-950/20',
      hover: 'hover:bg-sky-100/75 dark:hover:bg-sky-900/50 hover:shadow-xs',
      highlight: 'bg-sky-100/90 dark:bg-sky-950/80 ring-1 ring-inset ring-sky-300 dark:ring-sky-700',
      borderLeft: 'border-l-[3px] border-l-sky-500',
      accentIndicator: 'bg-sky-500',
      badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
      remainingText: 'text-sky-700 dark:text-sky-300',
    },
    {
      bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
      hover: 'hover:bg-emerald-100/75 dark:hover:bg-emerald-900/50 hover:shadow-xs',
      highlight: 'bg-emerald-100/90 dark:bg-emerald-950/80 ring-1 ring-inset ring-emerald-300 dark:ring-emerald-700',
      borderLeft: 'border-l-[3px] border-l-emerald-500',
      accentIndicator: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      remainingText: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      bg: 'bg-amber-50/40 dark:bg-amber-950/20',
      hover: 'hover:bg-amber-100/75 dark:hover:bg-amber-900/50 hover:shadow-xs',
      highlight: 'bg-amber-100/90 dark:bg-amber-950/80 ring-1 ring-inset ring-amber-300 dark:ring-amber-700',
      borderLeft: 'border-l-[3px] border-l-amber-500',
      accentIndicator: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      remainingText: 'text-amber-700 dark:text-amber-300',
    },
    {
      bg: 'bg-purple-50/40 dark:bg-purple-950/20',
      hover: 'hover:bg-purple-100/75 dark:hover:bg-purple-900/50 hover:shadow-xs',
      highlight: 'bg-purple-100/90 dark:bg-purple-950/80 ring-1 ring-inset ring-purple-300 dark:ring-purple-700',
      borderLeft: 'border-l-[3px] border-l-purple-500',
      accentIndicator: 'bg-purple-500',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
      remainingText: 'text-purple-700 dark:text-purple-300',
    },
    {
      bg: 'bg-rose-50/40 dark:bg-rose-950/20',
      hover: 'hover:bg-rose-100/75 dark:hover:bg-rose-900/50 hover:shadow-xs',
      highlight: 'bg-rose-100/90 dark:bg-rose-950/80 ring-1 ring-inset ring-rose-300 dark:ring-rose-700',
      borderLeft: 'border-l-[3px] border-l-rose-500',
      accentIndicator: 'bg-rose-500',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
      remainingText: 'text-rose-700 dark:text-rose-300',
    },
    {
      bg: 'bg-teal-50/40 dark:bg-teal-950/20',
      hover: 'hover:bg-teal-100/75 dark:hover:bg-teal-900/50 hover:shadow-xs',
      highlight: 'bg-teal-100/90 dark:bg-teal-950/80 ring-1 ring-inset ring-teal-300 dark:ring-teal-700',
      borderLeft: 'border-l-[3px] border-l-teal-500',
      accentIndicator: 'bg-teal-500',
      badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
      remainingText: 'text-teal-700 dark:text-teal-300',
    },
    {
      bg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
      hover: 'hover:bg-indigo-100/75 dark:hover:bg-indigo-900/50 hover:shadow-xs',
      highlight: 'bg-indigo-100/90 dark:bg-indigo-950/80 ring-1 ring-inset ring-indigo-300 dark:ring-indigo-700',
      borderLeft: 'border-l-[3px] border-l-indigo-500',
      accentIndicator: 'bg-indigo-500',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
      remainingText: 'text-indigo-700 dark:text-indigo-300',
    },
    {
      bg: 'bg-cyan-50/40 dark:bg-cyan-950/20',
      hover: 'hover:bg-cyan-100/75 dark:hover:bg-cyan-900/50 hover:shadow-xs',
      highlight: 'bg-cyan-100/90 dark:bg-cyan-950/80 ring-1 ring-inset ring-cyan-300 dark:ring-cyan-700',
      borderLeft: 'border-l-[3px] border-l-cyan-500',
      accentIndicator: 'bg-cyan-500',
      badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
      remainingText: 'text-cyan-700 dark:text-cyan-300',
    },
  ];

  // Helper to extract detailed item-wise breakdown for an expanded cold storage
  const getFacilityItemBreakdown = (facilityId: string) => {
    const facilityStocks = stockTransactions.filter(
      (s) => s.coldStorageId === facilityId && s.status === 'approved'
    );
    const facilityDeliveries = deliveryTransactions.filter(
      (d) => d.coldStorageId === facilityId && (d.status === 'approved' || d.status === 'completed')
    );

    const itemsMap: Record<
      string,
      {
        key: string;
        varietyId: string;
        varietyName: string;
        className: string;
        gradeName: string;
        received: number;
        delivered: number;
        kgPerBag: number;
        srNumbers: Set<string>;
      }
    > = {};

    facilityStocks.forEach((s) => {
      const key = `${s.varietyId}_${s.classId || 'default'}_${s.gradeId || 'default'}`;
      const v = varieties.find((item) => item.id === s.varietyId);
      const cls = seedClasses.find((item) => item.id === s.classId);
      const grd = grades.find((item) => item.id === s.gradeId);

      if (!itemsMap[key]) {
        itemsMap[key] = {
          key,
          varietyId: s.varietyId,
          varietyName: v?.name || 'Unknown Variety',
          className: cls?.name || 'Standard',
          gradeName: grd?.name || '-',
          received: 0,
          delivered: 0,
          kgPerBag: s.kgPerBag || 50,
          srNumbers: new Set<string>(),
        };
      }

      itemsMap[key].received += s.sackQuantity;
      if (s.srNo) {
        itemsMap[key].srNumbers.add(s.srNo);
      }
    });

    facilityDeliveries.forEach((d) => {
      const key = `${d.varietyId}_${d.classId || 'default'}_${d.gradeId || 'default'}`;
      if (itemsMap[key]) {
        itemsMap[key].delivered += d.sackQuantity;
      } else {
        const fallbackKey = Object.keys(itemsMap).find((k) => itemsMap[k].varietyId === d.varietyId);
        if (fallbackKey) {
          itemsMap[fallbackKey].delivered += d.sackQuantity;
        }
      }
    });

    return Object.values(itemsMap)
      .map((item) => {
        const remaining = Math.max(0, item.received - item.delivered);
        const totalMt = Number(((remaining * item.kgPerBag) / 1000).toFixed(2));
        return {
          ...item,
          remaining,
          totalMt,
          srList: Array.from(item.srNumbers),
        };
      })
      .sort((a, b) => b.remaining - a.remaining);
  };

  const thPadding = density === 'compact' ? 'py-1 px-2.5 text-[10.5px]' : density === 'comfortable' ? 'py-2.5 px-3.5 text-xs sm:text-sm' : 'py-1.5 px-3 text-[11px]';
  const tdPadding = density === 'compact' ? 'py-1 px-2.5 text-[11px]' : density === 'comfortable' ? 'py-2.5 px-3.5 text-xs sm:text-sm' : 'py-1.5 px-3 text-xs';
  const badgePadding = density === 'compact' ? 'text-[11px] px-2 py-0.5' : density === 'comfortable' ? 'text-xs sm:text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';
  const totalPadding = density === 'compact' ? 'py-1 px-2.5 text-xs' : density === 'comfortable' ? 'py-3 px-3.5 text-sm' : 'py-2 px-3 text-xs';
  const innerThPadding = density === 'compact' ? 'py-1 px-2 text-[10px]' : density === 'comfortable' ? 'py-2 px-3 text-xs' : 'py-1.5 px-3 text-[10.5px]';
  const innerTdPadding = density === 'compact' ? 'py-1 px-2 text-[10.5px]' : density === 'comfortable' ? 'py-2 px-3 text-xs' : 'py-1.5 px-3 text-xs';

  return (
    <div className="bg-white dark:bg-slate-900 border border-sky-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden print:overflow-visible print:border-none print:shadow-none">
      {/* Section Header - Eye-catching themed background */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-sky-200/80 dark:border-sky-900/60 bg-gradient-to-r from-sky-100/90 via-sky-50/80 to-blue-50/70 dark:from-slate-850 dark:via-sky-950/40 dark:to-slate-900 print:bg-transparent print:border-b-2 print:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-sky-600 text-white shadow-xs print:hidden">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-sky-950 dark:text-white uppercase tracking-wider">
              COLD STORAGE WISE SUMMARY
            </h3>
          </div>
        </div>

        {/* Right side: Excel, PDF, Print action buttons */}
        {(onExportExcel || onExportPdf || onPrint) && (
          <div className="flex items-center gap-1 sm:gap-1.5 no-print">
            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-200 bg-white/90 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/50 rounded-lg border border-emerald-300 dark:border-emerald-800/80 transition-colors shadow-2xs cursor-pointer"
                title="Export Cold Storage Summary to Excel"
              >
                <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>EXCEL</span>
              </button>
            )}

            {onExportPdf && (
              <button
                type="button"
                onClick={onExportPdf}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase text-rose-800 dark:text-rose-200 bg-white/90 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 rounded-lg border border-rose-300 dark:border-rose-800/80 transition-colors shadow-2xs cursor-pointer"
                title="Export Cold Storage Summary to PDF"
              >
                <FileText className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                <span>PDF</span>
              </button>
            )}

            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-700 dark:text-slate-200 bg-white/90 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Print Cold Storage Summary"
              >
                <Printer className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                <span>PRINT</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content: Empty state or data table */}
      {facilityData.length === 0 ? (
        <ColdStorageEmptyState onAddStorage={handleOpenAddModal} />
      ) : (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-800 text-slate-100 dark:bg-slate-850 dark:text-white font-bold border-b-2 border-slate-900 dark:border-slate-700 print:bg-slate-100 print:text-black">
              <tr>
                <th
                  onClick={() => handleMainSort('name')}
                  className={`${thPadding} font-semibold uppercase tracking-wider text-slate-100 dark:text-white cursor-pointer select-none transition-colors group ${
                    csSortField === 'name' ? 'bg-slate-700 text-sky-400' : 'hover:bg-slate-700/70'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>COLD STORAGE NAME</span>
                    <SortIcon field="name" currentField={csSortField} direction={csSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleMainSort('received')}
                  className={`${thPadding} text-right font-semibold uppercase tracking-wider text-slate-100 dark:text-white cursor-pointer select-none transition-colors group ${
                    csSortField === 'received' ? 'bg-slate-700 text-sky-400' : 'hover:bg-slate-700/70'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>RECEIVED</span>
                    <SortIcon field="received" currentField={csSortField} direction={csSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleMainSort('delivered')}
                  className={`${thPadding} text-right font-semibold uppercase tracking-wider text-slate-100 dark:text-white cursor-pointer select-none transition-colors group ${
                    csSortField === 'delivered' ? 'bg-slate-700 text-sky-400' : 'hover:bg-slate-700/70'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>DELIVERED</span>
                    <SortIcon field="delivered" currentField={csSortField} direction={csSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleMainSort('remaining')}
                  className={`${thPadding} text-right font-semibold uppercase tracking-wider text-slate-100 dark:text-white cursor-pointer select-none transition-colors group ${
                    csSortField === 'remaining' ? 'bg-slate-700 text-sky-400' : 'hover:bg-slate-700/70'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>REMAINING STOCK</span>
                    <SortIcon field="remaining" currentField={csSortField} direction={csSortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleMainSort('occupancy')}
                  className={`${thPadding} text-center font-semibold uppercase tracking-wider text-slate-100 dark:text-white cursor-pointer select-none transition-colors group ${
                    csSortField === 'occupancy' ? 'bg-slate-700 text-sky-400' : 'hover:bg-slate-700/70'
                  }`}
                >
                  <div className="inline-flex items-center justify-center gap-1.5">
                    <span>OCCUPANCY</span>
                    <SortIcon field="occupancy" currentField={csSortField} direction={csSortDir} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
              {sortedFacilityData.map((f, idx) => {
                const isHighlighted = highlightedFacilityId === f.id;
                const isExpanded = expandedFacilityIds.includes(f.id);
                const palette = COLD_STORAGE_ROW_PALETTE[idx % COLD_STORAGE_ROW_PALETTE.length];
                return (
                  <React.Fragment key={f.id}>
                    <tr
                      onClick={() => setHighlightedFacilityId(isHighlighted ? null : f.id)}
                      title="Click to highlight; click arrow or name to view item details"
                      className={`group relative cursor-pointer transition-colors duration-200 ease-in-out select-none ${palette.borderLeft} ${
                        isHighlighted
                          ? palette.highlight
                          : `${palette.bg} ${palette.hover}`
                      } print:hover:bg-transparent`}
                    >
                      <td className={`relative ${tdPadding} font-semibold text-slate-900 dark:text-white transition-colors`}>
                        {/* Active / Hover Row Indicator Bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 rounded-r ${
                            isHighlighted
                              ? `${palette.accentIndicator} opacity-100`
                              : `${palette.accentIndicator} opacity-0 group-hover:opacity-100`
                          } print:hidden`}
                        />
                        <div className="flex items-center gap-1.5 pl-0.5">
                          {/* Visual Expand/Collapse Icon Button */}
                          <button
                            type="button"
                            onClick={(e) => toggleExpandFacility(f.id, e)}
                            className={`p-1 rounded-md transition-all duration-150 cursor-pointer flex-shrink-0 ${
                              isExpanded
                                ? 'bg-sky-200/90 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 shadow-2xs'
                                : 'hover:bg-slate-200/70 dark:hover:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                            }`}
                            title={isExpanded ? 'Collapse items view' : 'Expand detailed items view'}
                            aria-label={isExpanded ? 'Collapse items view' : 'Expand detailed items view'}
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? 'transform rotate-180 text-sky-700 dark:text-sky-300' : ''
                              }`}
                            />
                          </button>
                          <span
                            onClick={(e) => toggleExpandFacility(f.id, e)}
                            className={`inline-block font-semibold rounded-md transition-all shadow-2xs group-hover:shadow-xs group-hover:translate-x-0.5 cursor-pointer ${badgePadding} ${palette.badge}`}
                          >
                            {f.name}
                          </span>
                        </div>
                      </td>
                      <td className={`${tdPadding} text-right font-medium text-slate-700 dark:text-slate-200`}>
                        {f.received > 0 ? f.received.toLocaleString() : '-'}
                      </td>
                      <td className={`${tdPadding} text-right font-medium text-slate-700 dark:text-slate-200`}>
                        {f.delivered > 0 ? f.delivered.toLocaleString() : '-'}
                      </td>
                      <td className={`${tdPadding} text-right font-bold ${palette.remainingText}`}>
                        <span className="inline-block group-hover:scale-105 transition-transform duration-150 origin-right">
                          {f.remaining > 0 ? f.remaining.toLocaleString() : '-'}
                        </span>
                      </td>
                      <td className={`${tdPadding} text-center`}>
                        {f.occupancy !== null ? (
                          <div className="inline-flex items-center justify-center gap-1">
                            <span
                              className={`inline-block px-2 py-0.2 rounded-full text-[10.5px] font-bold group-hover:ring-1 transition-all duration-150 ${getOccupancyColor(
                                f.occupancy
                              )}`}
                            >
                              {f.occupancy.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>

                    {/* Detailed Item-Wise Breakdown Accordion Row */}
                    {isExpanded && (
                      <tr key={`${f.id}-expanded`} className="bg-slate-50/95 dark:bg-slate-900/95 border-b-2 border-sky-400/80 dark:border-sky-600/80">
                        <td colSpan={5} className="p-2 sm:p-3">
                          <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200/90 dark:border-slate-750 shadow-xs p-3 sm:p-4 text-left">
                            {/* Drawer / Sub-header with Search (without placeholder) and icon-only Excel, PDF, Print buttons right-aligned */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-slate-750">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                  <Package className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    ITEM-WISE STOCK BREAKDOWN — <span className="text-sky-700 dark:text-sky-400">{f.name.toUpperCase()}</span>
                                  </h4>
                                </div>
                              </div>

                              {/* Right side: Search box without placeholder + Icon-only Excel, PDF, Print buttons + Close */}
                              <div className="flex items-center flex-wrap gap-2">
                                {/* Search box without placeholder */}
                                <div className="relative w-36 sm:w-52">
                                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  <input
                                    type="text"
                                    placeholder=""
                                    value={facilitySearchQueries[f.id] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFacilitySearchQueries((prev) => ({ ...prev, [f.id]: val }));
                                    }}
                                    className="w-full pl-7 pr-6 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs transition-all"
                                    aria-label="Search items"
                                  />
                                  {facilitySearchQueries[f.id] && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFacilitySearchQueries((prev) => ({ ...prev, [f.id]: '' }))
                                      }
                                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                                      title="Clear search"
                                      aria-label="Clear search"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                {/* Excel button: Icon ONLY */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const rawItems = getFacilityItemBreakdown(f.id);
                                    const q = (facilitySearchQueries[f.id] || '').toLowerCase().trim();
                                    const fItems = q
                                      ? rawItems.filter(
                                          (item) =>
                                            item.varietyName.toLowerCase().includes(q) ||
                                            item.className.toLowerCase().includes(q) ||
                                            item.gradeName.toLowerCase().includes(q) ||
                                            item.srList.some((sr) => sr.toLowerCase().includes(q))
                                        )
                                      : rawItems;
                                    handleExportFacilityExcel(f, fItems);
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs transition-colors cursor-pointer"
                                  title="Export to Excel"
                                  aria-label="Export to Excel"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                </button>

                                {/* PDF button: Icon ONLY */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const rawItems = getFacilityItemBreakdown(f.id);
                                    const q = (facilitySearchQueries[f.id] || '').toLowerCase().trim();
                                    const fItems = q
                                      ? rawItems.filter(
                                          (item) =>
                                            item.varietyName.toLowerCase().includes(q) ||
                                            item.className.toLowerCase().includes(q) ||
                                            item.gradeName.toLowerCase().includes(q) ||
                                            item.srList.some((sr) => sr.toLowerCase().includes(q))
                                        )
                                      : rawItems;
                                    handleExportFacilityPdf(f, fItems);
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/80 shadow-2xs transition-colors cursor-pointer"
                                  title="Save as PDF"
                                  aria-label="Save as PDF"
                                >
                                  <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                </button>

                                {/* Print button: Icon ONLY */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const rawItems = getFacilityItemBreakdown(f.id);
                                    const q = (facilitySearchQueries[f.id] || '').toLowerCase().trim();
                                    const fItems = q
                                      ? rawItems.filter(
                                          (item) =>
                                            item.varietyName.toLowerCase().includes(q) ||
                                            item.className.toLowerCase().includes(q) ||
                                            item.gradeName.toLowerCase().includes(q) ||
                                            item.srList.some((sr) => sr.toLowerCase().includes(q))
                                        )
                                      : rawItems;
                                    handleExportFacilityPrint(f, fItems);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                                  title="Print"
                                  aria-label="Print"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                                </button>

                                {/* Close Button */}
                                <button
                                  type="button"
                                  onClick={(e) => toggleExpandFacility(f.id, e)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Collapse items view"
                                  aria-label="Collapse items view"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Items Table */}
                            {(() => {
                              const rawItems = getFacilityItemBreakdown(f.id);
                              if (rawItems.length === 0) {
                                return (
                                  <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    No active potato seed items currently stored in {f.name}.
                                  </div>
                                );
                              }

                              const q = (facilitySearchQueries[f.id] || '').toLowerCase().trim();
                              const filteredItems = q
                                ? rawItems.filter(
                                    (item) =>
                                      item.varietyName.toLowerCase().includes(q) ||
                                      item.className.toLowerCase().includes(q) ||
                                      item.gradeName.toLowerCase().includes(q) ||
                                      item.srList.some((sr) => sr.toLowerCase().includes(q))
                                  )
                                : rawItems;

                              const sortedItems = [...filteredItems].sort((a, b) => {
                                let valA: any;
                                let valB: any;
                                if (breakdownSortField === 'varietyName') {
                                  valA = a.varietyName.toLowerCase();
                                  valB = b.varietyName.toLowerCase();
                                } else if (breakdownSortField === 'classAndGrade') {
                                  valA = `${a.className} ${a.gradeName}`.toLowerCase();
                                  valB = `${b.className} ${b.gradeName}`.toLowerCase();
                                } else {
                                  valA = (a as any)[breakdownSortField];
                                  valB = (b as any)[breakdownSortField];
                                }
                                if (valA < valB) return breakdownSortDir === 'asc' ? -1 : 1;
                                if (valA > valB) return breakdownSortDir === 'asc' ? 1 : -1;
                                return 0;
                              });

                              const totalItemsRemaining = filteredItems.reduce((sum, item) => sum + item.remaining, 0);
                              const totalItemsDelivered = filteredItems.reduce((sum, item) => sum + item.delivered, 0);
                              const totalItemsReceived = filteredItems.reduce((sum, item) => sum + item.received, 0);
                              const totalItemsMt = filteredItems.reduce((sum, item) => sum + item.totalMt, 0);

                              return (
                                <div className="overflow-x-auto border border-slate-200 dark:border-slate-750 rounded-lg">
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px]">
                                      <tr>
                                        <th
                                          onClick={() => handleBreakdownSort('varietyName')}
                                          className={`${innerThPadding} uppercase tracking-wider cursor-pointer select-none transition-colors group ${
                                            breakdownSortField === 'varietyName'
                                              ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                                              : 'hover:text-slate-900 dark:hover:text-white'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <span>POTATO VARIETY</span>
                                            <SortIcon field="varietyName" currentField={breakdownSortField} direction={breakdownSortDir} />
                                          </div>
                                        </th>
                                        <th
                                          onClick={() => handleBreakdownSort('classAndGrade')}
                                          className={`${innerThPadding} uppercase tracking-wider cursor-pointer select-none transition-colors group ${
                                            breakdownSortField === 'classAndGrade'
                                              ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                                              : 'hover:text-slate-900 dark:hover:text-white'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <span>CLASS & GRADE</span>
                                            <SortIcon field="classAndGrade" currentField={breakdownSortField} direction={breakdownSortDir} />
                                          </div>
                                        </th>
                                        <th
                                          onClick={() => handleBreakdownSort('received')}
                                          className={`${innerThPadding} text-right uppercase tracking-wider cursor-pointer select-none transition-colors group ${
                                            breakdownSortField === 'received'
                                              ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                                              : 'hover:text-slate-900 dark:hover:text-white'
                                          }`}
                                        >
                                          <div className="inline-flex items-center justify-end gap-1.5">
                                            <span>RECEIVED</span>
                                            <SortIcon field="received" currentField={breakdownSortField} direction={breakdownSortDir} />
                                          </div>
                                        </th>
                                        <th
                                          onClick={() => handleBreakdownSort('delivered')}
                                          className={`${innerThPadding} text-right uppercase tracking-wider cursor-pointer select-none transition-colors group ${
                                            breakdownSortField === 'delivered'
                                              ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                                              : 'hover:text-slate-900 dark:hover:text-white'
                                          }`}
                                        >
                                          <div className="inline-flex items-center justify-end gap-1.5">
                                            <span>DELIVERED</span>
                                            <SortIcon field="delivered" currentField={breakdownSortField} direction={breakdownSortDir} />
                                          </div>
                                        </th>
                                        <th
                                          onClick={() => handleBreakdownSort('remaining')}
                                          className={`${innerThPadding} text-right uppercase tracking-wider cursor-pointer select-none transition-colors group ${
                                            breakdownSortField === 'remaining'
                                              ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                                              : 'hover:text-slate-900 dark:hover:text-white'
                                          }`}
                                        >
                                          <div className="inline-flex items-center justify-end gap-1.5">
                                            <span>REMAINING STOCK</span>
                                            <SortIcon field="remaining" currentField={breakdownSortField} direction={breakdownSortDir} />
                                          </div>
                                        </th>
                                        <th
                                          onClick={() => handleBreakdownSort('totalMt')}
                                          className={`${innerThPadding} text-right uppercase tracking-wider cursor-pointer select-none transition-colors group ${
                                            breakdownSortField === 'totalMt'
                                              ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                                              : 'hover:text-slate-900 dark:hover:text-white'
                                          }`}
                                        >
                                          <div className="inline-flex items-center justify-end gap-1.5">
                                            <span>TOTAL MT</span>
                                            <SortIcon field="totalMt" currentField={breakdownSortField} direction={breakdownSortDir} />
                                          </div>
                                        </th>
                                        <th className={`${innerThPadding} uppercase tracking-wider`}>SR NUMBERS</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11.5px]">
                                      {sortedItems.length === 0 ? (
                                        <tr>
                                          <td colSpan={7} className="py-4 text-center text-slate-400">
                                            No items matching your search.
                                          </td>
                                        </tr>
                                      ) : (
                                        sortedItems.map((item) => (
                                          <tr key={item.key} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className={`${innerTdPadding} font-semibold text-slate-900 dark:text-white`}>
                                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-750 font-bold">
                                                {item.varietyName}
                                              </span>
                                            </td>
                                            <td className={`${innerTdPadding} text-slate-600 dark:text-slate-300`}>
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-medium text-slate-800 dark:text-slate-200">{item.className}</span>
                                                {item.gradeName && item.gradeName !== '-' && (
                                                  <>
                                                    <span className="text-slate-400">·</span>
                                                    <span className="text-slate-600 dark:text-slate-400">{item.gradeName}</span>
                                                  </>
                                                )}
                                              </div>
                                            </td>
                                            <td className={`${innerTdPadding} text-right font-medium text-slate-700 dark:text-slate-300`}>
                                              {item.received > 0 ? item.received.toLocaleString() : '-'}
                                            </td>
                                            <td className={`${innerTdPadding} text-right font-medium text-slate-700 dark:text-slate-300`}>
                                              {item.delivered > 0 ? item.delivered.toLocaleString() : '-'}
                                            </td>
                                            <td className={`${innerTdPadding} text-right font-bold text-sky-700 dark:text-sky-300`}>
                                              {item.remaining > 0 ? item.remaining.toLocaleString() : '-'}
                                            </td>
                                            <td className={`${innerTdPadding} text-right font-bold text-emerald-600 dark:text-emerald-400`}>
                                              {item.totalMt > 0 ? item.totalMt.toFixed(2) : '-'}
                                            </td>
                                            <td className={`${innerTdPadding}`}>
                                              <div className="flex flex-wrap items-center gap-1">
                                                {item.srList.length > 0 ? (
                                                  item.srList.map((sr) => (
                                                    <span
                                                      key={sr}
                                                      className="inline-flex items-center text-[10.5px] font-mono font-medium px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800"
                                                    >
                                                      {sr}
                                                    </span>
                                                  ))
                                                ) : (
                                                  <span className="text-slate-400">-</span>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                    <tfoot className="bg-slate-100/90 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-750 text-[11px] text-slate-900 dark:text-white">
                                      <tr>
                                        <td colSpan={2} className={`${innerTdPadding} uppercase tracking-wider`}>
                                          FACILITY SUBTOTAL ({filteredItems.length} ITEMS)
                                        </td>
                                        <td className={`${innerTdPadding} text-right font-bold`}>
                                          {totalItemsReceived > 0 ? totalItemsReceived.toLocaleString() : '-'}
                                        </td>
                                        <td className={`${innerTdPadding} text-right font-bold`}>
                                          {totalItemsDelivered > 0 ? totalItemsDelivered.toLocaleString() : '-'}
                                        </td>
                                        <td className={`${innerTdPadding} text-right font-black text-sky-700 dark:text-sky-300`}>
                                          {totalItemsRemaining > 0 ? totalItemsRemaining.toLocaleString() : '-'}
                                        </td>
                                        <td className={`${innerTdPadding} text-right font-black text-emerald-600 dark:text-emerald-400`}>
                                          {totalItemsMt > 0 ? totalItemsMt.toFixed(2) : '-'}
                                        </td>
                                        <td className={`${innerTdPadding}`}></td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white print:bg-slate-100 print:text-black text-xs">
              <tr>
                <td className={`${totalPadding} uppercase tracking-wider`}>
                  TOTAL
                </td>
                <td className={`${totalPadding} text-right`}>
                  {totals.totalReceived > 0 ? totals.totalReceived.toLocaleString() : '-'}
                </td>
                <td className={`${totalPadding} text-right`}>
                  {totals.totalDelivered > 0 ? totals.totalDelivered.toLocaleString() : '-'}
                </td>
                <td className={`${totalPadding} text-right text-sky-700 dark:text-sky-300 font-black`}>
                  {totals.totalRemaining > 0 ? totals.totalRemaining.toLocaleString() : '-'}
                </td>
                <td className={`${totalPadding} text-center`}>
                  {totals.overallOccupancy !== null ? (
                    <span
                      className={`inline-block px-2 py-0.2 rounded-full text-[10.5px] font-bold ${getOccupancyColor(
                        totals.overallOccupancy
                      )}`}
                    >
                      {totals.overallOccupancy.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Quick Add Cold Storage Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ADD COLD STORAGE FACILITY"
        subtitle="REGISTER A NEW STORAGE FACILITY TO TRACK CAPACITY AND INVENTORY"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveStorage} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl uppercase">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                FACILITY CODE *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS-4 or VORSHA"
                required
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white uppercase font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                CAPACITY (BAGS) *
              </label>
              <input
                type="number"
                min="0"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                placeholder="100000"
                required
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              FACILITY NAME *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diamond Cold Storage Ltd."
              required
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                LOCATION / ADDRESS *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sadar Road, Rangpur"
                required
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                DISTRICT
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Rangpur"
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                RENT PER BAG (BDT)
              </label>
              <input
                type="number"
                min="0"
                value={rentPerBag}
                onChange={(e) => setRentPerBag(Number(e.target.value))}
                placeholder="280"
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                CONTACT PERSON
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Md. Kabir Hossain"
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD FACILITY</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Facility Stock Breakdown Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModalConfig.isOpen}
        onClose={() => setPrintModalConfig((prev) => ({ ...prev, isOpen: false }))}
        documentTitle={printModalConfig.title}
        subtitle={printModalConfig.subtitle}
        columns={printModalConfig.columns}
        data={printModalConfig.data}
        summaryItems={printModalConfig.summaryItems}
      />
    </div>
  );
};
