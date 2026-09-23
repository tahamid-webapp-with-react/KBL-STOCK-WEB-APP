import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings } from '../types';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  numFmt?: string;
  isNumeric?: boolean;
}

export interface ExcelExportOptions {
  orientation?: 'landscape' | 'portrait';
  sheetName?: string;
  includeSummary?: boolean;
  summaryColumns?: string[];
  accentColor?: string; // ARGB hex string, e.g. 'FF0284C7'
  printedBy?: string;
}

export interface PdfExportOptions {
  printedBy?: string;
  includeSummary?: boolean;
  summaryColumns?: string[];
}

export async function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string,
  title: string,
  company: CompanySettings,
  filterDescription?: string,
  options?: ExcelExportOptions
): Promise<void> {
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  const printedBy = options?.printedBy || 'Authorized User';

  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = `${company.companyName || 'ColdStorage Pro'} (${printedBy})`;
    wb.created = new Date();

    const sheetName = (options?.sheetName || 'Register').substring(0, 31);
    const ws = wb.addWorksheet(sheetName, {
      pageSetup: {
        paperSize: 9, // A4
        orientation: options?.orientation || 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        showGridLines: true,
        horizontalCentered: true,
        margins: {
          left: 0.4,
          right: 0.4,
          top: 0.6,
          bottom: 0.6,
          header: 0.3,
          footer: 0.3,
        },
        printTitlesRow: '6:6',
      },
    });

    ws.headerFooter = {
      oddHeader: `&L&B${company.companyName}&R${title}`,
      oddFooter: `&LPrinted By: ${printedBy} | Date: &D &T | Currency: ${company.currency || 'BDT'}&RPage &P of &N`,
    };

    // Freeze panes: Row 6 is table header, so freeze below row 6
    ws.views = [{ state: 'frozen', ySplit: 6, showGridLines: true }];

    const colCount = Math.max(columns.length, 6);

    // Row 1: Company Title
    const r1 = ws.addRow([company.companyName.toUpperCase()]);
    r1.height = 24;
    r1.getCell(1).font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FF0F172A' } };
    r1.getCell(1).alignment = { vertical: 'middle' };

    // Row 2: Tagline / Address & Contact
    const r2Text = [
      company.tagline || company.companyTagline || 'High-Yield Potato Seed Cold Chain & Logistics',
      company.address ? `• ${company.address}` : '',
      company.phone ? `• Tel: ${company.phone}` : '',
    ]
      .filter(Boolean)
      .join(' ');
    const r2 = ws.addRow([r2Text]);
    r2.height = 18;
    r2.getCell(1).font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF64748B' } };
    r2.getCell(1).alignment = { vertical: 'middle' };

    // Row 3: Report Title Banner (Merged across all columns with stylish accent)
    const accentArgb = options?.accentColor || 'FF0284C7'; // Sky-600 default
    const r3 = ws.addRow([`DOCUMENT: ${title.toUpperCase()}`]);
    r3.height = 26;
    ws.mergeCells(3, 1, 3, colCount);
    const r3Cell = ws.getCell('A3');
    r3Cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: accentArgb },
    };
    r3Cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    r3Cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    // Row 4: Meta info line (Document name, Print time & date, Print by, Fiscal Year, Currency)
    const metaParts = [
      `Document: ${title}`,
      `Print Date & Time: ${new Date().toLocaleString()}`,
      `Printed By: ${printedBy}`,
      `Fiscal Year: ${company.fiscalYear || '2024-2025'}`,
      `Currency: ${company.currency || 'BDT'}`,
      `Total Records: ${data.length}`,
    ];
    if (filterDescription) {
      metaParts.push(`Filters: ${filterDescription}`);
    }
    const r4 = ws.addRow([metaParts.join('   |   ')]);
    r4.height = 19;
    r4.getCell(1).font = { name: 'Segoe UI', size: 9, color: { argb: 'FF475569' } };
    r4.getCell(1).alignment = { vertical: 'middle' };

    // Row 5: Empty spacing row
    const r5 = ws.addRow([]);
    r5.height = 8;

    // Row 6: Table Header Row
    const headerRow = ws.addRow(columns.map((c) => c.header));
    headerRow.height = 28;
    headerRow.eachCell((cell, colIndex) => {
      const colDef = columns[colIndex - 1];
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Slate-800
      };
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colDef?.align || (colDef?.isNumeric ? 'right' : 'left'),
        wrapText: false,
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0F172A' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });

    // Data Rows with Zebra Striping (Row 7 onwards)
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };

    data.forEach((item, dataIdx) => {
      const rowValues = columns.map((col) => {
        const val = item[col.key];
        if (val === undefined || val === null || val === '' || val === 0 || val === '0') return '-';
        if (typeof val === 'number') return val;
        return String(val);
      });

      const row = ws.addRow(rowValues);
      row.height = 21;
      const isZebraOdd = dataIdx % 2 === 1;
      const rowBgColor = isZebraOdd ? 'FFF8FAFC' : 'FFFFFFFF'; // slate-50 zebra stripe

      row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
        const colDef = columns[colIndex - 1];
        cell.font = {
          name: 'Segoe UI',
          size: 9.5,
          color: { argb: 'FF1E293B' },
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowBgColor },
        };
        cell.border = thinBorder;

        // Alignment & number format
        const isNum = typeof cell.value === 'number';
        const align = colDef?.align || (colDef?.isNumeric || isNum ? 'right' : 'left');
        cell.alignment = {
          vertical: 'middle',
          horizontal: align,
        };

        if (colDef?.numFmt) {
          cell.numFmt = colDef.numFmt;
        } else if (isNum) {
          // Default number format if none specified, formatting 0 as '-'
          if (Number.isInteger(cell.value)) {
            cell.numFmt = '#,##0;-#,##0;"-"';
          } else {
            cell.numFmt = '#,##0.00;-#,##0.00;"-"';
          }
        }
      });
    });

    // Summary / Totals Row if requested or detected
    const lastDataRowIndex = 6 + data.length;
    const hasSummary = options?.includeSummary !== false;
    const summaryCols = options?.summaryColumns || [
      'bags',
      'bagQuantity',
      'sackQuantity',
      'totalKg',
      'totalMt',
      'amount',
      'rentAmount',
      'received',
      'delivered',
      'balance',
      'balanceBags',
      'totalBags',
    ];

    if (hasSummary && data.length > 0) {
      const summaryValues: (string | number)[] = columns.map((col, idx) => {
        if (idx === 0) return `TOTAL (${data.length} records)`;
        const isSumTarget = summaryCols.includes(col.key) || col.isNumeric;
        if (isSumTarget) {
          let sum = 0;
          let hasNumericVal = false;
          for (const item of data) {
            const raw = item[col.key];
            const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, ''));
            if (!isNaN(num)) {
              sum += num;
              hasNumericVal = true;
            }
          }
          if (hasNumericVal) {
            if (sum === 0) return '-';
            return Math.round(sum * 1000) / 1000;
          }
        }
        return '';
      });

      const summaryRow = ws.addRow(summaryValues);
      summaryRow.height = 24;
      summaryRow.eachCell({ includeEmpty: true }, (cell, colIndex) => {
        const colDef = columns[colIndex - 1];
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: 'FF0F172A' },
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0F2FE' }, // Soft Sky-100 highlight
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF0284C7' } },
          bottom: { style: 'double', color: { argb: 'FF0F172A' } }, // Classic double accounting underline
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        const isNum = typeof cell.value === 'number';
        cell.alignment = {
          vertical: 'middle',
          horizontal: colDef?.align || (colDef?.isNumeric || isNum ? 'right' : 'left'),
        };

        if (colDef?.numFmt) {
          cell.numFmt = colDef.numFmt;
        } else if (isNum) {
          cell.numFmt = Number.isInteger(cell.value) ? '#,##0;-#,##0;"-"' : '#,##0.00;-#,##0.00;"-"';
        }
      });
    }

    // Auto-fit Column Widths with padding
    columns.forEach((col, idx) => {
      const colNumber = idx + 1;
      let maxContentLen = col.header.length;

      // Sample first 50 rows for performance
      const sampleRows = data.slice(0, 50);
      for (const item of sampleRows) {
        const val = item[col.key];
        if (val !== undefined && val !== null) {
          const str = String(val);
          if (str.length > maxContentLen) {
            maxContentLen = Math.min(str.length, 45);
          }
        }
      }

      const calculatedWidth = col.width || Math.max(maxContentLen + 3, 11);
      ws.getColumn(colNumber).width = calculatedWidth;
    });

    // Enable AutoFilter across all data columns
    ws.autoFilter = {
      from: { row: 6, column: 1 },
      to: { row: lastDataRowIndex, column: columns.length },
    };

    // Generate Excel Buffer and trigger browser download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  } catch (err) {
    console.warn('ExcelJS export failed, using XLSX fallback:', err);
    // Fallback using standard SheetJS
    const wsData: any[][] = [];
    wsData.push([company.companyName.toUpperCase()]);
    wsData.push([company.tagline || '']);
    wsData.push([`REPORT: ${title.toUpperCase()}`]);
    wsData.push([`Generated: ${new Date().toLocaleString()} | Currency: ${company.currency}`]);
    if (filterDescription) {
      wsData.push([`Applied Filters: ${filterDescription}`]);
    }
    wsData.push([]);
    wsData.push(columns.map((c) => c.header));
    data.forEach((item) => {
      wsData.push(
        columns.map((c) => {
          const val = item[c.key];
          return val === undefined || val === null ? '' : val;
        })
      );
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, cleanFilename);
  }
}

