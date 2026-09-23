import {
  StockTransaction,
  DeliveryTransaction,
  ColdStorage,
  Variety,
  SeedClass,
  Grade,
  ProductionBlock,
  PotatoType,
  RentPayment,
  FilterState,
} from '../types';

export interface StockSummaryRow {
  key: string;
  label: string;
  code?: string;
  totalReceivedBags: number;
  totalReceivedKg: number;
  totalReceivedMt: number;
  totalDeliveredBags: number;
  totalDeliveredKg: number;
  totalDeliveredMt: number;
  remainingBags: number;
  remainingKg: number;
  remainingMt: number;
  remainingPercentage: number;
  deliveryPercentage: number;
}

export interface DetailedBalanceItem {
  id: string;
  coldStorageId: string;
  coldStorageName: string;
  varietyId: string;
  varietyName: string;
  classId: string;
  className: string;
  gradeId: string;
  gradeName: string;
  productionBlockId: string;
  productionBlockName: string;
  potatoTypeId: string;
  potatoTypeName: string;
  kblChallanNo: string;
  srNo: string;
  kgPerBag: number;
  receivedBags: number;
  receivedKg: number;
  receivedMt: number;
  deliveredBags: number;
  deliveredKg: number;
  deliveredMt: number;
  remainingBags: number;
  remainingKg: number;
  remainingMt: number;
  remainingPercentage: number;
  deliveryPercentage: number;
}

export interface ColdStorageRentSummary {
  coldStorageId: string;
  coldStorageName: string;
  location: string;
  rentPerBag: number;
  totalStorageBags: number;
  totalRentAmount: number;
  deliveredBags: number;
  remainingBags: number;
  rentPaidAmount: number;
  rentDueAmount: number;
  paymentStatus: 'Paid in Full' | 'Partial' | 'Pending';
}

export interface DatewiseDeliveryRow {
  date: string;
  stockInHandBags: number;
  deliveredBags: number;
  remainingBags: number;
  deliveredKg: number;
  remainingKg: number;
  deliveredPercentage: number;
  remainingPercentage: number;
  challansCount: number;
}

// Check if a transaction satisfies filters
export function matchesFilter(
  item: {
    date: string;
    coldStorageId: string;
    varietyId: string;
    classId: string;
    gradeId: string;
    productionBlockId?: string;
    potatoTypeId?: string;
    kblChallanNo?: string;
    srNo?: string;
  },
  filter: FilterState
): boolean {
  if (filter.startDate && item.date < filter.startDate) return false;
  if (filter.endDate && item.date > filter.endDate) return false;
  if (filter.coldStorageId && item.coldStorageId !== filter.coldStorageId) return false;
  if (filter.varietyId && item.varietyId !== filter.varietyId) return false;
  if (filter.classId && item.classId !== filter.classId) return false;
  if (filter.gradeId && item.gradeId !== filter.gradeId) return false;
  if (filter.productionBlockId && item.productionBlockId !== filter.productionBlockId) return false;
  if (filter.potatoTypeId && item.potatoTypeId !== filter.potatoTypeId) return false;
  if (
    filter.challanNo &&
    item.kblChallanNo &&
    !item.kblChallanNo.toLowerCase().includes(filter.challanNo.toLowerCase())
  )
    return false;
  if (
    filter.srNo &&
    item.srNo &&
    !item.srNo.toLowerCase().includes(filter.srNo.toLowerCase())
  )
    return false;

  return true;
}

