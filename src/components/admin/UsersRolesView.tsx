import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { Modal } from '../common/Modal';
import { SortIcon } from '../common/SortIcon';
import {
  Users,
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Lock,
  UserCheck,
  Check,
  X,
} from 'lucide-react';

export const UsersRolesView: React.FC = () => {
  const {
    users,
    currentUser,
    switchUser,
    addUser,
    updateUser,
    deleteUser,
    hasPermission,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<'fullName' | 'username' | 'role'>('fullName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'fullName' | 'username' | 'role') => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('store_officer');

  const openAdd = () => {
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setRole('store_officer');
    setIsModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setFullName(u.fullName);
    setEmail(u.email);
    setRole(u.role);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !email.trim()) return;

    if (editingUser) {
      updateUser(editingUser.id, {
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
      });
    } else {
      addUser({
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        isActive: true,
      });
    }

    setIsModalOpen(false);
  };

  // RBAC Matrix definitions
  const permissionDefinitions = [
    { key: 'view_stock', label: 'View Stock & Balances' },
    { key: 'add_stock', label: 'Record Stock Inbound' },
    { key: 'edit_stock', label: 'Modify Stock Transactions' },
    { key: 'delete_stock', label: 'Delete Stock Entries' },
    { key: 'view_delivery', label: 'View Outbound Deliveries' },
    { key: 'add_delivery', label: 'Dispatch Deliveries' },
    { key: 'view_cold_storage', label: 'View Cold Storages' },
    { key: 'manage_cold_storage', label: 'Configure Facilities' },
    { key: 'manage_rent', label: 'Post Rent Payments' },
    { key: 'view_reports', label: 'Access Analytical Reports' },
    { key: 'export_data', label: 'Export Excel & PDF' },
    { key: 'manage_settings', label: 'Administer Master Data & Settings' },
  ];

  const rolePermissions: Record<UserRole, string[]> = {
    super_admin: permissionDefinitions.map((p) => p.key),
    store_officer: [
      'view_stock',
      'add_stock',
      'edit_stock',
      'view_delivery',
      'add_delivery',
      'edit_delivery',
      'view_cold_storage',
      'view_reports',
      'export_data',
    ],
    accounts_officer: [
      'view_stock',
      'view_delivery',
      'view_cold_storage',
      'manage_rent',
      'view_reports',
      'export_data',
    ],
    viewer: ['view_stock', 'view_delivery', 'view_cold_storage', 'view_reports'],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 uppercase">
            <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            USER MANAGEMENT & ROLE-BASED ACCESS CONTROL (RBAC)
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase">
            CONTROL ENTERPRISE PERSONNEL ACCESS, ROLE HIERARCHIES, AND FUNCTIONAL PERMISSIONS
          </p>
        </div>

        {hasPermission('manage_users') && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors uppercase"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE USER ACCOUNT</span>
          </button>
        )}
      </div>

      {/* Active User Quick Test Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30 border border-sky-200 dark:border-sky-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
            {currentUser.fullName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase">
              CURRENTLY LOGGED IN AS: {currentUser.fullName} ({currentUser.roleName})
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase">
              ROLE PERMISSIONS AND BUTTON AUTHORIZATIONS WILL ADAPT TO THIS PROFILE
            </p>
          </div>
        </div>

        {/* User Switch buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 uppercase">SWITCH:</span>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => switchUser(u.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all uppercase ${
                u.id === currentUser.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {u.roleName}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
            SYSTEM ACCOUNTS DIRECTORY
          </h3>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase">
            <tr>
              <th
                onClick={() => handleSort('fullName')}
                className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                  sortField === 'fullName'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>USER</span>
                  <SortIcon field="fullName" currentField={sortField} direction={sortDir} />
                </div>
              </th>
              <th
                onClick={() => handleSort('username')}
                className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                  sortField === 'username'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>USERNAME</span>
                  <SortIcon field="username" currentField={sortField} direction={sortDir} />
                </div>
              </th>
              <th
                onClick={() => handleSort('role')}
                className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                  sortField === 'role'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>ROLE TITLE</span>
                  <SortIcon field="role" currentField={sortField} direction={sortDir} />
                </div>
              </th>
              <th className="py-3 px-4 text-slate-700 dark:text-slate-200">STATUS</th>
              <th className="py-3 px-4 text-slate-700 dark:text-slate-200">LAST ACTIVE</th>
              <th className="py-3 px-4 text-center text-slate-700 dark:text-slate-200">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(() => {
              const sortedUsers = [...users].sort((a, b) => {
                let valA = '';
                let valB = '';
                if (sortField === 'fullName') {
                  valA = a.fullName.toLowerCase();
                  valB = b.fullName.toLowerCase();
                } else if (sortField === 'username') {
                  valA = a.username.toLowerCase();
                  valB = b.username.toLowerCase();
                } else if (sortField === 'role') {
                  valA = (a.roleName || a.role).toLowerCase();
                  valB = (b.roleName || b.role).toLowerCase();
                }
                if (valA < valB) return sortDir === 'asc' ? -1 : 1;
                if (valA > valB) return sortDir === 'asc' ? 1 : -1;
                return 0;
              });

              return sortedUsers.map((u) => {
                const isCurrent = u.id === currentUser.id;

                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                      isCurrent ? 'bg-sky-50/30 dark:bg-sky-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-[10px]">
                          {u.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{u.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      @{u.username}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {u.roleName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Active Now'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => switchUser(u.id)}
                          className="px-2 py-1 rounded text-[11px] font-semibold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 uppercase"
                        >
                          ACTIVATE
                        </button>
                        {hasPermission('manage_users') && (
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1 text-slate-400 hover:text-sky-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('manage_users') && users.length > 1 && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>

      {/* Role Permission Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase">
            <Shield className="w-4 h-4 text-sky-600" />
            SECURITY MATRIX (ROLE PERMISSIONS)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 uppercase">
            PRE-CONFIGURED CAPABILITY ALLOWANCES PER ROLE PROFILE
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">SYSTEM PERMISSION</th>
                <th className="py-2.5 px-3 text-center">SUPER ADMIN</th>
                <th className="py-2.5 px-3 text-center">STORE OFFICER</th>
                <th className="py-2.5 px-3 text-center">ACCOUNTS OFFICER</th>
                <th className="py-2.5 px-3 text-center">VIEWER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {permissionDefinitions.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                    {perm.label}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                  </td>
                  <td className="py-2 px-3 text-center">
                    {rolePermissions.store_officer.includes(perm.key) ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {rolePermissions.accounts_officer.includes(perm.key) ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {rolePermissions.viewer.includes(perm.key) ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? 'EDIT USER ACCOUNT' : 'CREATE NEW USER ACCOUNT'}
          subtitle="CONFIGURE LOGIN CREDENTIALS AND ASSIGNED SECURITY ROLE"
          maxWidth="md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                FULL NAME <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tariqul Islam"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                USERNAME <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. tariqul"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                EMAIL ADDRESS <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g. tariqul@kblseed.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                ASSIGNED ROLE <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              >
                <option value="super_admin">Super Admin (Full Enterprise Access)</option>
                <option value="store_officer">Store Officer (Stock In & Out operations)</option>
                <option value="accounts_officer">Accounts Officer (Rent Ledger & Financials)</option>
                <option value="viewer">Viewer (Read-Only Access)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 uppercase"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl uppercase"
              >
                {editingUser ? 'UPDATE ACCOUNT' : 'CREATE ACCOUNT'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