export function exportToPdf<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string,
  title: string,
  company: CompanySettings,
  orientation: 'p' | 'l' = 'l',
  filterDescription?: string,
  options?: PdfExportOptions
) {
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const printedBy = options?.printedBy || 'Authorized User';

  // Company Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(company.companyName.toUpperCase(), 14, 15);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  const subText = [
    company.tagline || company.companyTagline || 'Potato Seed Cold Storage & Stock Management',
    company.address ? `• ${company.address}` : '',
    company.phone ? `• Tel: ${company.phone}` : '',
  ].filter(Boolean).join(' ');
  doc.text(subText, 14, 20);

  // Divider line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 23, pageWidth - 14, 23);

  // Report Title and Subtitle Banner
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`DOCUMENT: ${title.toUpperCase()}`, 14, 29);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600
  const metaText = `Print Date & Time: ${new Date().toLocaleString()}   |   Printed By: ${printedBy}   |   Fiscal Year: ${company.fiscalYear || '2024-2025'}   |   Currency: ${company.currency || 'BDT'}`;
  doc.text(metaText, 14, 34);

  if (filterDescription) {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Filters Applied: ${filterDescription}`, 14, 38.5);
  }

  const startY = filterDescription ? 42 : 37;

  // Prepare table headers and body
  const tableHeaders = [columns.map((c) => c.header)];
  const tableBody = data.map((item) =>
    columns.map((col) => {
      const val = item[col.key];
      if (val === undefined || val === null || val === '' || val === 0 || val === '0') return '-';
      if (typeof val === 'number') {
        return Number.isInteger(val) ? val.toLocaleString() : (Math.round(val * 100) / 100).toLocaleString();
      }
      return String(val);
    })
  );

  // Prepare Total / Summary Row if applicable
  const summaryCols = options?.summaryColumns || [
    'bags',
    'bagQuantity',
    'sackQuantity',
    'totalKg',
    'totalMt',
    'amount',
    'rentAmount',
    'received',
    'delivered',
    'balance',
    'balanceBags',
    'totalBags',
    'asterix',
    'diamant',
    'granola',
    'sunshine',
    'total',
  ];

  let footRows: string[][] | undefined = undefined;
  if (options?.includeSummary !== false && data.length > 0) {
    let hasAnySum = false;
    const summaryValues: string[] = columns.map((col, idx) => {
      if (idx === 0) return `TOTAL (${data.length})`;
      const isSumTarget = summaryCols.includes(col.key.toLowerCase()) || col.isNumeric;
      if (isSumTarget) {
        let sum = 0;
        let hasNumericVal = false;
        for (const item of data) {
          const raw = item[col.key];
          const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, ''));
          if (!isNaN(num)) {
            sum += num;
            hasNumericVal = true;
          }
        }
        if (hasNumericVal) {
          hasAnySum = true;
          if (sum === 0) return '-';
          return Number.isInteger(sum) ? sum.toLocaleString() : (Math.round(sum * 100) / 100).toLocaleString();
        }
      }
      return '';
    });
    if (hasAnySum) {
      footRows = [summaryValues];
    }
  }

  // Calculate column alignments
  const columnStyles: Record<number, any> = {};
  columns.forEach((col, idx) => {
    columnStyles[idx] = {
      halign: col.align || (col.isNumeric ? 'right' : 'left'),
    };
  });

  autoTable(doc, {
    head: tableHeaders,
    body: tableBody,
    foot: footRows,
    startY: startY,
    theme: 'grid',
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
    },
    columnStyles: columnStyles,
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50 (Zebra style)
    },
    footStyles: {
      fillColor: [224, 242, 254], // Sky-100 highlight for distinct Total row
      textColor: [15, 23, 42], // Slate-900
      fontSize: 8,
      fontStyle: 'bold',
      lineWidth: 0.3,
      lineColor: [2, 132, 199], // Sky-600
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (dataInfo) => {
      // Footer page numbering and metadata
      const totalPages = (doc as any).internal.getNumberOfPages();
      const str = `Page ${dataInfo.pageNumber} of ${totalPages}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        str,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
      doc.text(
        `Confidential • ${company.companyName} Potato Seed Logistics • Printed by: ${printedBy}`,
        14,
        doc.internal.pageSize.getHeight() - 8
      );
    },
  });

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(cleanFilename);
}

