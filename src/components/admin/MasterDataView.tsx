import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Variety, SeedClass, Grade, ProductionBlock, PotatoType } from '../../types';
import { Modal } from '../common/Modal';
import { SortIcon } from '../common/SortIcon';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  Tag,
  MapPin,
  Scale,
  CheckCircle2,
} from 'lucide-react';

export const MasterDataView: React.FC = () => {
  const {
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    potatoTypes,
    kgPerBagOptions,
    addVariety,
    updateVariety,
    deleteVariety,
    addClass,
    updateClass,
    deleteClass,
    addGrade,
    updateGrade,
    deleteGrade,
    addProductionBlock,
    updateProductionBlock,
    deleteProductionBlock,
    addPotatoType,
    updatePotatoType,
    deletePotatoType,
    addKgPerBagOption,
    deleteKgPerBagOption,
    hasPermission,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'varieties' | 'classes' | 'grades' | 'blocks' | 'types' | 'bagweights'
  >('varieties');

  // Sorting state
  const [sortField, setSortField] = useState<'code' | 'name' | 'description'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'code' | 'name' | 'description') => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Generic Item Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [newKgVal, setNewKgVal] = useState(50);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setCode(item.code || '');
    setDescription(item.description || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (activeSubTab === 'varieties') {
      if (editingId) updateVariety(editingId, { name, code: code.toUpperCase() });
      else addVariety({ name, code: code.toUpperCase() || name.slice(0, 3).toUpperCase() });
    } else if (activeSubTab === 'classes') {
      if (editingId) updateClass(editingId, { name, code: code.toUpperCase() });
      else addClass({ name, code: code.toUpperCase() || name.slice(0, 2).toUpperCase() });
    } else if (activeSubTab === 'grades') {
      if (editingId) updateGrade(editingId, { name, code: code.toUpperCase(), description });
      else addGrade({ name, code: code.toUpperCase() || name.slice(0, 2).toUpperCase(), description });
    } else if (activeSubTab === 'blocks') {
      if (editingId) updateProductionBlock(editingId, { name, code: code.toUpperCase(), location: description });
      else addProductionBlock({ name, code: code.toUpperCase() || name.slice(0, 3).toUpperCase(), location: description });
    } else if (activeSubTab === 'types') {
      if (editingId) updatePotatoType(editingId, { name, code: code.toUpperCase() });
      else addPotatoType({ name, code: code.toUpperCase() || name.slice(0, 3).toUpperCase() });
    }

    setIsModalOpen(false);
  };

  const handleAddKg = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKgVal > 0) {
      addKgPerBagOption(newKgVal);
      setNewKgVal(50);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 uppercase">
            <Sliders className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            MASTER DATA & CLASSIFICATION PARAMETERS
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase">
            MAINTAIN AGRICULTURAL TAXONOMIES, POTATO VARIETIES, CERTIFIED CLASSES, SIZE GRADES, AND BLOCKS
          </p>
        </div>

        {activeSubTab !== 'bagweights' && hasPermission('manage_settings') && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors uppercase"
          >
            <Plus className="w-4 h-4" />
            <span>ADD NEW ITEM</span>
          </button>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'varieties', label: `VARIETIES (${varieties.length})`, icon: Sparkles },
          { id: 'classes', label: `SEED CLASSES (${seedClasses.length})`, icon: Layers },
          { id: 'grades', label: `SIZE GRADES (${grades.length})`, icon: Tag },
          { id: 'blocks', label: `PRODUCTION BLOCKS (${productionBlocks.length})`, icon: MapPin },
          { id: 'types', label: `POTATO TYPES (${potatoTypes.length})`, icon: Sliders },
          { id: 'bagweights', label: `KG PER BAG OPTIONS (${kgPerBagOptions.length})`, icon: Scale },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 uppercase ${
                isActive
                  ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Table Container */}
      {activeSubTab !== 'bagweights' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase">
              <tr>
                <th className="py-3 px-4 w-12 text-slate-400">#</th>
                <th
                  onClick={() => handleSort('code')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    sortField === 'code'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>CODE</span>
                    <SortIcon field="code" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                    sortField === 'name'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>ITEM NAME / TITLE</span>
                    <SortIcon field="name" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                {(activeSubTab === 'grades' || activeSubTab === 'blocks') && (
                  <th
                    onClick={() => handleSort('description')}
                    className={`py-3 px-4 cursor-pointer select-none transition-colors group ${
                      sortField === 'description'
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/30 font-bold'
                        : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>DESCRIPTION / DETAILS</span>
                      <SortIcon field="description" currentField={sortField} direction={sortDir} />
                    </div>
                  </th>
                )}
                <th className="py-3 px-4 text-center w-24 text-slate-700 dark:text-slate-200">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(() => {
                let list: any[] = [];
                let onDelete: (id: string) => void = () => {};

                if (activeSubTab === 'varieties') {
                  list = [...varieties];
                  onDelete = deleteVariety;
                } else if (activeSubTab === 'classes') {
                  list = [...seedClasses];
                  onDelete = deleteClass;
                } else if (activeSubTab === 'grades') {
                  list = [...grades];
                  onDelete = deleteGrade;
                } else if (activeSubTab === 'blocks') {
                  list = [...productionBlocks];
                  onDelete = deleteProductionBlock;
                } else if (activeSubTab === 'types') {
                  list = [...potatoTypes];
                  onDelete = deletePotatoType;
                }

                list.sort((a, b) => {
                  let valA = '';
                  let valB = '';
                  if (sortField === 'code') {
                    valA = (a.code || '').toLowerCase();
                    valB = (b.code || '').toLowerCase();
                  } else if (sortField === 'name') {
                    valA = (a.name || '').toLowerCase();
                    valB = (b.name || '').toLowerCase();
                  } else if (sortField === 'description') {
                    valA = (a.description || a.location || '').toLowerCase();
                    valB = (b.description || b.location || '').toLowerCase();
                  }
                  if (valA < valB) return sortDir === 'asc' ? -1 : 1;
                  if (valA > valB) return sortDir === 'asc' ? 1 : -1;
                  return 0;
                });

                return list.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {item.code || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    {(activeSubTab === 'grades' || activeSubTab === 'blocks') && (
                      <td className="py-3 px-4 text-slate-500">
                        {item.description || item.location || '-'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1 rounded-md text-slate-400 hover:text-sky-600 hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {list.length > 1 && (
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      ) : (
        /* Bag Weights Tab */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
              STANDARD SEED SACK PACKING SIZES (KG / BAG)
            </h3>
            <p className="text-xs text-slate-500 mt-1 uppercase">
              CONFIGURE AVAILABLE BAG CAPACITIES FOR RECEIVING AND DELIVERY CALCULATIONS
            </p>
          </div>

          <form onSubmit={handleAddKg} className="flex items-center gap-3 max-w-md">
            <input
              type="number"
              min="1"
              max="200"
              placeholder="e.g. 55"
              value={newKgVal}
              onChange={(e) => setNewKgVal(parseInt(e.target.value) || 0)}
              className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 font-bold"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl uppercase"
            >
              ADD BAG WEIGHT (KG)
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {kgPerBagOptions.map((kg) => (
              <div
                key={kg}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between"
              >
                <div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {kg} KG
                  </span>
                  <span className="block text-[10px] text-slate-400">per gunny sack</span>
                </div>
                {kgPerBagOptions.length > 1 && (
                  <button
                    onClick={() => deleteKgPerBagOption(kg)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'EDIT MASTER RECORD' : 'ADD MASTER RECORD'}
          subtitle={`CONFIGURE ${activeSubTab.toUpperCase()} CLASSIFICATION PARAMETERS`}
          maxWidth="md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                NAME / TITLE <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Santana"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                CODE / ABBREVIATION
              </label>
              <input
                type="text"
                placeholder="e.g. SAN"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 uppercase font-mono"
              />
            </div>

            {(activeSubTab === 'grades' || activeSubTab === 'blocks') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                  DESCRIPTION / SPECIFICATION
                </label>
                <input
                  type="text"
                  placeholder="e.g. Size range 28-35mm diameter"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

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
                SAVE
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