// Calculate total metrics across all or filtered records
export function calculateOverallMetrics(
  stockList: StockTransaction[],
  deliveryList: DeliveryTransaction[],
  coldStorages: ColdStorage[],
  filter?: FilterState
) {
  const filteredStock = filter
    ? stockList.filter((s) => matchesFilter(s, filter))
    : stockList;

  const filteredDelivery = filter
    ? deliveryList.filter((d) => matchesFilter(d, filter))
    : deliveryList;

  const totalReceivedBags = filteredStock.reduce((acc, s) => acc + (s.sackQuantity || 0), 0);
  const totalReceivedKg = filteredStock.reduce((acc, s) => acc + (s.totalKg || 0), 0);
  const totalReceivedMt = filteredStock.reduce((acc, s) => acc + (s.totalMt || 0), 0);

  const totalDeliveredBags = filteredDelivery.reduce((acc, d) => acc + (d.sackQuantity || 0), 0);
  const totalDeliveredKg = filteredDelivery.reduce((acc, d) => acc + (d.totalKg || 0), 0);
  const totalDeliveredMt = filteredDelivery.reduce((acc, d) => acc + (d.totalMt || 0), 0);

  const remainingBags = Math.max(0, totalReceivedBags - totalDeliveredBags);
  const remainingKg = Math.max(0, totalReceivedKg - totalDeliveredKg);
  const remainingMt = Math.max(0, totalReceivedMt - totalDeliveredMt);

  const remainingPercentage =
    totalReceivedBags > 0 ? (remainingBags / totalReceivedBags) * 100 : 0;
  const deliveryPercentage =
    totalReceivedBags > 0 ? (totalDeliveredBags / totalReceivedBags) * 100 : 0;

  const uniqueChallans = new Set(filteredStock.map((s) => s.kblChallanNo)).size;
  const uniqueSRs = new Set(filteredStock.map((s) => s.srNo)).size;
  const uniqueVarieties = new Set(filteredStock.map((s) => s.varietyId)).size;
  const activeStorages = coldStorages.filter((c) => c.status === 'active').length;

  return {
    totalReceivedBags,
    totalReceivedKg,
    totalReceivedMt,
    totalDeliveredBags,
    totalDeliveredKg,
    totalDeliveredMt,
    remainingBags,
    remainingKg,
    remainingMt,
    remainingPercentage,
    deliveryPercentage,
    uniqueChallans,
    uniqueSRs,
    uniqueVarieties,
    activeStorages,
  };
}

// Available stock checker for delivery
export function getAvailableStockForBatch(
  stockList: StockTransaction[],
  deliveryList: DeliveryTransaction[],
  criteria: {
    coldStorageId: string;
    varietyId: string;
    classId: string;
    gradeId: string;
    srNo?: string;
    kblChallanNo?: string;
  }
): { availableBags: number; availableKg: number; availableMt: number } {
  const matchingStock = stockList.filter(
    (s) =>
      s.status === 'approved' &&
      s.coldStorageId === criteria.coldStorageId &&
      s.varietyId === criteria.varietyId &&
      s.classId === criteria.classId &&
      s.gradeId === criteria.gradeId &&
      (!criteria.srNo || s.srNo === criteria.srNo) &&
      (!criteria.kblChallanNo || s.kblChallanNo === criteria.kblChallanNo)
  );

  const matchingDelivery = deliveryList.filter(
    (d) =>
      d.status === 'approved' &&
      d.coldStorageId === criteria.coldStorageId &&
      d.varietyId === criteria.varietyId &&
      d.classId === criteria.classId &&
      d.gradeId === criteria.gradeId &&
      (!criteria.srNo || d.srNo === criteria.srNo) &&
      (!criteria.kblChallanNo || d.kblChallanNo === criteria.kblChallanNo)
  );

  const totalStockBags = matchingStock.reduce((acc, s) => acc + s.sackQuantity, 0);
  const totalDeliveredBags = matchingDelivery.reduce((acc, d) => acc + d.sackQuantity, 0);
  const availableBags = Math.max(0, totalStockBags - totalDeliveredBags);

  const totalStockKg = matchingStock.reduce((acc, s) => acc + s.totalKg, 0);
  const totalDeliveredKg = matchingDelivery.reduce((acc, d) => acc + d.totalKg, 0);
  const availableKg = Math.max(0, totalStockKg - totalDeliveredKg);

  return {
    availableBags,
    availableKg,
    availableMt: availableKg / 1000,
  };
}

