import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  PieChart,
  FileSpreadsheet,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { FullHouseholdDatabase } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ReportsViewProps {
  database: FullHouseholdDatabase;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ database }) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const easy = database.settings.easyWording;

  const [timeframe, setTimeframe] = useState<'this_month' | 'last_month' | 'year' | 'all'>('this_month');
  const [reportType, setReportType] = useState<'financial' | 'category' | 'bills' | 'shopping'>('financial');

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const thisYearStr = `${now.getFullYear()}`;

  // Filter records based on timeframe
  const filterByTime = (dateStr: string) => {
    if (timeframe === 'this_month') return dateStr.startsWith(currentMonthStr);
    if (timeframe === 'last_month') return dateStr.startsWith(lastMonthStr);
    if (timeframe === 'year') return dateStr.startsWith(thisYearStr);
    return true; // all
  };

  const periodIncomes = database.incomes.filter((i) => filterByTime(i.date));
  const periodExpenses = database.expenses.filter((e) => filterByTime(e.date));
  const periodShopping = database.shoppingTransactions.filter((s) => filterByTime(s.date));
  const periodBills = database.monthlyBills.filter((b) =>
    timeframe === 'this_month'
      ? b.billingMonth === currentMonthStr
      : timeframe === 'last_month'
      ? b.billingMonth === lastMonthStr
      : true
  );

  const totalPeriodIncome = periodIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPeriodExpense = periodExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPeriodSavings = totalPeriodIncome - totalPeriodExpense;
  const totalPeriodShopping = periodShopping.reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Category breakdown
  const categoryMap = new Map<string, number>();
  periodExpenses.forEach((exp) => {
    const cur = categoryMap.get(exp.category) || 0;
    categoryMap.set(exp.category, cur + exp.amount);
  });

  const sortedCategories = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);

  // Income source breakdown
  const sourceMap = new Map<string, number>();
  periodIncomes.forEach((inc) => {
    const cur = sourceMap.get(inc.source) || 0;
    sourceMap.set(inc.source, cur + inc.amount);
  });

  const sortedSources = Array.from(sourceMap.entries()).sort((a, b) => b[1] - a[1]);

  // Export Full Report CSV
  const handleExportCSV = () => {
    const headers = ['Type', 'Date', 'Category/Source', 'Description', 'Amount', 'Payment Method'];
    const incomeRows = periodIncomes.map((i) => [
      'INCOME',
      i.date,
      `"${i.source}"`,
      `"${i.description.replace(/"/g, '""')}"`,
      i.amount,
      `"${i.paymentMethod}"`,
    ]);
    const expenseRows = periodExpenses.map((e) => [
      'EXPENSE',
      e.date,
      `"${e.category}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      -e.amount,
      `"${e.paymentMethod}"`,
    ]);

    const allRows = [...incomeRows, ...expenseRows].sort((a, b) =>
      String(b[1]).localeCompare(String(a[1]))
    );

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...allRows.map((r) => r.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `HOME_CARE_PRO_Report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            {easy ? 'Maliyati Reports & Analytics' : 'Financial Reports & Analytics'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'Mahana aur Salana hisaab kitab, CSV download aur printable balance sheet'
              : 'Audit trails, income vs expenditure ratios, category spreads, and exportable statements'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="this_month">This Month ({currentMonthStr})</option>
            <option value="last_month">Last Month ({lastMonthStr})</option>
            <option value="year">Full Year {thisYearStr}</option>
            <option value="all">All-Time History</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Period Income</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {formatCurrency(totalPeriodIncome, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {periodIncomes.length} credit entries
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Period Expenses</span>
          <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            {formatCurrency(totalPeriodExpense, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {periodExpenses.length} debit transactions
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Net Period Savings</span>
          <p
            className={`text-2xl font-bold font-mono mt-1 tabular-nums ${
              totalPeriodSavings >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600'
            }`}
          >
            {formatCurrency(totalPeriodSavings, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Savings rate:{' '}
            {totalPeriodIncome > 0
              ? `${Math.round((totalPeriodSavings / totalPeriodIncome) * 100)}%`
              : '0%'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Period Shopping Spend</span>
          <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
            {formatCurrency(totalPeriodShopping, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {periodShopping.length} shopping bills
          </span>
        </div>
      </div>

      {/* Visual Comparison: Income vs Expenses Balance Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Cash Flow Comparison (Aamdani ba-muqabla Kharchay)
        </h3>

        <div className="space-y-3">
          {/* Income Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Total Income Credited</span>
              </span>
              <span className="font-mono font-bold text-emerald-600">
                {formatCurrency(totalPeriodIncome, currency, symbol)}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${
                    totalPeriodIncome + totalPeriodExpense > 0
                      ? (totalPeriodIncome / (totalPeriodIncome + totalPeriodExpense)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Expense Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-rose-600 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Total Expenses Debited</span>
              </span>
              <span className="font-mono font-bold text-rose-600">
                {formatCurrency(totalPeriodExpense, currency, symbol)}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{
                  width: `${
                    totalPeriodIncome + totalPeriodExpense > 0
                      ? (totalPeriodExpense / (totalPeriodIncome + totalPeriodExpense)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Source Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-teal-600" />
            <span>Expenses by Category Distribution</span>
          </h3>

          {sortedCategories.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No expenses in this timeframe.</p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([cat, amt], idx) => {
                const percent =
                  totalPeriodExpense > 0 ? Math.round((amt / totalPeriodExpense) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[11px]">{percent}%</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(amt, currency, symbol)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Income Sources */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Income Sources Distribution</span>
          </h3>

          {sortedSources.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No income in this timeframe.</p>
          ) : (
            <div className="space-y-3">
              {sortedSources.map(([source, amt], idx) => {
                const percent =
                  totalPeriodIncome > 0 ? Math.round((amt / totalPeriodIncome) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{source}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[11px]">{percent}%</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(amt, currency, symbol)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Formal Printable Household Statement */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-600">
              OFFICIAL HOUSEHOLD STATEMENT
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              HOME CARE PRO · Statement of Household Accounts
            </h4>
            <p className="text-xs text-slate-500">
              Generated for period: {timeframe} · Currency: {currency} ({symbol})
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Category / Source</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {periodExpenses.slice(0, 8).map((exp) => (
                <tr key={exp.id}>
                  <td className="py-2 px-3 font-mono text-slate-500">{formatDate(exp.date)}</td>
                  <td className="py-2 px-3 text-rose-600 font-semibold">EXPENSE</td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{exp.category}</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{exp.description}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                    -{formatCurrency(exp.amount, currency, symbol)}
                  </td>
                </tr>
              ))}
              {periodIncomes.slice(0, 4).map((inc) => (
                <tr key={inc.id}>
                  <td className="py-2 px-3 font-mono text-slate-500">{formatDate(inc.date)}</td>
                  <td className="py-2 px-3 text-emerald-600 font-semibold">INCOME</td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{inc.source}</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{inc.description}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                    +{formatCurrency(inc.amount, currency, symbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