export interface PrintValidationConfig<T = any> {
  data: T[];
  reportTitle?: string;
  expectedMinRecords?: number;
  databaseCheck?: () => { isConsistent: boolean; reason?: string };
  onValidating?: () => void;
  onSuccess?: () => void;
  onError?: (errorMsg: string) => void;
}

/**
 * Validates that report data is fully loaded and consistent with the database before triggering browser print
 */
export function validateAndTriggerPrint<T = any>(config: PrintValidationConfig<T>): boolean {
  const {
    data,
    reportTitle,
    expectedMinRecords = 1,
    databaseCheck,
    onValidating,
    onSuccess,
    onError,
  } = config;

  onValidating?.();

  // 1. Data existence and type check
  if (!data || !Array.isArray(data)) {
    const err = `Cannot print ${reportTitle || 'report'}: Data source is missing or invalid.`;
    onError?.(err);
    return false;
  }

  // 2. Minimum record check
  if (data.length < expectedMinRecords) {
    const err = `Cannot print ${reportTitle || 'report'}: No data rows are currently loaded to print.`;
    onError?.(err);
    return false;
  }

  // 3. Completeness check: Ensure data rows do not contain NaN, corrupt values, or undefined IDs
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || typeof row !== 'object') {
      const err = `Cannot print ${reportTitle || 'report'}: Record at row #${i + 1} is corrupted.`;
      onError?.(err);
      return false;
    }

    // Inspect numeric values for NaN or infinite
    for (const [key, val] of Object.entries(row)) {
      if (typeof val === 'number' && (isNaN(val) || !isFinite(val))) {
        const err = `Cannot print ${reportTitle || 'report'}: Detected invalid numeric calculation (${key}) at row #${i + 1}.`;
        onError?.(err);
        return false;
      }
    }
  }

  // 4. Database reconciliation check if provided
  if (databaseCheck) {
    const checkResult = databaseCheck();
    if (!checkResult.isConsistent) {
      const err = `Cannot print ${reportTitle || 'report'}: ${checkResult.reason || 'Data inconsistency detected with database records.'}`;
      onError?.(err);
      return false;
    }
  }

  // 5. Validation passed!
  onSuccess?.();

  // Safely trigger browser print after ensuring current execution turn and layout calculations have settled
  window.requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn('Browser print execution failed or restricted:', err);
      }
    }, 150);
  });

  return true;
}

export function triggerPrint() {
  window.requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn('Browser print execution failed or restricted:', err);
      }
    }, 100);
  });
}
