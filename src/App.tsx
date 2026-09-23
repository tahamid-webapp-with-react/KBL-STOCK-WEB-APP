import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { ExcelImportModal } from './components/common/ExcelImportModal';
import { StockEntryModal } from './components/stock/StockEntryModal';
import { DeliveryModal } from './components/delivery/DeliveryModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { StockRegisterView } from './components/stock/StockRegisterView';
import { StockBalanceView } from './components/stock/StockBalanceView';
import { DeliveryRegisterView } from './components/delivery/DeliveryRegisterView';
import { ColdStorageListView } from './components/coldStorage/ColdStorageListView';
import { RentManagementView } from './components/coldStorage/RentManagementView';
import { ReportsView } from './components/reports/ReportsView';
import { MasterDataView } from './components/admin/MasterDataView';
import { UsersRolesView } from './components/admin/UsersRolesView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { SettingsView } from './components/admin/SettingsView';
import { ProfileModal } from './components/common/ProfileModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setIsStockModalOpen,
    isStockModalOpen,
    isDeliveryModalOpen,
    setIsDeliveryModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
  } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If user clicks on 'stock-entry' in sidebar, we can auto-open modal or render StockRegisterView with open modal
  React.useEffect(() => {
    if (activeTab === 'stock-entry') {
      setIsStockModalOpen(true);
    }
  }, [activeTab, setIsStockModalOpen]);

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;

      case 'stock-entry':
      case 'stock-register':
        return <StockRegisterView />;

      case 'stock-balance':
        return <StockBalanceView />;

      case 'delivery-register':
        return <DeliveryRegisterView />;

      case 'cold-storage':
        return <ColdStorageListView />;

      case 'rent-management':
        return <RentManagementView />;

      case 'reports-stock':
        return <ReportsView reportType="reports-stock" />;

      case 'reports-delivery':
        return <ReportsView reportType="reports-delivery" />;

      case 'reports-storage':
        return <ReportsView reportType="reports-storage" />;

      case 'reports-sr':
        return <ReportsView reportType="reports-sr" />;

      case 'reports-challan':
        return <ReportsView reportType="reports-challan" />;

      case 'reports-dimensions':
        return <ReportsView reportType="reports-dimensions" />;

      case 'master-data':
        return <MasterDataView />;

      case 'users-roles':
        return <UsersRolesView />;

      case 'audit-logs':
        return <AuditLogsView />;

      case 'settings':
        return <SettingsView />;

      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        {/* Page View Container - Adjusted padding to eliminate excessive gap under header */}
        <main className="flex-1 px-3 py-2.5 sm:px-5 sm:py-3 lg:px-6 lg:py-3.5 max-w-7xl w-full mx-auto">
          <ErrorBoundary key={activeTab} onReset={() => window.location.reload()}>
            {renderCurrentView()}
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="py-3.5 px-6 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 text-center no-print">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              ALL RIGHTS RESERVED BY @
            </span>
            <a
              href="https://kisanbotanix.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black uppercase text-xs text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/30 tracking-widest"
              title="Visit Kisan Botanix Ltd."
              aria-label="Visit Kisan Botanix Ltd."
            >
              <span>🌱</span>
              <span>KBL</span>
            </a>
          </div>
        </footer>
      </div>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <ExcelImportModal />
      <StockEntryModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />
      <DeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ThemeProvider>
  );
}