// Group summary generator
export function getStockSummaryByDimension(
  dimension: 'coldStorage' | 'variety' | 'class' | 'grade' | 'productionBlock' | 'potatoType',
  stockList: StockTransaction[],
  deliveryList: DeliveryTransaction[],
  masterList: { id: string; name: string; code?: string }[],
  filter?: FilterState
): StockSummaryRow[] {
  const filteredStock = filter
    ? stockList.filter((s) => matchesFilter(s, filter))
    : stockList;
  const filteredDelivery = filter
    ? deliveryList.filter((d) => matchesFilter(d, filter))
    : deliveryList;

  const keyMap: Record<string, string> = {
    coldStorage: 'coldStorageId',
    variety: 'varietyId',
    class: 'classId',
    grade: 'gradeId',
    productionBlock: 'productionBlockId',
    potatoType: 'potatoTypeId',
  };

  const propName = keyMap[dimension] as keyof StockTransaction;

  return masterList.map((item) => {
    const itemStock = filteredStock.filter((s) => s[propName] === item.id);
    const itemDelivery = filteredDelivery.filter((d) => (d as any)[propName] === item.id);

    const totalReceivedBags = itemStock.reduce((acc, s) => acc + s.sackQuantity, 0);
    const totalReceivedKg = itemStock.reduce((acc, s) => acc + s.totalKg, 0);
    const totalReceivedMt = itemStock.reduce((acc, s) => acc + s.totalMt, 0);

    const totalDeliveredBags = itemDelivery.reduce((acc, d) => acc + d.sackQuantity, 0);
    const totalDeliveredKg = itemDelivery.reduce((acc, d) => acc + d.totalKg, 0);
    const totalDeliveredMt = itemDelivery.reduce((acc, d) => acc + d.totalMt, 0);

    const remainingBags = Math.max(0, totalReceivedBags - totalDeliveredBags);
    const remainingKg = Math.max(0, totalReceivedKg - totalDeliveredKg);
    const remainingMt = Math.max(0, totalReceivedMt - totalDeliveredMt);

    const remainingPercentage =
      totalReceivedBags > 0 ? (remainingBags / totalReceivedBags) * 100 : 0;
    const deliveryPercentage =
      totalReceivedBags > 0 ? (totalDeliveredBags / totalReceivedBags) * 100 : 0;

    return {
      key: item.id,
      label: item.name,
      code: item.code,
      totalReceivedBags,
      totalReceivedKg,
      totalReceivedMt,
      totalDeliveredBags,
      totalDeliveredKg,
      totalDeliveredMt,
      remainingBags,
      remainingKg,
      remainingMt,
      remainingPercentage,
      deliveryPercentage,
    };
  });
}

// Cold Storage Rent Ledger Calculator
export function calculateRentSummary(
  coldStorages: ColdStorage[],
  stockList: StockTransaction[],
  deliveryList: DeliveryTransaction[],
  rentPayments: RentPayment[]
): {
  items: ColdStorageRentSummary[];
  totalRentAmount: number;
  totalPaidAmount: number;
  totalDueAmount: number;
} {
  let totalRent = 0;
  let totalPaid = 0;
  let totalDue = 0;

  const items: ColdStorageRentSummary[] = coldStorages.map((cs) => {
    const csStock = stockList.filter((s) => s.coldStorageId === cs.id);
    const csDelivery = deliveryList.filter((d) => d.coldStorageId === cs.id);
    const csPayments = rentPayments.filter((p) => p.coldStorageId === cs.id);

    const totalStorageBags = csStock.reduce((acc, s) => acc + s.sackQuantity, 0);
    const deliveredBags = csDelivery.reduce((acc, d) => acc + d.sackQuantity, 0);
    const remainingBags = Math.max(0, totalStorageBags - deliveredBags);

    const totalRentAmount = totalStorageBags * (cs.rentPerBag || 0);
    const rentPaidAmount = csPayments.reduce((acc, p) => acc + (p.amountPaid ?? p.amount ?? 0), 0);
    const rentDueAmount = Math.max(0, totalRentAmount - rentPaidAmount);

    let paymentStatus: 'Paid in Full' | 'Partial' | 'Pending' = 'Pending';
    if (rentPaidAmount >= totalRentAmount && totalRentAmount > 0) {
      paymentStatus = 'Paid in Full';
    } else if (rentPaidAmount > 0) {
      paymentStatus = 'Partial';
    }

    totalRent += totalRentAmount;
    totalPaid += rentPaidAmount;
    totalDue += rentDueAmount;

    return {
      coldStorageId: cs.id,
      coldStorageName: cs.name,
      location: cs.location,
      rentPerBag: cs.rentPerBag,
      totalStorageBags,
      totalRentAmount,
      deliveredBags,
      remainingBags,
      rentPaidAmount,
      rentDueAmount,
      paymentStatus,
    };
  });

  return {
    items,
    totalRentAmount: totalRent,
    totalPaidAmount: totalPaid,
    totalDueAmount: totalDue,
  };
}

