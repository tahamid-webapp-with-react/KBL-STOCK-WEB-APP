import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanySettings } from '../../types';
import {
  Settings,
  Building,
  Save,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Palette,
  Image as ImageIcon,
  Trash2,
  UploadCloud,
  Sprout,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    companySettings,
    updateCompanySettings,
    exportDatabaseJson,
    importDatabaseJson,
    resetToDemoData,
    setIsThemeModalOpen,
    hasPermission,
  } = useApp();

  // Settings State
  const [formData, setFormData] = useState<CompanySettings>({ ...companySettings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportJson = () => {
    const jsonString = exportDatabaseJson();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kbl_seed_inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = importDatabaseJson(content);
        if (success) {
          setImportStatus('Database successfully restored from backup file.');
        } else {
          setImportStatus('Failed to restore: Invalid backup file format.');
        }
      } catch (err) {
        setImportStatus('Error parsing JSON backup file.');
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            System Configuration & Data Governance
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise profile, currency parameters, print letterhead info, and system backup/recovery
          </p>
        </div>

        <button
          onClick={() => setIsThemeModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
        >
          <Palette className="w-4 h-4 text-sky-500" />
          <span>Theme & Appearance</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Company settings and report letterhead parameters saved successfully.</span>
        </div>
      )}

      {/* Company Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5"
      >
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-sky-600" />
              Company Letterhead & Reporting Header
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These details automatically populate official Excel and PDF print exports
            </p>
          </div>
          {hasPermission('manage_settings') && (
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          )}
        </div>

        {/* Company Logo Section */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-xs">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Company Logo"
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Sprout className="w-7 h-7 text-emerald-500" />
                </div>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Official Company Logo
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Displays on the navigation bar, print letterheads, and official documents.
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PNG, JPG, or SVG. Max 2MB recommended.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-xl cursor-pointer transition-colors shadow-xs">
              <UploadCloud className="w-4 h-4" />
              <span>{formData.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const result = evt.target?.result as string;
                    if (result) {
                      setFormData((prev) => ({ ...prev, logoUrl: result }));
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>

            {formData.logoUrl && (
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, logoUrl: undefined }))}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-xl transition-colors shadow-xs"
                title="Remove Company Logo"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department / Subtitle Tagline
            </label>
            <input
              type="text"
              value={formData.companyTagline || ''}
              onChange={(e) => setFormData({ ...formData, companyTagline: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Registered Office Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Official Phone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Official Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Currency Symbol
            </label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fiscal Year / Season
            </label>
            <input
              type="text"
              value={formData.fiscalYear}
              onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 font-bold font-mono"
            />
          </div>
        </div>
      </form>

      {/* Database Backup & Restore */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-600" />
            Database Persistence & Disaster Recovery
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Export a full JSON snapshot of your potato inventory database or restore from a previous archive
          </p>
        </div>

        {importStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold border ${
              importStatus.includes('successfully')
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backup */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-sky-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Export Database Snapshot
                </h4>
                <p className="text-[11px] text-slate-500">
                  Save all stock, deliveries, cold storages, rent payments, and logs to JSON
                </p>
              </div>
            </div>
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Restore */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Restore From JSON Backup
                </h4>
                <p className="text-[11px] text-slate-500">
                  Upload an existing JSON backup to overwrite or recover state
                </p>
              </div>
            </div>
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Select Backup File (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone: Reset to 2024 Demo Data */}
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Factory Reset / Restore Demo Harvest Data
              </h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Reset database back to standard 2024 seed potato production, Dinajpur cold storage lots, and initial transactions
              </p>
            </div>
          </div>

          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 bg-white dark:bg-slate-800 border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDemoData();
                  setConfirmReset(false);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-rose-600 hover:bg-rose-700"
              >
                Confirm Reset
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl border border-rose-300 dark:border-rose-800"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Database</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
