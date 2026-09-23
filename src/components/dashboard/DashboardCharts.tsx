import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getStockSummaryByDimension,
  calculateRentSummary,
} from '../../utils/stockEngine';

export const DashboardCharts: React.FC = () => {
  const {
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    potatoTypes,
    rentPayments,
    filters,
    setFilters,
  } = useApp();

  const { isDark } = useTheme();

  const textColor = isDark ? '#cbd5e1' : '#475569';
  const gridLineColor = isDark ? '#334155' : '#e2e8f0';

  // 1. Stock by Cold Storage
  const storageData = getStockSummaryByDimension(
    'coldStorage',
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    filters
  );

  const storageChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: textColor }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: storageData.map((d) => d.code || d.label),
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: gridLineColor } },
    },
    yAxis: {
      type: 'value',
      name: 'Bags',
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: gridLineColor, type: 'dashed' } },
    },
    series: [
      {
        name: 'Received Bags',
        type: 'bar',
        data: storageData.map((d) => d.totalReceivedBags),
        itemStyle: { color: '#0284c7', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Delivered Bags',
        type: 'bar',
        data: storageData.map((d) => d.totalDeliveredBags),
        itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Remaining Bags',
        type: 'bar',
        data: storageData.map((d) => d.remainingBags),
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  // 2. Stock by Variety
  const varietyData = getStockSummaryByDimension(
    'variety',
    stockTransactions,
    deliveryTransactions,
    varieties,
    filters
  );

  const varietyChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: textColor }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      name: 'Bags',
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: gridLineColor, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: varietyData.map((v) => v.label),
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: gridLineColor } },
    },
    series: [
      {
        name: 'In Stock Bags',
        type: 'bar',
        data: varietyData.map((v) => v.remainingBags),
        itemStyle: { color: '#38bdf8', borderRadius: [0, 4, 4, 0] },
      },
      {
        name: 'Delivered Bags',
        type: 'bar',
        data: varietyData.map((v) => v.totalDeliveredBags),
        itemStyle: { color: '#fb923c', borderRadius: [0, 4, 4, 0] },
      },
    ],
  };

  // 3. Stock by Grade (Donut)
  const gradeData = getStockSummaryByDimension(
    'grade',
    stockTransactions,
    deliveryTransactions,
    grades,
    filters
  );

  const gradeChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} Bags ({d}%)' },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: textColor, fontSize: 11 },
    },
    series: [
      {
        name: 'Stock by Grade',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold', color: textColor },
        },
        data: gradeData.map((g) => ({
          value: g.remainingBags,
          name: g.label,
        })),
      },
    ],
    color: ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
  };

  // 4. Rent Paid vs Due
  const rentLedger = calculateRentSummary(
    coldStorages,
    stockTransactions,
    deliveryTransactions,
    rentPayments
  );

  const rentChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} BDT ({d}%)' },
    legend: { bottom: 0, textStyle: { color: textColor } },
    series: [
      {
        name: 'Rent Financials',
        type: 'pie',
        radius: '65%',
        center: ['50%', '45%'],
        data: [
          { value: rentLedger.totalPaidAmount, name: 'Rent Paid' },
          { value: rentLedger.totalDueAmount, name: 'Rent Due' },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
    color: ['#10b981', '#f43f5e'],
  };

  // 5. Stock by Seed Class (Stacked Bar)
  const classData = getStockSummaryByDimension(
    'class',
    stockTransactions,
    deliveryTransactions,
    seedClasses,
    filters
  );

  const classChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: textColor }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: classData.map((c) => c.label),
      axisLabel: { color: textColor, interval: 0 },
      axisLine: { lineStyle: { color: gridLineColor } },
    },
    yAxis: {
      type: 'value',
      name: 'Bags',
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: gridLineColor, type: 'dashed' } },
    },
    series: [
      {
        name: 'Remaining',
        type: 'bar',
        stack: 'total',
        data: classData.map((c) => c.remainingBags),
        itemStyle: { color: '#0d9488' },
      },
      {
        name: 'Delivered',
        type: 'bar',
        stack: 'total',
        data: classData.map((c) => c.totalDeliveredBags),
        itemStyle: { color: '#f97316' },
      },
    ],
  };

  // 6. Potato Type Distribution (Donut)
  const typeData = getStockSummaryByDimension(
    'potatoType',
    stockTransactions,
    deliveryTransactions,
    potatoTypes,
    filters
  );

  const typeChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} Bags ({d}%)' },
    legend: { bottom: 0, textStyle: { color: textColor } },
    series: [
      {
        name: 'Potato Type',
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '42%'],
        data: typeData.map((t) => ({
          value: t.totalReceivedBags,
          name: t.label,
        })),
      },
    ],
    color: ['#6366f1', '#06b6d4', '#eab308'],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
      {/* Chart 1: Cold Storage Distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Stock by Cold Storage Facility
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Received vs Delivered vs Remaining Bags
            </p>
          </div>
        </div>
        <ReactECharts
          option={storageChartOption}
          style={{ height: '300px', width: '100%' }}
        />
      </div>

      {/* Chart 2: Stock by Variety */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Stock Balance by Variety
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Remaining vs Dispatched seed stock
            </p>
          </div>
        </div>
        <ReactECharts
          option={varietyChartOption}
          style={{ height: '300px', width: '100%' }}
        />
      </div>

      {/* Chart 3: Stock by Grade */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Remaining Stock by Grade
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A (28-35mm), B (35-45mm), Under Size, Over Size, Table
            </p>
          </div>
        </div>
        <ReactECharts
          option={gradeChartOption}
          style={{ height: '280px', width: '100%' }}
        />
      </div>

      {/* Chart 4: Seed Class Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Stock by Seed Generation / Class
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stacked distribution: Pre-Foundation, Foundation, Certified
            </p>
          </div>
        </div>
        <ReactECharts
          option={classChartOption}
          style={{ height: '280px', width: '100%' }}
        />
      </div>

      {/* Chart 5: Cold Storage Rent Financials */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cold Storage Rent Status (Financials)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total Rent Paid vs Outstanding Rent Due
            </p>
          </div>
        </div>
        <ReactECharts
          option={rentChartOption}
          style={{ height: '280px', width: '100%' }}
        />
      </div>

      {/* Chart 6: Potato Type Distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Stock Share by Potato Type
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seed Potato vs Table Potato vs Processing Potato
            </p>
          </div>
        </div>
        <ReactECharts
          option={typeChartOption}
          style={{ height: '280px', width: '100%' }}
        />
      </div>
    </div>
  );
};
