import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Download,
  FileText,
  Printer,
  User,
  ShieldCheck,
  Package,
  Truck,
  Building2,
  Receipt,
  Settings,
  Clock,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, companySettings, currentUser, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Compute filtered logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return auditLogs.filter((log) => {
      // Module filter
      if (selectedModule !== 'ALL') {
        const mod = (log.module || log.entity || '').toUpperCase();
        if (selectedModule === 'USER/AUTH') {
          if (mod !== 'USER' && mod !== 'AUTH') return false;
        } else if (mod !== selectedModule) {
          return false;
        }
      }

      // Action filter
      if (selectedAction && log.action.toUpperCase() !== selectedAction.toUpperCase()) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'ALL') {
        const logDate = new Date(log.timestamp);
        if (dateFilter === 'TODAY') {
          const logDateStr = log.timestamp.split('T')[0];
          if (logDateStr !== todayStr) return false;
        } else if (dateFilter === '7DAYS') {
          if (logDate < sevenDaysAgo) return false;
        } else if (dateFilter === '30DAYS') {
          if (logDate < thirtyDaysAgo) return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (log.details || '').toLowerCase().includes(q) ||
          (log.userName || '').toLowerCase().includes(q) ||
          (log.userEmail || '').toLowerCase().includes(q) ||
          (log.recordId && log.recordId.toLowerCase().includes(q)) ||
          (log.entityId && log.entityId.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [auditLogs, selectedModule, selectedAction, dateFilter, searchTerm]);

  // Summary counts
  const stockLogCount = useMemo(
    () => auditLogs.filter((l) => (l.module || l.entity || '').toUpperCase() === 'STOCK').length,
    [auditLogs]
  );
  const deliveryLogCount = useMemo(
    () => auditLogs.filter((l) => (l.module || l.entity || '').toUpperCase() === 'DELIVERY').length,
    [auditLogs]
  );
  const rentLogCount = useMemo(
    () => auditLogs.filter((l) => (l.module || l.entity || '').toUpperCase() === 'RENT').length,
    [auditLogs]
  );

  const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

  const handleExportExcel = () => {
    const rows = filteredLogs.map((log, idx) => ({
      sl: idx + 1,
      timestamp: new Date(log.timestamp).toLocaleString(),
      user: log.userName,
      action: log.action.toUpperCase(),
      module: log.module || log.entity || 'GENERAL',
      details: log.details,
      recordRef: log.recordId || log.entityId || '-',
    }));

    exportToExcel(
      rows,
      [
        { header: 'SL', key: 'sl', width: 6, align: 'center' },
        { header: 'Date & Time', key: 'timestamp', width: 22 },
        { header: 'Performed By', key: 'user', width: 20 },
        { header: 'Action', key: 'action', width: 14, align: 'center' },
        { header: 'Module', key: 'module', width: 16, align: 'center' },
        { header: 'Operational Activity Details', key: 'details', width: 55 },
        { header: 'Record ID / Ref', key: 'recordRef', width: 20 },
      ],
      'Potato_Seed_Audit_Trail_Log',
      'Potato Seed Inventory Audit & Governance Trail',
      companySettings,
      `Total Logged Actions: ${filteredLogs.length} Records`,
      {
        printedBy: printedByName,
        orientation: 'landscape',
        sheetName: 'Audit Trail',
        accentColor: 'FF0284C7', // Sky blue theme
      }
    );

    if (addToast) {
      addToast('Audit Log exported to formatted Excel!', 'success');
    }
  };

  const handleExportPdf = () => {
    const rows = filteredLogs.map((log, idx) => ({
      sl: idx + 1,
      timestamp: new Date(log.timestamp).toLocaleString(),
      user: log.userName,
      action: log.action.toUpperCase(),
      module: log.module || log.entity || 'GENERAL',
      details: log.details,
      recordRef: log.recordId || log.entityId || '-',
    }));

    exportToPdf(
      rows,
      [
        { header: '#', key: 'sl', width: 6, align: 'center' },
        { header: 'Date & Time', key: 'timestamp', width: 18 },
        { header: 'User', key: 'user', width: 16 },
        { header: 'Action', key: 'action', width: 12, align: 'center' },
        { header: 'Module', key: 'module', width: 12, align: 'center' },
        { header: 'Activity Description & Stock Changes', key: 'details', width: 36 },
      ],
      'Potato_Seed_Audit_Trail_Log',
      'Potato Seed Inventory Audit & Governance Trail',
      companySettings,
      'l',
      `Audit Records: ${filteredLogs.length} Operational Events Recorded`,
      {
        printedBy: printedByName,
        includeSummary: false,
      }
    );
  };

  const getActionBadgeColor = (action: string) => {
    const act = (action || '').toLowerCase();
    if (act.includes('create') || act.includes('add') || act.includes('inbound')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    }
    if (act.includes('delivery') || act.includes('disburse')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    }
    if (act.includes('delete')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    }
    if (act.includes('update') || act.includes('edit')) {
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
    }
    if (act.includes('login') || act.includes('auth')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  const getModuleIcon = (mod: string) => {
    const m = (mod || '').toUpperCase();
    if (m === 'STOCK') return <Package className="w-3.5 h-3.5 text-emerald-500" />;
    if (m === 'DELIVERY') return <Truck className="w-3.5 h-3.5 text-amber-500" />;
    if (m === 'COLD_STORAGE') return <Building2 className="w-3.5 h-3.5 text-indigo-500" />;
    if (m === 'RENT') return <Receipt className="w-3.5 h-3.5 text-rose-500" />;
    if (m === 'SETTINGS') return <Settings className="w-3.5 h-3.5 text-slate-500" />;
    return <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Audit Trail & User Accountability Logs
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete real-time governance tracking timestamps, user identities, and inventory alterations
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs uppercase cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>EXCEL</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs uppercase cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-xs uppercase cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT AUDIT LOG</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Events</span>
            <ShieldCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {auditLogs.length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Changes</span>
            <Package className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stockLogCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dispatches</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {deliveryLogCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rent / Finance</span>
            <Receipt className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {rentLogCount}
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-print">
        {[
          { id: 'ALL', label: 'All Modules' },
          { id: 'STOCK', label: 'Stock Receiving' },
          { id: 'DELIVERY', label: 'Dispatches' },
          { id: 'COLD_STORAGE', label: 'Cold Storages' },
          { id: 'RENT', label: 'Rent Ledger' },
          { id: 'SETTINGS', label: 'Master Settings' },
          { id: 'USER/AUTH', label: 'Users & Auth' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedModule(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedModule === tab.id
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Secondary Filter controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action details, stock notes, user name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
        >
          <option value="">All Action Operations</option>
          <option value="CREATE">CREATE / ADD</option>
          <option value="UPDATE">UPDATE / EDIT</option>
          <option value="DELETE">DELETE / REMOVE</option>
          <option value="LOGIN">LOGIN / SESSION</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as any)}
          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
        >
          <option value="ALL">All Time</option>
          <option value="TODAY">Today Only</option>
          <option value="7DAYS">Last 7 Days</option>
          <option value="30DAYS">Last 30 Days</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Operational Governance Activity Records
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
              {filteredLogs.length} Records
            </span>
          </div>
          {(searchTerm || selectedAction || selectedModule !== 'ALL' || dateFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedAction('');
                setSelectedModule('ALL');
                setDateFilter('ALL');
              }}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 font-semibold border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-44">Date & Time</th>
                <th className="py-3 px-4 w-48">Responsible User</th>
                <th className="py-3 px-4 w-28 text-center">Action</th>
                <th className="py-3 px-4 w-32 text-center">Module</th>
                <th className="py-3 px-4">Activity Description / Stock Modifications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    No matching audit records found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const mod = log.module || log.entity || 'GENERAL';
                  return (
                    <tr
                      key={log.id}
                      className={
                        index % 2 === 0
                          ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors'
                          : 'bg-slate-50/50 dark:bg-slate-850/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors'
                      }
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="block">{log.userName}</span>
                            {log.userEmail && (
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {log.userEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {getModuleIcon(mod)}
                          <span>{mod}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                        <p className="font-medium leading-relaxed">{log.details}</p>
                        {log.recordId && (
                          <span className="inline-block mt-1 font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            Ref: {log.recordId}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentTitle="AUDIT TRAIL & SYSTEM GOVERNANCE LOG"
        subtitle={`Total Filtered Activity Logs: ${filteredLogs.length} Events`}
        columns={[
          { header: 'Date & Time', key: 'timestamp', width: 18 },
          { header: 'Responsible User', key: 'user', width: 18 },
          { header: 'Action', key: 'action', width: 12, align: 'center' },
          { header: 'Module', key: 'module', width: 14, align: 'center' },
          { header: 'Activity Description & Stock Details', key: 'details', width: 38 },
        ]}
        data={filteredLogs.map((log) => ({
          timestamp: new Date(log.timestamp).toLocaleString(),
          user: log.userName,
          action: log.action.toUpperCase(),
          module: log.module || log.entity || 'GENERAL',
          details: log.details,
        }))}
        summaryItems={[
          { label: 'Total Events', value: filteredLogs.length },
          { label: 'Stock Changes', value: filteredLogs.filter((l) => (l.module || '').toUpperCase() === 'STOCK').length },
          { label: 'Dispatches', value: filteredLogs.filter((l) => (l.module || '').toUpperCase() === 'DELIVERY').length },
          { label: 'Rent Payments', value: filteredLogs.filter((l) => (l.module || '').toUpperCase() === 'RENT').length },
        ]}
        filename="Potato_Seed_Audit_Trail_Log"
        orientation="l"
      />
    </div>
  );
};