// Date-wise Delivery Report Data
export function calculateDatewiseDelivery(
  stockList: StockTransaction[],
  deliveryList: DeliveryTransaction[],
  filter?: FilterState
): DatewiseDeliveryRow[] {
  const filteredStock = filter
    ? stockList.filter((s) => matchesFilter(s, filter))
    : stockList;
  const filteredDelivery = filter
    ? deliveryList.filter((d) => matchesFilter(d, filter))
    : deliveryList;

  const totalInitialBags = filteredStock.reduce((acc, s) => acc + s.sackQuantity, 0);
  const totalInitialKg = filteredStock.reduce((acc, s) => acc + s.totalKg, 0);

  // Group deliveries by date
  const dateMap: Record<
    string,
    { deliveredBags: number; deliveredKg: number; challans: Set<string> }
  > = {};

  filteredDelivery.forEach((d) => {
    if (!dateMap[d.date]) {
      dateMap[d.date] = {
        deliveredBags: 0,
        deliveredKg: 0,
        challans: new Set<string>(),
      };
    }
    dateMap[d.date].deliveredBags += d.sackQuantity;
    dateMap[d.date].deliveredKg += d.totalKg;
    if (d.kblChallanNo) dateMap[d.date].challans.add(d.kblChallanNo);
  });

  const sortedDates = Object.keys(dateMap).sort();
  let cumulativeDeliveredBags = 0;
  let cumulativeDeliveredKg = 0;

  return sortedDates.map((date) => {
    const cur = dateMap[date];
    const deliveredBags = cur.deliveredBags;
    const deliveredKg = cur.deliveredKg;

    cumulativeDeliveredBags += deliveredBags;
    cumulativeDeliveredKg += deliveredKg;

    const stockInHandBags = Math.max(0, totalInitialBags - (cumulativeDeliveredBags - deliveredBags));
    const remainingBags = Math.max(0, totalInitialBags - cumulativeDeliveredBags);
    const remainingKg = Math.max(0, totalInitialKg - cumulativeDeliveredKg);

    const deliveredPercentage =
      totalInitialBags > 0 ? (deliveredBags / totalInitialBags) * 100 : 0;
    const remainingPercentage =
      totalInitialBags > 0 ? (remainingBags / totalInitialBags) * 100 : 0;

    return {
      date,
      stockInHandBags,
      deliveredBags,
      remainingBags,
      deliveredKg,
      remainingKg,
      deliveredPercentage,
      remainingPercentage,
      challansCount: cur.challans.size,
    };
  });
}

// Live Stock Item-wise Matrix Interfaces
export interface LiveStockMatrixColumn {
  key: string;
  label: string;
}

export type LiveStockMatrixRowType = 'data' | 'subtotal' | 'single' | 'gap' | 'grandtotal';

export interface LiveStockMatrixRow {
  id: string;
  label: string;
  type: LiveStockMatrixRowType;
  isBlueLabel?: boolean;
  isBold?: boolean;
  isGreen?: boolean;
  boxStyle?: 'top' | 'middle' | 'bottom' | 'single' | 'none';
  values: Record<string, number>;
  total: number;
}

export interface LiveStockMatrixResult {
  columns: LiveStockMatrixColumn[];
  rows: LiveStockMatrixRow[];
  columnTotals: Record<string, number>;
  grandTotal: number;
}

