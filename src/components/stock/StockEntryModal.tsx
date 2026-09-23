import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { StockTransaction } from '../../types';
import { Save, Check, Plus, AlertCircle } from 'lucide-react';
import { stockEntrySchema, extractZodFieldErrors } from '../../utils/validationSchemas';

interface StockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StockTransaction | null;
}

export const StockEntryModal: React.FC<StockEntryModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const {
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    potatoTypes,
    kgPerBagOptions,
    addStockTransaction,
    updateStockTransaction,
    stockTransactions,
  } = useApp();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [kblChallanNo, setKblChallanNo] = useState('');
  const [srNo, setSrNo] = useState('');
  const [entryNo, setEntryNo] = useState('');
  const [sackQuantity, setSackQuantity] = useState<number>(500);
  const [kgPerBag, setKgPerBag] = useState<number>(50);
  const [coldStorageId, setColdStorageId] = useState<string>('');
  const [varietyId, setVarietyId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [gradeId, setGradeId] = useState<string>('');
  const [productionBlockId, setProductionBlockId] = useState<string>('');
  const [potatoTypeId, setPotatoTypeId] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto Calculations
  const totalKg = sackQuantity * kgPerBag;
  const totalMt = Number((totalKg / 1000).toFixed(3));

  // Initialize or reset
  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setKblChallanNo(initialData.kblChallanNo);
      setSrNo(initialData.srNo);
      setEntryNo(initialData.entryNo || '');
      setSackQuantity(initialData.sackQuantity);
      setKgPerBag(initialData.kgPerBag);
      setColdStorageId(initialData.coldStorageId);
      setVarietyId(initialData.varietyId);
      setClassId(initialData.classId);
      setGradeId(initialData.gradeId);
      setProductionBlockId(initialData.productionBlockId);
      setPotatoTypeId(initialData.potatoTypeId);
      setRemarks(initialData.remarks || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setKblChallanNo('');
      setSrNo('');
      setEntryNo('');
      setSackQuantity(500);
      setKgPerBag(kgPerBagOptions[0] || 50);
      setColdStorageId(coldStorages[0]?.id || '');
      setVarietyId(varieties[0]?.id || '');
      setClassId(seedClasses[0]?.id || '');
      setGradeId(grades[0]?.id || '');
      setProductionBlockId(productionBlocks[0]?.id || '');
      setPotatoTypeId(potatoTypes[0]?.id || '');
      setRemarks('');
    }
    setErrors({});
  }, [initialData, isOpen, coldStorages, varieties, seedClasses, grades, productionBlocks, potatoTypes, kgPerBagOptions]);

  const validate = (): boolean => {
    const parseResult = stockEntrySchema.safeParse({
      coldStorageId,
      date,
      entryNo: entryNo.trim() || undefined,
      kblChallanNo,
      srNo,
      varietyId,
      classId,
      gradeId,
      productionBlockId,
      potatoTypeId,
      sackQuantity: Number(sackQuantity),
      kgPerBag: Number(kgPerBag),
      remarks: remarks.trim() || undefined,
    });

    if (!parseResult.success) {
      const fieldErrors = extractZodFieldErrors(parseResult.error);
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSave = (saveAndNew: boolean = false) => {
    if (!validate()) return;

    if (initialData) {
      updateStockTransaction(initialData.id, {
        date,
        kblChallanNo: kblChallanNo.trim().toUpperCase(),
        srNo: srNo.trim().toUpperCase(),
        entryNo: entryNo.trim() || undefined,
        sackQuantity,
        kgPerBag,
        totalKg,
        totalMt,
        coldStorageId,
        varietyId,
        classId,
        gradeId,
        productionBlockId,
        potatoTypeId,
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } else {
      const res = addStockTransaction({
        date,
        kblChallanNo: kblChallanNo.trim().toUpperCase(),
        srNo: srNo.trim().toUpperCase(),
        entryNo: entryNo.trim() || undefined,
        sackQuantity,
        kgPerBag,
        totalKg,
        totalMt,
        coldStorageId,
        varietyId,
        classId,
        gradeId,
        productionBlockId,
        potatoTypeId,
        remarks: remarks.trim() || undefined,
        status: 'approved',
      });

      if (res.success) {
        if (saveAndNew) {
          // Reset for next entry but keep common date and storage
          setKblChallanNo('');
          setSrNo('');
          setSackQuantity(500);
          setRemarks('');
          setErrors({});
        } else {
          onClose();
        }
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Stock Receiving' : 'New Potato Stock Inbound Entry'}
      subtitle="Record cold storage gate receiving, challan lot, and weight metrics"
      maxWidth="3xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave(false);
        }}
        className="space-y-4"
      >
        {/* Row 1: Cold Storage, Date, Entry No */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cold Storage <span className="text-rose-500">*</span>
            </label>
            <select
              value={coldStorageId}
              onChange={(e) => setColdStorageId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="">Select Facility</option>
              {coldStorages.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name} ({cs.code})
                </option>
              ))}
            </select>
            {errors.coldStorageId && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.coldStorageId}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            />
            {errors.date && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Entry No / Gate Serial
            </label>
            <input
              type="text"
              placeholder="e.g. E-01"
              value={entryNo}
              onChange={(e) => setEntryNo(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        {/* Row 2: KBL Challan No, SR No */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              KBL Challan No <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. KBL-2024-0105"
              value={kblChallanNo}
              onChange={(e) => setKblChallanNo(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none uppercase font-mono"
            />
            {errors.kblChallanNo && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.kblChallanNo}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              SR Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. SR-1005"
              value={srNo}
              onChange={(e) => setSrNo(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none uppercase font-mono"
            />
            {errors.srNo && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.srNo}</p>
            )}
          </div>
        </div>

        {/* Row 3: Variety, Seed Class, Grade */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Variety <span className="text-rose-500">*</span>
            </label>
            <select
              value={varietyId}
              onChange={(e) => setVarietyId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {varieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Seed Class <span className="text-rose-500">*</span>
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {seedClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Grade <span className="text-rose-500">*</span>
            </label>
            <select
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Production Block, Potato Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Production Block
            </label>
            <select
              value={productionBlockId}
              onChange={(e) => setProductionBlockId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {productionBlocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Potato Type
            </label>
            <select
              value={potatoTypeId}
              onChange={(e) => setPotatoTypeId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {potatoTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 5: Sack Quantity, KG Per Bag, Auto Calculated Total KG & MT */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Sack Quantity & Weight Calculations
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Sack Quantity (Bags) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={sackQuantity}
                onChange={(e) => setSackQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none font-semibold"
              />
              {errors.sackQuantity && (
                <p className="text-[10px] text-rose-500 mt-1">{errors.sackQuantity}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                KG Per Bag
              </label>
              <select
                value={kgPerBag}
                onChange={(e) => setKgPerBag(parseInt(e.target.value) || 50)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
              >
                {kgPerBagOptions.map((kg) => (
                  <option key={kg} value={kg}>
                    {kg} KG / Bag
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-medium text-slate-400 block">
                Total Weight (KG)
              </span>
              <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                {totalKg.toLocaleString()} KG
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-medium text-slate-400 block">
                Total Metric Tons (MT)
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {totalMt} MT
              </span>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Remarks & Quality Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Inspected lot, zero disease signs, good moisture condition"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>

          {!initialData && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-xl border border-sky-200 dark:border-sky-800/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Save & Add Another
            </button>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {initialData ? 'Update Record' : 'Save Stock Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
