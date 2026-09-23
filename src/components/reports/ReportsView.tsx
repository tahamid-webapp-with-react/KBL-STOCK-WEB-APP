import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import {
  BarChart3,
  TrendingDown,
  Building2,
  FileText,
  Files,
  Grid3X3,
  Download,
  Printer,
  Search,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { SortIcon } from '../common/SortIcon';
import {
  getStockSummaryByDimension,
  calculateRentSummary,
} from '../../utils/stockEngine';

interface ReportsViewProps {
  reportType:
    | 'reports-stock'
    | 'reports-delivery'
    | 'reports-storage'
    | 'reports-sr'
    | 'reports-challan'
    | 'reports-dimensions';
}

export const ReportsView: React.FC<ReportsViewProps> = ({ reportType }) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const {
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    potatoTypes,
    rentPayments,
    companySettings,
    currentUser,
    setActiveTab,
    addToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // 1. DATA CALCULATION FOR STOCK REPORT
  const stockReportData = useMemo(() => {
    return stockTransactions.filter((item) => {
      if (selectedStorage && item.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && item.varietyId !== selectedVariety) return false;
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.kblChallanNo.toLowerCase().includes(q) ||
          item.srNo.toLowerCase().includes(q) ||
          (item.entryNo && item.entryNo.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [stockTransactions, selectedStorage, selectedVariety, dateFrom, dateTo, search]);

  // 2. DATA CALCULATION FOR DELIVERY REPORT
  const deliveryReportData = useMemo(() => {
    return deliveryTransactions.filter((item) => {
      if (selectedStorage && item.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && item.varietyId !== selectedVariety) return false;
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.deliveryNo.toLowerCase().includes(q) ||
          item.customerReceiver.toLowerCase().includes(q) ||
          (item.vehicleNo && item.vehicleNo.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [deliveryTransactions, selectedStorage, selectedVariety, dateFrom, dateTo, search]);

  // 3. STORAGE-WISE REPORT DATA
  const storageWiseData = useMemo(() => {
    const rentSummary = calculateRentSummary(
      coldStorages,
      stockTransactions,
      deliveryTransactions,
      rentPayments
    );

    return coldStorages.map((cs) => {
      const received = stockTransactions
        .filter((s) => s.coldStorageId === cs.id)
        .reduce((acc, s) => acc + s.sackQuantity, 0);

      const delivered = deliveryTransactions
        .filter((d) => d.coldStorageId === cs.id)
        .reduce((acc, d) => acc + d.sackQuantity, 0);

      const remaining = Math.max(0, received - delivered);
      const occupancy = cs.capacity > 0 ? (remaining / cs.capacity) * 100 : 0;
      const rentInfo = rentSummary.items.find((s) => s.coldStorageId === cs.id);

      return {
        ...cs,
        totalReceivedBags: received,
        totalDeliveredBags: delivered,
        remainingBags: remaining,
        balanceBags: remaining,
        balanceMt: (remaining * 50) / 1000,
        occupancyRate: occupancy,
        occupancyPct: occupancy,
        totalRent: rentInfo?.totalRentAmount || received * cs.rentPerBag,
        totalPaid: rentInfo?.rentPaidAmount || 0,
        totalDue: rentInfo?.rentDueAmount || 0,
        paymentStatus: rentInfo?.paymentStatus || 'Pending',
      };
    });
  }, [coldStorages, stockTransactions, deliveryTransactions, rentPayments]);

  // 4. SR-WISE REPORT DATA
  const srWiseData = useMemo(() => {
    const map: Record<string, any> = {};
    stockTransactions.forEach((s) => {
      if (!map[s.srNo]) {
        const storage = coldStorages.find((c) => c.id === s.coldStorageId);
        const variety = varieties.find((v) => v.id === s.varietyId);
        const seedClass = seedClasses.find((c) => c.id === s.classId);
        const grade = grades.find((g) => g.id === s.gradeId);
        map[s.srNo] = {
          srNo: s.srNo,
          challanNo: s.kblChallanNo,
          storageCode: storage?.code || s.coldStorageId,
          storageName: storage?.name || s.coldStorageId,
          varietyName: variety?.name || s.varietyId,
          className: seedClass?.name || s.classId,
          gradeName: grade?.name || s.gradeId,
          date: s.date,
          bagQty: 0,
          totalKg: 0,
          totalMt: 0,
        };
      }
      map[s.srNo].bagQty += s.sackQuantity;
      map[s.srNo].totalKg += s.totalKg;
      map[s.srNo].totalMt += s.totalMt;
    });

    return Object.values(map).filter((item: any) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.srNo.toLowerCase().includes(q) ||
          item.challanNo.toLowerCase().includes(q) ||
          item.varietyName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [stockTransactions, coldStorages, varieties, seedClasses, grades, search]);

  // 5. CHALLAN-WISE REPORT DATA
  const challanWiseData = useMemo(() => {
    const map: Record<string, any> = {};
    stockTransactions.forEach((s) => {
      if (!map[s.kblChallanNo]) {
        const storage = coldStorages.find((c) => c.id === s.coldStorageId);
        map[s.kblChallanNo] = {
          challanNo: s.kblChallanNo,
          storageCode: storage?.code || s.coldStorageId,
          storageName: storage?.name || s.coldStorageId,
          date: s.date,
          srs: new Set<string>(),
          varieties: new Set<string>(),
          totalBags: 0,
          totalKg: 0,
          totalMt: 0,
        };
      }
      map[s.kblChallanNo].srs.add(s.srNo);
      const variety = varieties.find((v) => v.id === s.varietyId)?.name || s.varietyId;
      map[s.kblChallanNo].varieties.add(variety);
      map[s.kblChallanNo].totalBags += s.sackQuantity;
      map[s.kblChallanNo].totalKg += s.totalKg;
      map[s.kblChallanNo].totalMt += s.totalMt;
    });

    return Object.values(map).filter((item: any) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        return item.challanNo.toLowerCase().includes(q);
      }
      return true;
    });
  }, [stockTransactions, coldStorages, varieties, search]);

  // 6. VARIETY / GRADE DIMENSIONAL MATRIX
  const matrixData = useMemo(() => {
    // Rows: Varieties, Columns: Grades
    return varieties.map((v) => {
      const gradeCounts: Record<string, number> = {};
      let rowTotal = 0;

      grades.forEach((g) => {
        const received = stockTransactions
          .filter((s) => s.varietyId === v.id && s.gradeId === g.id)
          .reduce((acc, s) => acc + s.sackQuantity, 0);

        const delivered = deliveryTransactions
          .filter((d) => d.varietyId === v.id && d.gradeId === g.id)
          .reduce((acc, d) => acc + d.sackQuantity, 0);

        const remaining = Math.max(0, received - delivered);
        gradeCounts[g.id] = remaining;
        rowTotal += remaining;
      });

      return {
        varietyId: v.id,
        varietyName: v.name,
        varietyCode: v.code,
        gradeCounts,
        rowTotal,
      };
    });
  }, [varieties, grades, stockTransactions, deliveryTransactions]);

  // REPORT EXPORT HANDLERS
  const handleExportExcel = () => {
    switch (reportType) {
      case 'reports-stock': {
        const rows = stockReportData.map((s, idx) => ({
          sl: idx + 1,
          date: s.date,
          challan: s.kblChallanNo,
          sr: s.srNo,
          storage: coldStorages.find((c) => c.id === s.coldStorageId)?.name || s.coldStorageId,
          variety: varieties.find((v) => v.id === s.varietyId)?.name || s.varietyId,
          class: seedClasses.find((c) => c.id === s.classId)?.name || s.classId,
          grade: grades.find((g) => g.id === s.gradeId)?.name || s.gradeId,
          bags: s.sackQuantity,
          kg: s.totalKg,
          mt: s.totalMt,
        }));
        exportToExcel(
          rows,
          [
            { header: 'SL', key: 'sl', width: 6 },
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Challan', key: 'challan', width: 16 },
            { header: 'SR No', key: 'sr', width: 14 },
            { header: 'Storage', key: 'storage', width: 24 },
            { header: 'Variety', key: 'variety', width: 14 },
            { header: 'Class', key: 'class', width: 14 },
            { header: 'Grade', key: 'grade', width: 12 },
            { header: 'Bags', key: 'bags', width: 10 },
            { header: 'Total KG', key: 'kg', width: 14 },
            { header: 'Total MT', key: 'mt', width: 12 },
          ],
          'Potato_Seed_Stock_Inbound_Report',
          'Potato Seed Stock Detailed Inbound Report',
          companySettings
        );
        break;
      }
      case 'reports-delivery': {
        const rows = deliveryReportData.map((d, idx) => ({
          sl: idx + 1,
          date: d.date,
          delNo: d.deliveryNo,
          receiver: d.customerReceiver,
          storage: coldStorages.find((c) => c.id === d.coldStorageId)?.name || d.coldStorageId,
          variety: varieties.find((v) => v.id === d.varietyId)?.name || d.varietyId,
          bags: d.sackQuantity,
          kg: d.totalKg,
          mt: d.totalMt,
          vehicle: d.vehicleNo || '-',
        }));
        exportToExcel(
          rows,
          [
            { header: 'SL', key: 'sl', width: 6 },
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Delivery No', key: 'delNo', width: 16 },
            { header: 'Receiver / Hub', key: 'receiver', width: 26 },
            { header: 'Storage', key: 'storage', width: 24 },
            { header: 'Variety', key: 'variety', width: 14 },
            { header: 'Bags', key: 'bags', width: 10 },
            { header: 'Total KG', key: 'kg', width: 14 },
            { header: 'MT', key: 'mt', width: 12 },
            { header: 'Vehicle', key: 'vehicle', width: 18 },
          ],
          'Potato_Seed_Delivery_Report',
          'Potato Seed Outbound Delivery Report',
          companySettings
        );
        break;
      }
      case 'reports-storage': {
        const rows = storageWiseData.map((cs) => ({
          code: cs.code,
          name: cs.name,
          location: cs.location,
          capacity: cs.capacity,
          received: cs.totalReceivedBags,
          delivered: cs.totalDeliveredBags,
          remaining: cs.remainingBags,
          occupancy: `${cs.occupancyRate.toFixed(1)}%`,
          rentDue: cs.totalDue,
        }));
        exportToExcel(
          rows,
          [
            { header: 'Code', key: 'code', width: 12 },
            { header: 'Storage Facility', key: 'name', width: 28 },
            { header: 'Location', key: 'location', width: 20 },
            { header: 'Capacity', key: 'capacity', width: 14 },
            { header: 'Received Bags', key: 'received', width: 14 },
            { header: 'Delivered Bags', key: 'delivered', width: 14 },
            { header: 'Remaining Bags', key: 'remaining', width: 14 },
            { header: 'Occupancy', key: 'occupancy', width: 12 },
            { header: 'Rent Due (BDT)', key: 'rentDue', width: 16 },
          ],
          'Cold_Storage_Audit_Report',
          'Cold Storage Capacity & Occupancy Report',
          companySettings
        );
        break;
      }
      case 'reports-sr': {
        const rows = srWiseData.map((item: any) => ({
          srNo: item.srNo,
          challan: item.challanNo,
          storage: item.storageName,
          variety: item.varietyName,
          class: item.className,
          grade: item.gradeName,
          date: item.date,
          bags: item.bagQty,
          mt: Number(item.totalMt.toFixed(2)),
        }));
        exportToExcel(
          rows,
          [
            { header: 'SR No', key: 'srNo', width: 14 },
            { header: 'Challan No', key: 'challan', width: 16 },
            { header: 'Storage', key: 'storage', width: 24 },
            { header: 'Variety', key: 'variety', width: 14 },
            { header: 'Class', key: 'class', width: 14 },
            { header: 'Grade', key: 'grade', width: 12 },
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Total Bags', key: 'bags', width: 12 },
            { header: 'MT', key: 'mt', width: 12 },
          ],
          'SR_Wise_Potato_Stock_Report',
          'SR-wise Potato Seed Stock Report',
          companySettings
        );
        break;
      }
      case 'reports-challan': {
        const rows = challanWiseData.map((item: any) => ({
          challan: item.challanNo,
          date: item.date,
          storage: item.storageName,
          srsCount: item.srs.size,
          srsList: Array.from(item.srs).join(', '),
          varieties: Array.from(item.varieties).join(', '),
          bags: item.totalBags,
          mt: Number(item.totalMt.toFixed(2)),
        }));
        exportToExcel(
          rows,
          [
            { header: 'KBL Challan', key: 'challan', width: 18 },
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Cold Storage', key: 'storage', width: 24 },
            { header: 'SR Count', key: 'srsCount', width: 10 },
            { header: 'Associated SRs', key: 'srsList', width: 24 },
            { header: 'Varieties', key: 'varieties', width: 20 },
            { header: 'Total Bags', key: 'bags', width: 14 },
            { header: 'Total MT', key: 'mt', width: 12 },
          ],
          'Challan_Wise_Potato_Stock_Report',
          'KBL Challan-wise Stock Inbound Report',
          companySettings
        );
        break;
      }
      case 'reports-dimensions': {
        const rows = matrixData.map((m) => {
          const row: any = {
            variety: m.varietyName,
          };
          grades.forEach((g) => {
            row[g.name] = m.gradeCounts[g.id] || 0;
          });
          row.total = m.rowTotal;
          return row;
        });
        const headers = [
          { header: 'Variety', key: 'variety', width: 20 },
          ...grades.map((g) => ({ header: g.name, key: g.name, width: 14 })),
          { header: 'Total Bags', key: 'total', width: 16 },
        ];
        exportToExcel(
          rows,
          headers,
          'Potato_Seed_Variety_Grade_Matrix',
          'Variety vs Grade Stock Balance Matrix',
          companySettings
        );
        break;
      }
    }
  };

  const printConfig = useMemo(() => {
    switch (reportType) {
      case 'reports-stock':
        return {
          title: 'POTATO SEED STOCK INBOUND REPORT',
          subtitle: `Total Consignments: ${stockReportData.length} records`,
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Challan', key: 'kblChallanNo' },
            { header: 'SR No', key: 'srNo' },
            { header: 'Storage', key: 'storageName' },
            { header: 'Variety', key: 'varietyName' },
            { header: 'Class', key: 'className' },
            { header: 'Grade', key: 'gradeName' },
            { header: 'Bags', key: 'sackQuantity' },
            { header: 'Total KG', key: 'totalKg' },
            { header: 'Total MT', key: 'totalMt' },
          ],
          data: stockReportData.map((s) => ({
            ...s,
            storageName: coldStorages.find((c) => c.id === s.coldStorageId)?.name || s.coldStorageId,
            varietyName: varieties.find((v) => v.id === s.varietyId)?.name || s.varietyId,
            className: seedClasses.find((c) => c.id === s.classId)?.name || s.classId,
            gradeName: grades.find((g) => g.id === s.gradeId)?.name || s.gradeId,
          })),
          summary: [
            { label: 'Total Records', value: stockReportData.length === 0 ? '-' : stockReportData.length },
            {
              label: 'Total Bags',
              value: (() => {
                const total = stockReportData.reduce((acc, i) => acc + i.sackQuantity, 0);
                return total === 0 ? '-' : total.toLocaleString();
              })(),
            },
            {
              label: 'Total MT',
              value: (() => {
                const total = stockReportData.reduce((acc, i) => acc + i.totalMt, 0);
                return total === 0 ? '-' : total.toFixed(2);
              })(),
            },
          ],
          filename: 'Stock_Inbound_Report',
        };
      case 'reports-delivery':
        return {
          title: 'POTATO SEED DELIVERY & DISPATCH REPORT',
          subtitle: `Total Dispatches: ${deliveryReportData.length} consignments`,
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Delivery No', key: 'deliveryNo' },
            { header: 'Consignee', key: 'customerReceiver' },
            { header: 'Storage', key: 'storageName' },
            { header: 'Variety', key: 'varietyName' },
            { header: 'Bags', key: 'sackQuantity' },
            { header: 'Total KG', key: 'totalKg' },
            { header: 'Total MT', key: 'totalMt' },
            { header: 'Vehicle', key: 'vehicleNo' },
          ],
          data: deliveryReportData.map((d) => ({
            ...d,
            storageName: coldStorages.find((c) => c.id === d.coldStorageId)?.name || d.coldStorageId,
            varietyName: varieties.find((v) => v.id === d.varietyId)?.name || d.varietyId,
          })),
          summary: [
            { label: 'Total Dispatches', value: deliveryReportData.length === 0 ? '-' : deliveryReportData.length },
            {
              label: 'Total Bags',
              value: (() => {
                const total = deliveryReportData.reduce((acc, i) => acc + i.sackQuantity, 0);
                return total === 0 ? '-' : total.toLocaleString();
              })(),
            },
            {
              label: 'Total MT',
              value: (() => {
                const total = deliveryReportData.reduce((acc, i) => acc + i.totalMt, 0);
                return total === 0 ? '-' : total.toFixed(2);
              })(),
            },
          ],
          filename: 'Delivery_Dispatch_Report',
        };
      case 'reports-storage':
        return {
          title: 'COLD STORAGE-WISE AUDIT REPORT',
          subtitle: `Facility Occupancy & Balance Summary`,
          columns: [
            { header: 'Cold Storage Facility', key: 'name' },
            { header: 'Capacity (MT)', key: 'capacityMt' },
            { header: 'Received Bags', key: 'totalReceivedBags' },
            { header: 'Delivered Bags', key: 'totalDeliveredBags' },
            { header: 'Balance Bags', key: 'balanceBags' },
            { header: 'Balance MT', key: 'balanceMt' },
            { header: 'Occupancy %', key: 'occupancyPct' },
          ],
          data: storageWiseData.map((s) => ({
            ...s,
            occupancyPct: `${s.occupancyPct.toFixed(1)}%`,
          })),
          summary: [
            { label: 'Total Facilities', value: storageWiseData.length === 0 ? '-' : storageWiseData.length },
            {
              label: 'Total Balance Bags',
              value: (() => {
                const total = storageWiseData.reduce((acc, i) => acc + i.balanceBags, 0);
                return total === 0 ? '-' : total.toLocaleString();
              })(),
            },
            {
              label: 'Total Balance MT',
              value: (() => {
                const total = storageWiseData.reduce((acc, i) => acc + i.balanceMt, 0);
                return total === 0 ? '-' : total.toFixed(2);
              })(),
            },
          ],
          filename: 'Storage_Audit_Report',
        };
      case 'reports-sr':
        return {
          title: 'SR-WISE LOT RECONCILIATION REPORT',
          subtitle: `Storage Receipt Level Auditing`,
          columns: [
            { header: 'SR Number', key: 'srNo' },
            { header: 'Cold Storage', key: 'storageName' },
            { header: 'Variety', key: 'varietyName' },
            { header: 'Class', key: 'className' },
            { header: 'Inbound Bags', key: 'totalReceived' },
            { header: 'Dispatched Bags', key: 'totalDelivered' },
            { header: 'Balance Bags', key: 'balance' },
            { header: 'Status', key: 'status' },
          ],
          data: srWiseData,
          summary: [
            { label: 'Total SR Lots', value: srWiseData.length === 0 ? '-' : srWiseData.length },
            {
              label: 'Total Inbound Bags',
              value: (() => {
                const total = srWiseData.reduce((acc, i) => acc + i.totalReceived, 0);
                return total === 0 ? '-' : total.toLocaleString();
              })(),
            },
            {
              label: 'Remaining Bags',
              value: (() => {
                const total = srWiseData.reduce((acc, i) => acc + i.balance, 0);
                return total === 0 ? '-' : total.toLocaleString();
              })(),
            },
          ],
          filename: 'SR_Wise_Report',
        };
      case 'reports-challan':
        return {
          title: 'KBL CHALLAN-WISE RECONCILIATION REPORT',
          subtitle: `Challan vs Storage Cross-Audit`,
          columns: [
            { header: 'KBL Challan', key: 'challanNo' },
            { header: 'Date', key: 'date' },
            { header: 'Cold Storage', key: 'storageName' },
            { header: 'Associated SRs', key: 'srsList' },
            { header: 'Varieties', key: 'varietiesList' },
            { header: 'Total Bags', key: 'totalBags' },
            { header: 'Total MT', key: 'totalMt' },
          ],
          data: challanWiseData.map((c) => ({
            ...c,
            srsList: Array.from(c.srs).join(', '),
            varietiesList: Array.from(c.varieties).join(', '),
            totalMt: Number(c.totalMt.toFixed(2)),
          })),
          summary: [
            { label: 'Total Challans', value: challanWiseData.length === 0 ? '-' : challanWiseData.length },
            {
              label: 'Total Bags',
              value: (() => {
                const total = challanWiseData.reduce((acc, i) => acc + i.totalBags, 0);
                return total === 0 ? '-' : total.toLocaleString();
              })(),
            },
          ],
          filename: 'Challan_Wise_Report',
        };
      case 'reports-dimensions':
        return {
          title: 'VARIETY VS GRADE STOCK MATRIX REPORT',
          subtitle: `Comprehensive Grade-Level Distribution`,
          columns: [
            { header: 'Variety', key: 'varietyName' },
            ...grades.map((g) => ({ header: g.name, key: g.id })),
            { header: 'Total Bags', key: 'rowTotal' },
          ],
          data: matrixData.map((m) => {
            const row: any = { varietyName: m.varietyName, rowTotal: m.rowTotal === 0 ? '-' : m.rowTotal };
            grades.forEach((g) => {
              const val = m.gradeCounts[g.id] || 0;
              row[g.id] = val === 0 ? '-' : val;
            });
            return row;
          }),
          summary: [
            { label: 'Total Varieties', value: matrixData.length === 0 ? '-' : matrixData.length },
            {
              label: 'Total Matrix Bags',
              value: (() => {
                const total = matrixData.reduce((acc, i) => acc + i.rowTotal, 0);
                return total === 0 ? '-' : total.toLocaleString();
              })(),
            },
          ],
          filename: 'Variety_Grade_Matrix_Report',
        };
      default:
        return {
          title: 'POTATO SEED INVENTORY REPORT',
          subtitle: '',
          columns: [],
          data: [],
          summary: [],
          filename: 'Report',
        };
    }
  }, [
    reportType,
    stockReportData,
    deliveryReportData,
    storageWiseData,
    srWiseData,
    challanWiseData,
    matrixData,
    coldStorages,
    varieties,
    seedClasses,
    grades,
  ]);

  const handleExportPdfReport = () => {
    const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

    exportToPdf(
      printConfig.data,
      printConfig.columns,
      printConfig.filename,
      printConfig.title,
      companySettings,
      'l',
      printConfig.subtitle,
      { printedBy: printedByName, includeSummary: true }
    );
  };

  const validateReportConsistency = (): { isConsistent: boolean; reason?: string } => {
    if (!printConfig.data || printConfig.data.length === 0) {
      return { isConsistent: false, reason: 'Report currently contains 0 records to display.' };
    }

    if (reportType === 'reports-stock') {
      if (stockTransactions.length === 0) {
        return { isConsistent: false, reason: 'Database stock transactions store is empty.' };
      }
      if (stockReportData.length > stockTransactions.length) {
        return { isConsistent: false, reason: 'Displayed stock records exceed total transactions in database.' };
      }
    } else if (reportType === 'reports-delivery') {
      if (deliveryReportData.length > deliveryTransactions.length) {
        return { isConsistent: false, reason: 'Displayed delivery records exceed total entries in database.' };
      }
    } else if (reportType === 'reports-storage') {
      for (const st of storageWiseData) {
        if (st.balanceBags < 0) {
          return { isConsistent: false, reason: `Inconsistency: Storage ${st.name} has negative balance (${st.balanceBags} bags).` };
        }
      }
    }

    return { isConsistent: true };
  };

  const handlePrintReport = () => {
    handleOpenPrintModal();
  };

  const handleOpenPrintModal = () => {
    const check = validateReportConsistency();
    if (!check.isConsistent) {
      addToast(check.reason || 'Report data is not yet consistent with database.', 'error');
      return;
    }
    setIsPrintModalOpen(true);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'reports-stock':
        return {
          title: 'Stock Inbound Report',
          subtitle: 'Detailed receipt logs, bags, weights, and lot details',
          icon: BarChart3,
        };
      case 'reports-delivery':
        return {
          title: 'Delivery & Stock Out Report',
          subtitle: 'Comprehensive distribution ledger and dispatch notes',
          icon: TrendingDown,
        };
      case 'reports-storage':
        return {
          title: 'Cold Storage Facility Report',
          subtitle: 'Capacity occupancy, balance bags, and rent financial status',
          icon: Building2,
        };
      case 'reports-sr':
        return {
          title: 'SR-wise Stock Report',
          subtitle: 'Individual Store Receipt (SR) batch analysis',
          icon: FileText,
        };
      case 'reports-challan':
        return {
          title: 'KBL Challan-wise Report',
          subtitle: 'Inbound consignment batch aggregation',
          icon: Files,
        };
      case 'reports-dimensions':
        return {
          title: 'Variety / Grade Matrix Report',
          subtitle: 'Cross-tabulated inventory balance by cultivar and size grade',
          icon: Grid3X3,
        };
    }
  };

  const info = getReportTitle();
  const Icon = info.icon;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Icon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            {info.title}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {info.subtitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs uppercase"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>EXCEL</span>
          </button>

          <button
            onClick={handleExportPdfReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs uppercase"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>PDF</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-xs uppercase"
            title="Validate data consistency and open browser print dialog"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT REPORT</span>
          </button>

          <button
            onClick={handleOpenPrintModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs uppercase"
            title="Preview formatted document before printing"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-500" />
            <span>PREVIEW</span>
          </button>
        </div>
      </div>

      {/* Sub-report selector tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
        {[
          { id: 'reports-stock', label: 'STOCK REPORT', icon: BarChart3 },
          { id: 'reports-delivery', label: 'DELIVERY REPORT', icon: TrendingDown },
          { id: 'reports-storage', label: 'STORAGE-WISE', icon: Building2 },
          { id: 'reports-sr', label: 'SR-WISE', icon: FileText },
          { id: 'reports-challan', label: 'CHALLAN-WISE', icon: Files },
          { id: 'reports-dimensions', label: 'VARIETY/GRADE MATRIX', icon: Grid3X3 },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as NavigationTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      {reportType !== 'reports-dimensions' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs no-print">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={selectedStorage}
            onChange={(e) => setSelectedStorage(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Cold Storages</option>
            {coldStorages.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
          />

          <input
            type="date"
            placeholder="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      )}

      {/* REPORT CONTENT TABLES */}

      {/* 1. STOCK REPORT */}
      {reportType === 'reports-stock' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-3">SL</th>
                  <th className="py-3 px-3">DATE 🔃</th>
                  <th className="py-3 px-3">KBL CHALLAN 🔃</th>
                  <th className="py-3 px-3">SR NO 🔃</th>
                  <th className="py-3 px-3">COLD STORAGE 🔃</th>
                  <th className="py-3 px-3">VARIETY 🔃</th>
                  <th className="py-3 px-3">CLASS 🔃</th>
                  <th className="py-3 px-3">GRADE 🔃</th>
                  <th className="py-3 px-3 text-right">BAGS 🔃</th>
                  <th className="py-3 px-3 text-right">TOTAL KG 🔃</th>
                  <th className="py-3 px-3 text-right">TOTAL MT 🔃</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stockReportData.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">{s.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-sky-600 dark:text-sky-400">
                      {s.kblChallanNo}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{s.srNo}</td>
                    <td className="py-2.5 px-3">
                      {coldStorages.find((c) => c.id === s.coldStorageId)?.code || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      {varieties.find((v) => v.id === s.varietyId)?.name}
                    </td>
                    <td className="py-2.5 px-3">
                      {seedClasses.find((c) => c.id === s.classId)?.name}
                    </td>
                    <td className="py-2.5 px-3">
                      {grades.find((g) => g.id === s.gradeId)?.name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {s.sackQuantity === 0 ? '-' : s.sackQuantity.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {s.totalKg === 0 ? '-' : s.totalKg.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                      {s.totalMt === 0 ? '-' : s.totalMt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DELIVERY REPORT */}
      {reportType === 'reports-delivery' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-3">SL</th>
                  <th className="py-3 px-3">DATE 🔃</th>
                  <th className="py-3 px-3">DELIVERY NO 🔃</th>
                  <th className="py-3 px-3">CUSTOMER / DESTINATION 🔃</th>
                  <th className="py-3 px-3">STORAGE 🔃</th>
                  <th className="py-3 px-3">VARIETY 🔃</th>
                  <th className="py-3 px-3 text-right">BAGS 🔃</th>
                  <th className="py-3 px-3 text-right">TOTAL KG 🔃</th>
                  <th className="py-3 px-3 text-right">TOTAL MT 🔃</th>
                  <th className="py-3 px-3">VEHICLE 🔃</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {deliveryReportData.map((d, idx) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">{d.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-amber-600 dark:text-amber-400">
                      {d.deliveryNo}
                    </td>
                    <td className="py-2.5 px-3 font-medium">{d.customerReceiver}</td>
                    <td className="py-2.5 px-3">
                      {coldStorages.find((c) => c.id === d.coldStorageId)?.code || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      {varieties.find((v) => v.id === d.varietyId)?.name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {d.sackQuantity === 0 ? '-' : d.sackQuantity.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {d.totalKg === 0 ? '-' : d.totalKg.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-600">
                      {d.totalMt === 0 ? '-' : d.totalMt}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{d.vehicleNo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. COLD STORAGE REPORT */}
      {reportType === 'reports-storage' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-3">CODE 🔃</th>
                  <th className="py-3 px-3">FACILITY NAME 🔃</th>
                  <th className="py-3 px-3">LOCATION 🔃</th>
                  <th className="py-3 px-3 text-right">CAPACITY (BAGS) 🔃</th>
                  <th className="py-3 px-3 text-right">RECEIVED 🔃</th>
                  <th className="py-3 px-3 text-right">DELIVERED 🔃</th>
                  <th className="py-3 px-3 text-right">REMAINING STOCK 🔃</th>
                  <th className="py-3 px-3 text-center">OCCUPANCY 🔃</th>
                  <th className="py-3 px-3 text-right">RENT DUE (BDT) 🔃</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {storageWiseData.map((cs) => (
                  <tr key={cs.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-600">
                      {cs.code}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {cs.name}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{cs.location}</td>
                    <td className="py-3 px-3 text-right">
                      {cs.capacity === 0 ? '-' : cs.capacity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-medium">
                      {cs.totalReceivedBags === 0 ? '-' : cs.totalReceivedBags.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-600">
                      {cs.totalDeliveredBags === 0 ? '-' : cs.totalDeliveredBags.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      {cs.remainingBags === 0 ? '-' : cs.remainingBags.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      {cs.occupancyRate === 0 ? '-' : `${cs.occupancyRate.toFixed(1)}%`}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-rose-600">
                      {cs.totalDue === 0 ? '-' : cs.totalDue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SR-WISE REPORT */}
      {reportType === 'reports-sr' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-3">SR NUMBER 🔃</th>
                  <th className="py-3 px-3">KBL CHALLAN 🔃</th>
                  <th className="py-3 px-3">STORAGE FACILITY 🔃</th>
                  <th className="py-3 px-3">VARIETY 🔃</th>
                  <th className="py-3 px-3">CLASS 🔃</th>
                  <th className="py-3 px-3">GRADE 🔃</th>
                  <th className="py-3 px-3">DATE 🔃</th>
                  <th className="py-3 px-3 text-right">QUANTITY (BAGS) 🔃</th>
                  <th className="py-3 px-3 text-right">TOTAL MT 🔃</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {srWiseData.map((item: any, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {item.srNo}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{item.challanNo}</td>
                    <td className="py-2.5 px-3">{item.storageCode}</td>
                    <td className="py-2.5 px-3 font-medium">{item.varietyName}</td>
                    <td className="py-2.5 px-3">{item.className}</td>
                    <td className="py-2.5 px-3">{item.gradeName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{item.date}</td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {item.bagQty === 0 ? '-' : item.bagQty.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                      {item.totalMt === 0 ? '-' : Number(item.totalMt.toFixed(2))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CHALLAN-WISE REPORT */}
      {reportType === 'reports-challan' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-3">KBL CHALLAN NO 🔃</th>
                  <th className="py-3 px-3">DATE 🔃</th>
                  <th className="py-3 px-3">COLD STORAGE 🔃</th>
                  <th className="py-3 px-3">SR LOTS INCLUDED 🔃</th>
                  <th className="py-3 px-3">VARIETIES INCLUDED 🔃</th>
                  <th className="py-3 px-3 text-right">TOTAL BAGS 🔃</th>
                  <th className="py-3 px-3 text-right">TOTAL MT 🔃</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {challanWiseData.map((item: any, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {item.challanNo}
                    </td>
                    <td className="py-3 px-3">{item.date}</td>
                    <td className="py-3 px-3 font-medium">{item.storageName}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {Array.from(item.srs).map((s: any) => (
                          <span
                            key={s}
                            className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {Array.from(item.varieties).join(', ')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {item.totalBags === 0 ? '-' : item.totalBags.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      {item.totalMt === 0 ? '-' : `${Number(item.totalMt.toFixed(2))} MT`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. VARIETY / GRADE CROSS-TABULATION MATRIX */}
      {reportType === 'reports-dimensions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
              CULTIVAR VS SIZE GRADE AVAILABILITY MATRIX (REMAINING IN STORAGE BAGS)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4">VARIETY CULTIVAR 🔃</th>
                  <th className="py-3 px-3">CODE 🔃</th>
                  {grades.map((g) => (
                    <th key={g.id} className="py-3 px-3 text-right">
                      {g.name} 🔃
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right font-bold bg-slate-100 dark:bg-slate-800/80">
                    TOTAL CULTIVAR STOCK 🔃
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {matrixData.map((m) => (
                  <tr key={m.varietyId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {m.varietyName}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{m.varietyCode}</td>
                    {grades.map((g) => {
                      const count = m.gradeCounts[g.id] || 0;
                      return (
                        <td
                          key={g.id}
                          className={`py-3 px-3 text-right font-medium ${
                            count > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          {count > 0 ? count.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-right font-bold text-sky-600 dark:text-sky-400 bg-slate-50/50 dark:bg-slate-800/40">
                      {m.rowTotal === 0 ? '-' : `${m.rowTotal.toLocaleString()} Bags`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentTitle={printConfig.title}
        subtitle={printConfig.subtitle}
        columns={printConfig.columns}
        data={printConfig.data}
        summaryItems={printConfig.summary}
        filename={printConfig.filename}
        orientation="l"
      />
    </div>
  );
};