export function calculateLiveStockMatrix(
  stockList: StockTransaction[],
  deliveryList: DeliveryTransaction[],
  varieties: Variety[],
  seedClasses: SeedClass[],
  grades: Grade[],
  potatoTypes: PotatoType[],
  filter?: FilterState
): LiveStockMatrixResult {
  const filteredStock = filter
    ? stockList.filter((s) => matchesFilter(s, filter))
    : stockList;
  const filteredDelivery = filter
    ? deliveryList.filter((d) => matchesFilter(d, filter))
    : deliveryList;

  // The 4 fixed variety columns matching the spreadsheet specification
  const columns: LiveStockMatrixColumn[] = [
    { key: 'ASTERIX', label: 'ASTERIX' },
    { key: 'DIAMANT', label: 'DIAMANT' },
    { key: 'GRANOLA', label: 'GRANOLA' },
    { key: 'SUN-SHINE', label: 'SUN-SHINE' },
  ];

  // Lookup maps for fast and case-tolerant matching
  const varietyMap = new Map(varieties.map((v) => [v.id, v]));
  const classMap = new Map(seedClasses.map((c) => [c.id, c]));
  const gradeMap = new Map(grades.map((g) => [g.id, g]));
  const potatoTypeMap = new Map(potatoTypes.map((p) => [p.id, p]));

  // Helper to determine variety column key
  const getVarietyColKey = (varietyId: string): string | null => {
    const v = varietyMap.get(varietyId);
    const name = (v?.name || '').toUpperCase().trim();
    const code = (v?.code || '').toUpperCase().trim();

    if (code === 'AST' || name.includes('ASTERIX')) return 'ASTERIX';
    if (code === 'DIA' || name.includes('DIAMANT')) return 'DIAMANT';
    if (code === 'GRA' || name.includes('GRANOLA')) return 'GRANOLA';
    if (code === 'SUN' || name.includes('SUN-SHINE') || name.includes('SUNSHINE')) return 'SUN-SHINE';
    return null;
  };

  // Compute live remaining bags for each bucket: `${varietyId}___${classId}___${gradeId}___${potatoTypeId}`
  const bucketStock: Record<string, number> = {};
  const bucketDelivery: Record<string, number> = {};

  filteredStock.forEach((s) => {
    if (s.status === 'approved') {
      const bKey = `${s.varietyId}___${s.classId}___${s.gradeId}___${s.potatoTypeId || ''}`;
      bucketStock[bKey] = (bucketStock[bKey] || 0) + (s.sackQuantity || 0);
    }
  });

  filteredDelivery.forEach((d) => {
    if (d.status === 'approved' || d.status === 'completed') {
      const bKey = `${d.varietyId}___${d.classId}___${d.gradeId}___${d.potatoTypeId || ''}`;
      bucketDelivery[bKey] = (bucketDelivery[bKey] || 0) + (d.sackQuantity || 0);
    }
  });

  const allBucketKeys = new Set([...Object.keys(bucketStock), ...Object.keys(bucketDelivery)]);
  const remainingByBucket: {
    varietyCol: string | null;
    className: string;
    classCode: string;
    gradeName: string;
    gradeCode: string;
    typeName: string;
    typeCode: string;
    remaining: number;
  }[] = [];

  allBucketKeys.forEach((key) => {
    const [varId, classId, gradeId, typeId] = key.split('___');
    const rec = bucketStock[key] || 0;
    const del = bucketDelivery[key] || 0;
    const rem = Math.max(0, rec - del);

    const vCol = getVarietyColKey(varId);
    const cls = classMap.get(classId);
    const grd = gradeMap.get(gradeId);
    const typ = potatoTypeMap.get(typeId);

    remainingByBucket.push({
      varietyCol: vCol,
      className: (cls?.name || '').toLowerCase(),
      classCode: (cls?.code || '').toUpperCase(),
      gradeName: (grd?.name || '').toLowerCase(),
      gradeCode: (grd?.code || '').toUpperCase(),
      typeName: (typ?.name || '').toLowerCase(),
      typeCode: (typ?.code || '').toUpperCase(),
      remaining: rem,
    });
  });

  // Category matcher
  const matchRemaining = (
    predicate: (item: (typeof remainingByBucket)[0]) => boolean
  ): { values: Record<string, number>; total: number } => {
    const vals: Record<string, number> = {
      ASTERIX: 0,
      DIAMANT: 0,
      GRANOLA: 0,
      'SUN-SHINE': 0,
    };
    let tot = 0;

    remainingByBucket.forEach((b) => {
      if (predicate(b)) {
        if (b.varietyCol && vals[b.varietyCol] !== undefined) {
          vals[b.varietyCol] += b.remaining;
        }
        tot += b.remaining;
      }
    });

    return { values: vals, total: tot };
  };

  // Row Definitions matching the spreadsheet format precisely
  // 1. Certify A, B, US
  const certifyA = matchRemaining(
    (b) =>
      (b.classCode === 'CS' || b.className.includes('certif')) &&
      (b.gradeCode === 'A' || b.gradeName === 'grade a')
  );
  const certifyB = matchRemaining(
    (b) =>
      (b.classCode === 'CS' || b.className.includes('certif')) &&
      (b.gradeCode === 'B' || b.gradeName === 'grade b')
  );
  const certifyUS = matchRemaining(
    (b) =>
      (b.classCode === 'CS' || b.className.includes('certif')) &&
      (b.gradeCode === 'US' || b.gradeName.includes('under size') || b.gradeName.includes('us'))
  );
  const totalCertifyVals: Record<string, number> = {
    ASTERIX: certifyA.values.ASTERIX + certifyB.values.ASTERIX + certifyUS.values.ASTERIX,
    DIAMANT: certifyA.values.DIAMANT + certifyB.values.DIAMANT + certifyUS.values.DIAMANT,
    GRANOLA: certifyA.values.GRANOLA + certifyB.values.GRANOLA + certifyUS.values.GRANOLA,
    'SUN-SHINE': certifyA.values['SUN-SHINE'] + certifyB.values['SUN-SHINE'] + certifyUS.values['SUN-SHINE'],
  };
  const totalCertifyTotal = certifyA.total + certifyB.total + certifyUS.total;

  // 2. Foundation A, B, US, OS
  const foundationA = matchRemaining(
    (b) =>
      (b.classCode === 'FS' || (b.className.includes('foundation') && !b.className.includes('pre'))) &&
      (b.gradeCode === 'A' || b.gradeName === 'grade a')
  );
  const foundationB = matchRemaining(
    (b) =>
      (b.classCode === 'FS' || (b.className.includes('foundation') && !b.className.includes('pre'))) &&
      (b.gradeCode === 'B' || b.gradeName === 'grade b')
  );
  const foundationUS = matchRemaining(
    (b) =>
      (b.classCode === 'FS' || (b.className.includes('foundation') && !b.className.includes('pre'))) &&
      (b.gradeCode === 'US' || b.gradeName.includes('under size') || b.gradeName.includes('us'))
  );
  const foundationOS = matchRemaining(
    (b) =>
      (b.classCode === 'FS' || (b.className.includes('foundation') && !b.className.includes('pre'))) &&
      (b.gradeCode === 'OS' || b.gradeName.includes('over size') || b.gradeName.includes('os'))
  );
  const totalFoundationVals: Record<string, number> = {
    ASTERIX: foundationA.values.ASTERIX + foundationB.values.ASTERIX + foundationUS.values.ASTERIX + foundationOS.values.ASTERIX,
    DIAMANT: foundationA.values.DIAMANT + foundationB.values.DIAMANT + foundationUS.values.DIAMANT + foundationOS.values.DIAMANT,
    GRANOLA: foundationA.values.GRANOLA + foundationB.values.GRANOLA + foundationUS.values.GRANOLA + foundationOS.values.GRANOLA,
    'SUN-SHINE': foundationA.values['SUN-SHINE'] + foundationB.values['SUN-SHINE'] + foundationUS.values['SUN-SHINE'] + foundationOS.values['SUN-SHINE'],
  };
  const totalFoundationTotal = foundationA.total + foundationB.total + foundationUS.total + foundationOS.total;

  // 3. Mini Tuber
  const miniTuber = matchRemaining(
    (b) =>
      b.classCode === 'MT' ||
      b.classCode === 'BRD' ||
      b.className.includes('mini tuber') ||
      b.className.includes('breeder')
  );

  // 4. Table Potato (TP)
  const tablePotato = matchRemaining(
    (b) =>
      b.gradeCode === 'TP' ||
      b.gradeName.includes('tp') ||
      b.typeCode === 'TABLE' ||
      b.typeName.includes('table')
  );

  // 5. Pre-Foundation A, B, US
  const preFoundationA = matchRemaining(
    (b) =>
      (b.classCode === 'PF' || b.classCode === 'PFS' || b.className.includes('pre-foundation') || b.className.includes('pre foundation') || b.className.includes('pre-found') || b.className.includes('pre found')) &&
      (b.gradeCode === 'A' || b.gradeName === 'grade a')
  );
  const preFoundationB = matchRemaining(
    (b) =>
      (b.classCode === 'PF' || b.classCode === 'PFS' || b.className.includes('pre-foundation') || b.className.includes('pre foundation') || b.className.includes('pre-found') || b.className.includes('pre found')) &&
      (b.gradeCode === 'B' || b.gradeName === 'grade b')
  );
  const preFoundationUS = matchRemaining(
    (b) =>
      (b.classCode === 'PF' || b.classCode === 'PFS' || b.className.includes('pre-foundation') || b.className.includes('pre foundation') || b.className.includes('pre-found') || b.className.includes('pre found')) &&
      (b.gradeCode === 'US' || b.gradeName.includes('under size') || b.gradeName.includes('us'))
  );
  const totalPreFoundationVals: Record<string, number> = {
    ASTERIX: preFoundationA.values.ASTERIX + preFoundationB.values.ASTERIX + preFoundationUS.values.ASTERIX,
    DIAMANT: preFoundationA.values.DIAMANT + preFoundationB.values.DIAMANT + preFoundationUS.values.DIAMANT,
    GRANOLA: preFoundationA.values.GRANOLA + preFoundationB.values.GRANOLA + preFoundationUS.values.GRANOLA,
    'SUN-SHINE': preFoundationA.values['SUN-SHINE'] + preFoundationB.values['SUN-SHINE'] + preFoundationUS.values['SUN-SHINE'],
  };
  const totalPreFoundationTotal = preFoundationA.total + preFoundationB.total + preFoundationUS.total;

  // 6. TLS (A), TLS (B)
  const tlsA = matchRemaining(
    (b) =>
      (b.classCode === 'TLS' || b.className.includes('tls')) &&
      (b.gradeCode === 'A' || b.gradeName === 'grade a')
  );
  const tlsB = matchRemaining(
    (b) =>
      (b.classCode === 'TLS' || b.className.includes('tls')) &&
      (b.gradeCode === 'B' || b.gradeName === 'grade b')
  );
  const totalTlsVals: Record<string, number> = {
    ASTERIX: tlsA.values.ASTERIX + tlsB.values.ASTERIX,
    DIAMANT: tlsA.values.DIAMANT + tlsB.values.DIAMANT,
    GRANOLA: tlsA.values.GRANOLA + tlsB.values.GRANOLA,
    'SUN-SHINE': tlsA.values['SUN-SHINE'] + tlsB.values['SUN-SHINE'],
  };
  const totalTlsTotal = tlsA.total + tlsB.total;

  // 7. Non Traceable with SR
  const nonTraceable = matchRemaining(
    (b) =>
      b.classCode === 'NT' ||
      b.className.includes('non traceable') ||
      b.className.includes('non-traceable')
  );

  // Grand total calculations
  const grandTotalVals: Record<string, number> = {
    ASTERIX:
      totalCertifyVals.ASTERIX +
      totalFoundationVals.ASTERIX +
      miniTuber.values.ASTERIX +
      tablePotato.values.ASTERIX +
      totalPreFoundationVals.ASTERIX +
      totalTlsVals.ASTERIX +
      nonTraceable.values.ASTERIX,
    DIAMANT:
      totalCertifyVals.DIAMANT +
      totalFoundationVals.DIAMANT +
      miniTuber.values.DIAMANT +
      tablePotato.values.DIAMANT +
      totalPreFoundationVals.DIAMANT +
      totalTlsVals.DIAMANT +
      nonTraceable.values.DIAMANT,
    GRANOLA:
      totalCertifyVals.GRANOLA +
      totalFoundationVals.GRANOLA +
      miniTuber.values.GRANOLA +
      tablePotato.values.GRANOLA +
      totalPreFoundationVals.GRANOLA +
      totalTlsVals.GRANOLA +
      nonTraceable.values.GRANOLA,
    'SUN-SHINE':
      totalCertifyVals['SUN-SHINE'] +
      totalFoundationVals['SUN-SHINE'] +
      miniTuber.values['SUN-SHINE'] +
      tablePotato.values['SUN-SHINE'] +
      totalPreFoundationVals['SUN-SHINE'] +
      totalTlsVals['SUN-SHINE'] +
      nonTraceable.values['SUN-SHINE'],
  };

  const grandTotal =
    totalCertifyTotal +
    totalFoundationTotal +
    miniTuber.total +
    tablePotato.total +
    totalPreFoundationTotal +
    totalTlsTotal +
    nonTraceable.total;

  // Assemble full row sequence matching user specified sequence:
  // 1. Mini tuber, 2. Pre Foundation, 3. Foundation, 4. Certify, 5. TLS, 6. Table Potato, 7. Non traceble with SR
  const rows: LiveStockMatrixRow[] = [
    // 1. Mini Tuber
    {
      id: 'total-mini-tuber',
      label: 'Total Mini Tuber',
      type: 'single',
      boxStyle: 'none',
      values: miniTuber.values,
      total: miniTuber.total,
    },
    {
      id: 'gap-mini-tuber',
      label: '',
      type: 'gap',
      values: { ASTERIX: 0, DIAMANT: 0, GRANOLA: 0, 'SUN-SHINE': 0 },
      total: 0,
    },

    // 2. Pre-Foundation section
    {
      id: 'pre-foundation-a',
      label: 'Pre-Foundation A',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'top',
      values: preFoundationA.values,
      total: preFoundationA.total,
    },
    {
      id: 'pre-foundation-b',
      label: 'Pre-Foundation B',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'middle',
      values: preFoundationB.values,
      total: preFoundationB.total,
    },
    {
      id: 'pre-foundation-us',
      label: 'Pre-Foundation US',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'bottom',
      values: preFoundationUS.values,
      total: preFoundationUS.total,
    },
    {
      id: 'total-pre-foundation',
      label: 'Total Pre-Foundation',
      type: 'subtotal',
      boxStyle: 'none',
      values: totalPreFoundationVals,
      total: totalPreFoundationTotal,
    },
    {
      id: 'gap-pre-foundation',
      label: '',
      type: 'gap',
      values: { ASTERIX: 0, DIAMANT: 0, GRANOLA: 0, 'SUN-SHINE': 0 },
      total: 0,
    },

    // 3. Foundation section
    {
      id: 'foundation-a',
      label: 'Foundation A',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'top',
      values: foundationA.values,
      total: foundationA.total,
    },
    {
      id: 'foundation-b',
      label: 'Foundation B',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'middle',
      values: foundationB.values,
      total: foundationB.total,
    },
    {
      id: 'foundation-us',
      label: 'Foundation US',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'middle',
      values: foundationUS.values,
      total: foundationUS.total,
    },
    {
      id: 'foundation-os',
      label: 'Foundation OS',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'bottom',
      values: foundationOS.values,
      total: foundationOS.total,
    },
    {
      id: 'total-foundation',
      label: 'Total Foundation',
      type: 'subtotal',
      isBold: true,
      boxStyle: 'none',
      values: totalFoundationVals,
      total: totalFoundationTotal,
    },
    {
      id: 'gap-foundation',
      label: '',
      type: 'gap',
      values: { ASTERIX: 0, DIAMANT: 0, GRANOLA: 0, 'SUN-SHINE': 0 },
      total: 0,
    },

    // 4. Certify section
    {
      id: 'certify-a',
      label: 'Certify A',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'top',
      values: certifyA.values,
      total: certifyA.total,
    },
    {
      id: 'certify-b',
      label: 'Certify B',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'middle',
      values: certifyB.values,
      total: certifyB.total,
    },
    {
      id: 'certify-us',
      label: 'Certify US',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'bottom',
      values: certifyUS.values,
      total: certifyUS.total,
    },
    {
      id: 'total-certify',
      label: 'Total Certify',
      type: 'subtotal',
      isBold: true,
      boxStyle: 'none',
      values: totalCertifyVals,
      total: totalCertifyTotal,
    },
    {
      id: 'gap-certify',
      label: '',
      type: 'gap',
      values: { ASTERIX: 0, DIAMANT: 0, GRANOLA: 0, 'SUN-SHINE': 0 },
      total: 0,
    },

    // 5. TLS section
    {
      id: 'tls-a',
      label: 'TLS (A)',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'top',
      values: tlsA.values,
      total: tlsA.total,
    },
    {
      id: 'tls-b',
      label: 'TLS (B)',
      type: 'data',
      isBlueLabel: true,
      boxStyle: 'bottom',
      values: tlsB.values,
      total: tlsB.total,
    },
    {
      id: 'total-tls',
      label: 'TLS',
      type: 'subtotal',
      boxStyle: 'none',
      values: totalTlsVals,
      total: totalTlsTotal,
    },
    {
      id: 'gap-tls',
      label: '',
      type: 'gap',
      values: { ASTERIX: 0, DIAMANT: 0, GRANOLA: 0, 'SUN-SHINE': 0 },
      total: 0,
    },

    // 6. Table Potato (TP)
    {
      id: 'total-table-potato',
      label: 'Total Table Potato (TP)',
      type: 'single',
      boxStyle: 'none',
      values: tablePotato.values,
      total: tablePotato.total,
    },
    {
      id: 'gap-table-potato',
      label: '',
      type: 'gap',
      values: { ASTERIX: 0, DIAMANT: 0, GRANOLA: 0, 'SUN-SHINE': 0 },
      total: 0,
    },

    // 7. Non Traceable with SR
    {
      id: 'total-non-traceable',
      label: 'Total Non Traceable with SR',
      type: 'single',
      boxStyle: 'none',
      values: nonTraceable.values,
      total: nonTraceable.total,
    },
    {
      id: 'gap-non-traceable',
      label: '',
      type: 'gap',
      values: { ASTERIX: 0, DIAMANT: 0, GRANOLA: 0, 'SUN-SHINE': 0 },
      total: 0,
    },

    // Grand total row
    {
      id: 'grand-total',
      label: 'total',
      type: 'grandtotal',
      isGreen: true,
      isBold: true,
      boxStyle: 'single',
      values: grandTotalVals,
      total: grandTotal,
    },
  ];

  return {
    columns,
    rows,
    columnTotals: grandTotalVals,
    grandTotal,
  };
}
