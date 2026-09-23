import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  PackagePlus,
  Boxes,
  Scale,
  Truck,
  Warehouse,
  Receipt,
  BarChart3,
  TrendingDown,
  Building2,
  FileText,
  Files,
  Grid3X3,
  Sliders,
  Users,
  ShieldCheck,
  History,
  FileSpreadsheet,
  Sprout,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    hasPermission,
    companySettings,
    setIsImportModalOpen,
    coldStorages,
  } = useApp();

  const navGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        {
          id: 'dashboard',
          label: 'DASHBOARD',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'INVENTORY OPERATIONS DETAILS',
      items: [
        {
          id: 'stock-register',
          label: 'COLD STORAGE IN',
          icon: Boxes,
          permission: 'view_stock',
        },
        {
          id: 'delivery-register',
          label: 'STOCK OUT FROM COLD STORAGE',
          icon: Truck,
          permission: 'view_delivery',
        },
        {
          id: 'stock-balance',
          label: 'COLD STORAGE STOCK DETAILS',
          icon: Scale,
          permission: 'view_stock',
        },
      ],
    },
    {
      title: 'COLD STORAGE & RENT',
      items: [
        {
          id: 'cold-storage',
          label: 'COLD STORAGES',
          icon: Warehouse,
          permission: 'view_cold_storage',
          badge: `${coldStorages.length}`,
        },
        {
          id: 'rent-management',
          label: 'RENT MANAGEMENT',
          icon: Receipt,
          permission: 'view_reports',
        },
      ],
    },
    {
      title: 'INTELLIGENCE & REPORTS',
      items: [
        {
          id: 'reports-stock',
          label: 'STOCK REPORT (EXCEL)',
          icon: BarChart3,
          permission: 'view_reports',
        },
        {
          id: 'reports-delivery',
          label: 'DELIVERY REPORT',
          icon: TrendingDown,
          permission: 'view_reports',
        },
        {
          id: 'reports-storage',
          label: 'COLD STORAGE REPORT',
          icon: Building2,
          permission: 'view_reports',
        },
        {
          id: 'reports-sr',
          label: 'SR-WISE REPORT',
          icon: FileText,
          permission: 'view_reports',
        },
        {
          id: 'reports-challan',
          label: 'CHALLAN-WISE REPORT',
          icon: Files,
          permission: 'view_reports',
        },
        {
          id: 'reports-dimensions',
          label: 'VARIETY / GRADE MATRIX',
          icon: Grid3X3,
          permission: 'view_reports',
        },
      ],
    },
    {
      title: 'ADMIN & GOVERNANCE',
      items: [
        {
          id: 'master-data',
          label: 'MASTER DATA',
          icon: Sliders,
          permission: 'view_settings',
        },
        {
          id: 'users-roles',
          label: 'USERS & ROLES',
          icon: Users,
          permission: 'view_users',
        },
        {
          id: 'audit-logs',
          label: 'AUDIT TRAIL',
          icon: History,
          permission: 'view_audit_logs',
        },
        {
          id: 'settings',
          label: 'SYSTEM SETTINGS',
          icon: ShieldCheck,
          permission: 'manage_settings',
        },
      ],
    },
  ];

  const handleSelect = (tab: NavigationTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-2xl lg:shadow-none no-print`}
      >
        {/* Company Branding - Clickable link to Dashboard */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => handleSelect('dashboard')}
            className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity group cursor-pointer focus:outline-none"
            title="Go to Dashboard"
          >
            {companySettings.logoUrl ? (
              <img
                src={companySettings.logoUrl}
                alt={companySettings.companyName}
                className="w-9 h-9 rounded-xl object-contain bg-white/10 p-1 border border-white/20 shadow-md group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Sprout className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight truncate group-hover:text-sky-400 transition-colors">
                {companySettings.companyName || companySettings.logoText || 'POTATO SEED ERP'}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {companySettings.companyTagline || companySettings.tagline || 'Cold Storage & Stock 2024'}
              </p>
            </div>
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation scrollable area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.permission || hasPermission(item.permission as any)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {group.title}
                </div>

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-sm font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-sky-700 text-sky-100'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Excel Import CTA Card at bottom of sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="uppercase">IMPORT 2024 EXCEL DATA</span>
          </button>
        </div>
      </aside>
    </>
  );
};
