import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { DeliveryTransaction } from '../../types';
import { Truck, Save, AlertCircle } from 'lucide-react';
import { deliveryEntrySchema, extractZodFieldErrors } from '../../utils/validationSchemas';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: DeliveryTransaction | null;
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
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
    addDeliveryTransaction,
    updateDeliveryTransaction,
    stockTransactions,
    deliveryTransactions,
    kgPerBagOptions,
  } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryNo, setDeliveryNo] = useState('');
  const [deliveryReference, setDeliveryReference] = useState('');
  const [customerReceiver, setCustomerReceiver] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [coldStorageId, setColdStorageId] = useState('');
  const [varietyId, setVarietyId] = useState('');
  const [classId, setClassId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [productionBlockId, setProductionBlockId] = useState('');
  const [potatoTypeId, setPotatoTypeId] = useState('');
  const [sackQuantity, setSackQuantity] = useState(100);
  const [kgPerBag, setKgPerBag] = useState(50);
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto calculate available stock for chosen dimensions
  const availableStockBags = React.useMemo(() => {
    if (!coldStorageId || !varietyId || !classId || !gradeId) return 0;
    const received = stockTransactions
      .filter(
        (s) =>
          s.coldStorageId === coldStorageId &&
          s.varietyId === varietyId &&
          s.classId === classId &&
          s.gradeId === gradeId
      )
      .reduce((acc, s) => acc + s.sackQuantity, 0);

    const delivered = deliveryTransactions
      .filter(
        (d) =>
          d.coldStorageId === coldStorageId &&
          d.varietyId === varietyId &&
          d.classId === classId &&
          d.gradeId === gradeId &&
          (initialData ? d.id !== initialData.id : true)
      )
      .reduce((acc, d) => acc + d.sackQuantity, 0);

    return Math.max(0, received - delivered);
  }, [
    coldStorageId,
    varietyId,
    classId,
    gradeId,
    stockTransactions,
    deliveryTransactions,
    initialData,
  ]);

  const totalKg = sackQuantity * kgPerBag;
  const totalMt = Number((totalKg / 1000).toFixed(3));

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setDeliveryNo(initialData.deliveryNo);
      setDeliveryReference(initialData.deliveryReference || '');
      setCustomerReceiver(initialData.customerReceiver);
      setVehicleNo(initialData.vehicleNo || '');
      setDriverName(initialData.driverName || '');
      setColdStorageId(initialData.coldStorageId);
      setVarietyId(initialData.varietyId);
      setClassId(initialData.classId);
      setGradeId(initialData.gradeId);
      setProductionBlockId(initialData.productionBlockId);
      setPotatoTypeId(initialData.potatoTypeId);
      setSackQuantity(initialData.sackQuantity);
      setKgPerBag(initialData.kgPerBag);
      setRemarks(initialData.remarks || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setDeliveryNo(`DEL-2024-${String(deliveryTransactions.length + 1).padStart(3, '0')}`);
      setDeliveryReference(`GP-${String(deliveryTransactions.length + 101)}`);
      setCustomerReceiver('');
      setVehicleNo('');
      setDriverName('');
      setColdStorageId(coldStorages[0]?.id || '');
      setVarietyId(varieties[0]?.id || '');
      setClassId(seedClasses[0]?.id || '');
      setGradeId(grades[0]?.id || '');
      setProductionBlockId(productionBlocks[0]?.id || '');
      setPotatoTypeId(potatoTypes[0]?.id || '');
      setSackQuantity(100);
      setKgPerBag(kgPerBagOptions[0] || 50);
      setRemarks('');
    }
    setErrors({});
  }, [initialData, isOpen, coldStorages, varieties, seedClasses, grades, productionBlocks, potatoTypes, kgPerBagOptions, deliveryTransactions.length]);

  const validate = (): boolean => {
    const parseResult = deliveryEntrySchema.safeParse({
      date,
      deliveryNo,
      deliveryReference: deliveryReference.trim() || undefined,
      customerReceiver,
      vehicleNo: vehicleNo.trim() || undefined,
      driverName: driverName.trim() || undefined,
      coldStorageId,
      varietyId,
      classId,
      gradeId,
      productionBlockId,
      potatoTypeId,
      sackQuantity: Number(sackQuantity),
      kgPerBag: Number(kgPerBag),
      remarks: remarks.trim() || undefined,
    });

    const newErrors: Record<string, string> = {};
    if (!parseResult.success) {
      Object.assign(newErrors, extractZodFieldErrors(parseResult.error));
    }

    // Check available stock against inventory
    if (!newErrors.sackQuantity && sackQuantity > availableStockBags) {
      newErrors.sackQuantity = `Insufficient stock! Only ${availableStockBags.toLocaleString()} bags available in storage.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    if (initialData) {
      updateDeliveryTransaction(initialData.id, {
        date,
        deliveryNo: deliveryNo.trim().toUpperCase(),
        deliveryReference: deliveryReference.trim() || undefined,
        customerReceiver: customerReceiver.trim(),
        vehicleNo: vehicleNo.trim() || undefined,
        driverName: driverName.trim() || undefined,
        coldStorageId,
        varietyId,
        classId,
        gradeId,
        productionBlockId,
        potatoTypeId,
        sackQuantity,
        kgPerBag,
        totalKg,
        totalMt,
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } else {
      const res = addDeliveryTransaction({
        date,
        deliveryNo: deliveryNo.trim().toUpperCase(),
        deliveryReference: deliveryReference.trim() || undefined,
        customerReceiver: customerReceiver.trim(),
        vehicleNo: vehicleNo.trim() || undefined,
        driverName: driverName.trim() || undefined,
        coldStorageId,
        varietyId,
        classId,
        gradeId,
        productionBlockId,
        potatoTypeId,
        sackQuantity,
        kgPerBag,
        totalKg,
        totalMt,
        remarks: remarks.trim() || undefined,
        status: 'completed',
      });

      if (res && res.success === false) {
        setErrors((prev) => ({ ...prev, sackQuantity: res.message }));
        return;
      }
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Delivery Consignment' : 'New Potato Seed Delivery / Stock Out'}
      subtitle="Issue outbound seed delivery, gate pass, and transport allotment"
      maxWidth="3xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >
        {/* Row 1: Delivery No, Gate Pass Ref, Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Delivery No <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={deliveryNo}
              onChange={(e) => setDeliveryNo(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none uppercase font-mono"
            />
            {errors.deliveryNo && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.deliveryNo}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gate Pass / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. GP-204"
              value={deliveryReference}
              onChange={(e) => setDeliveryReference(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            />
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
          </div>
        </div>

        {/* Row 2: Customer / Receiver, Vehicle No, Driver Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Receiver / Farmer / Hub <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Thakurgaon Regional Agro Hub"
              value={customerReceiver}
              onChange={(e) => setCustomerReceiver(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            />
            {errors.customerReceiver && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.customerReceiver}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Truck / Vehicle No
            </label>
            <input
              type="text"
              placeholder="e.g. DHAKA-METRO-TA-11-2034"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Driver Name & Contact
            </label>
            <input
              type="text"
              placeholder="e.g. Rafiqul Islam (01712-XXXXXX)"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        {/* Row 3: Cold Storage Source */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Dispatch Cold Storage Facility <span className="text-rose-500">*</span>
          </label>
          <select
            value={coldStorageId}
            onChange={(e) => setColdStorageId(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none font-medium"
          >
            {coldStorages.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.name} ({cs.code}) — {cs.location}
              </option>
            ))}
          </select>
        </div>

        {/* Row 4: Variety, Class, Grade */}
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
                  {v.name}
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

        {/* Live Available Stock Badge */}
        <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-sky-800 dark:text-sky-200 font-medium">
            <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Available Storage Balance for Selection:</span>
          </div>
          <span className="text-sm font-bold text-sky-700 dark:text-sky-300">
            {availableStockBags.toLocaleString()} Bags ({(availableStockBags * 50) / 1000} MT)
          </span>
        </div>

        {/* Row 5: Sack Quantity, KG Per Bag, Weights */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Dispatch Bags <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={availableStockBags || 99999}
                value={sackQuantity}
                onChange={(e) => setSackQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none font-bold"
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
                Total Weight
              </span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {totalKg.toLocaleString()} KG
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-medium text-slate-400 block">
                Metric Tons
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {totalMt} MT
              </span>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Delivery Remarks & Instructions
          </label>
          <input
            type="text"
            placeholder="e.g. Delivered for Autumn 2024 seed multiplication program"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-xs transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            {initialData ? 'Update Delivery' : 'Issue Dispatch Challan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
