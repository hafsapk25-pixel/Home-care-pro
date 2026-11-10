import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  ShoppingBag,
  ShoppingCart,
  FileText,
  Clock,
  Boxes,
  Wrench,
  Target,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Plus,
  Receipt,
  Store,
  CheckCircle2,
} from 'lucide-react';
import { FullHouseholdDatabase } from '../types';
import { formatCurrency, formatDate, getDaysRemaining } from '../utils/formatters';

interface DashboardViewProps {
  database: FullHouseholdDatabase;
  onNavigateTab: (tabId: string) => void;
  onQuickAction: (actionType: 'income' | 'expense' | 'shopping' | 'grocery' | 'bill') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  database,
  onNavigateTab,
  onQuickAction,
}) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const easy = database.settings.easyWording;

  // Current month prefix e.g. "2026-11"
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Total Monthly Income (from incomes in this month)
  const currentMonthIncomes = database.incomes.filter((i) =>
    i.date.startsWith(currentMonthStr)
  );
  const totalMonthlyIncome = currentMonthIncomes.reduce((acc, curr) => acc + curr.amount, 0);

  // 2. Total Monthly Expenses
  const currentMonthExpenses = database.expenses.filter((e) =>
    e.date.startsWith(currentMonthStr)
  );
  const totalMonthlyExpenses = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // 3. Total Monthly Savings = Income - Expenses
  const totalMonthlySavings = Math.max(0, totalMonthlyIncome - totalMonthlyExpenses);

  // 4. Available Balance (All-time income - all-time expenses)
  const allTimeIncome = database.incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const allTimeExpense = database.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const availableBalance = allTimeIncome - allTimeExpense;

  // 5. Total Shopping Expenses this month
  const totalShoppingExpenses = database.expenses
    .filter((e) => e.date.startsWith(currentMonthStr) && e.category.toLowerCase().includes('shopping'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 6. Total Grocery Expenses this month
  const totalGroceryExpenses = database.expenses
    .filter((e) => e.date.startsWith(currentMonthStr) && (e.category.toLowerCase().includes('grocery') || e.category.toLowerCase().includes('rashan')))
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 7. Total Monthly Bills for this month
  const currentMonthBills = database.monthlyBills.filter((b) => b.billingMonth === currentMonthStr);
  const totalMonthlyBills = currentMonthBills.reduce((acc, curr) => acc + curr.totalAmount, 0);

  // 8. Pending Payments (Bills that are unpaid or partial)
  const pendingBillsList = database.monthlyBills.filter((b) => b.status === 'unpaid' || b.status === 'overdue' || b.status === 'partial');
  const pendingPaymentsAmount = pendingBillsList.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  // 9. Total Household Assets Valuation
  const totalHouseholdAssets = database.inventoryItems.reduce(
    (acc, curr) => acc + (curr.estimatedCurrentValue || curr.purchasePrice),
    0
  );

  // 10. Maintenance Expenses this month
  const maintenanceExpenses = database.expenses
    .filter((e) => e.date.startsWith(currentMonthStr) && e.category.toLowerCase().includes('maintenance'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 11. Monthly Budget
  const monthlyBudget = database.settings.totalMonthlyBudget;

  // 12. Budget Remaining
  const budgetRemaining = monthlyBudget - totalMonthlyExpenses;
  const budgetUsedPercent = monthlyBudget > 0 ? Math.min(100, Math.round((totalMonthlyExpenses / monthlyBudget) * 100)) : 0;

  // Alerts
  const upcomingBills = pendingBillsList.filter((b) => {
    const rem = getDaysRemaining(b.dueDate);
    return rem.days <= 7 || rem.isOverdue;
  });

  const lowStockGroceries = database.groceryItems.filter(
    (g) => g.remainingStock <= g.minStockAlert
  );

  // Category breakdown for current month
  const categoryMap = new Map<string, number>();
  currentMonthExpenses.forEach((exp) => {
    const current = categoryMap.get(exp.category) || 0;
    categoryMap.set(exp.category, current + exp.amount);
  });

  const sortedCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const kpiCards = [
    {
      title: easy ? 'Kul Mahana Aamdani' : 'Monthly Income',
      subtitle: easy ? 'Is maah ki tankhwah aur kamai' : 'Total credited this month',
      amount: totalMonthlyIncome,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200/80 dark:border-emerald-900/40',
      tab: 'income',
    },
    {
      title: easy ? 'Kul Mahana Kharchay' : 'Monthly Expenses',
      subtitle: easy ? 'Bil, rashan aur deegar kharcha' : 'Total spent this month',
      amount: totalMonthlyExpenses,
      icon: TrendingDown,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      border: 'border-rose-200/80 dark:border-rose-900/40',
      tab: 'expenses',
    },
    {
      title: easy ? 'Kul Mahana Bachat' : 'Monthly Savings',
      subtitle: easy ? 'Aamdani manfi Kharchay' : 'Income - Expenses net balance',
      amount: totalMonthlySavings,
      icon: PiggyBank,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/20',
      border: 'border-teal-200/80 dark:border-teal-900/40',
      tab: 'savings',
    },
    {
      title: easy ? 'Mojooda Raqam (Balance)' : 'Available Balance',
      subtitle: easy ? 'Kul aamad ba-muqabla kharch' : 'Net household cash in hand & bank',
      amount: availableBalance,
      icon: Wallet,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/20',
      border: 'border-sky-200/80 dark:border-sky-900/40',
      tab: 'savings',
    },
    {
      title: easy ? 'Shopping Ka Kharcha' : 'Shopping Expenses',
      subtitle: easy ? 'Kapray, jootay aur kharidari' : 'Clothes, appliances & mall items',
      amount: totalShoppingExpenses,
      icon: ShoppingBag,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/20',
      border: 'border-indigo-200/80 dark:border-indigo-900/40',
      tab: 'shopping',
    },
    {
      title: easy ? 'Rashan & Kitchen Kharcha' : 'Grocery Expenses',
      subtitle: easy ? 'Aata, daal, doodh, tel aur rasoi' : 'Pantry & kitchen supermarket spend',
      amount: totalGroceryExpenses,
      icon: ShoppingCart,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200/80 dark:border-amber-900/40',
      tab: 'grocery',
    },
    {
      title: easy ? 'Kul Mahana Bill' : 'Monthly Bills',
      subtitle: easy ? 'Bijli, Gas, Internet aur Fees' : 'All utility & recurring charges',
      amount: totalMonthlyBills,
      icon: FileText,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/20',
      border: 'border-violet-200/80 dark:border-violet-900/40',
      tab: 'bills',
    },
    {
      title: easy ? 'Wajib-ul-Ada Bill (Pending)' : 'Pending Payments',
      subtitle: easy ? `${pendingBillsList.length} bill ada karne baqi hain` : `${pendingBillsList.length} bills pending payment`,
      amount: pendingPaymentsAmount,
      icon: Clock,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200/80 dark:border-red-900/40',
      tab: 'bills',
    },
    {
      title: easy ? 'Ghar Ke Saman Ki Maliyat' : 'Household Assets',
      subtitle: easy ? 'AC, Fridge, TV aur Furniture keemat' : 'Total valuation of all household assets',
      amount: totalHouseholdAssets,
      icon: Boxes,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200/80 dark:border-blue-900/40',
      tab: 'inventory',
    },
    {
      title: easy ? 'Ghar Ki Marammat (Repairs)' : 'Maintenance Expenses',
      subtitle: easy ? 'Plumber, AC aur Bijli ka kharcha' : 'Home servicing & technical repairs',
      amount: maintenanceExpenses,
      icon: Wrench,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200/80 dark:border-orange-900/40',
      tab: 'maintenance',
    },
    {
      title: easy ? 'Mahana Budget Hadd' : 'Monthly Budget',
      subtitle: easy ? 'Tay shuda mahana target' : 'Configured household monthly target',
      amount: monthlyBudget,
      icon: Target,
      color: 'text-teal-700 dark:text-teal-300',
      bg: 'bg-teal-50/60 dark:bg-teal-950/20',
      border: 'border-teal-200/80 dark:border-teal-900/40',
      tab: 'budget',
    },
    {
      title: easy ? 'Baqi Budget Raqam' : 'Budget Remaining',
      subtitle: easy ? (budgetRemaining >= 0 ? 'Bachat ki gunjaish baqi hai' : 'Hadd se zyada kharcha ho gaya!') : (budgetRemaining >= 0 ? 'Within budget limit' : 'Budget exceeded!'),
      amount: budgetRemaining,
      icon: budgetRemaining >= 0 ? CheckCircle2 : ShieldAlert,
      color: budgetRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      bg: budgetRemaining >= 0 ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'bg-rose-50/60 dark:bg-rose-950/20',
      border: budgetRemaining >= 0 ? 'border-emerald-200/80 dark:border-emerald-900/40' : 'border-rose-200/80 dark:border-rose-900/40',
      tab: 'budget',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Household Summary & Fast Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#091528] via-[#0d223f] to-[#0a273b] text-white border border-[#1b355a] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-teal-400">
              SMART HOME OVERVIEW · {currentMonthStr}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            {easy ? 'Ghar Ka Mukammal Khulasa' : 'Household Financial Health'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {easy
              ? 'Yahan har aamdani, kharche, shopping, rashan aur bijli gas ke bill ka live hisaab kitab khud-ba-khud update hota hai.'
              : 'Real-time aggregated view of household finances, shopping receipts, pantry stock, and upcoming utility deadlines.'}
          </p>
        </div>

        {/* Quick action buttons strip */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onQuickAction('income')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Income</span>
          </button>
          <button
            onClick={() => onQuickAction('expense')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-950 bg-rose-400 hover:bg-rose-300 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Expense</span>
          </button>
          <button
            onClick={() => onQuickAction('shopping')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-950 bg-sky-300 hover:bg-sky-200 rounded-xl transition-all shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Log Shopping</span>
          </button>
          <button
            onClick={() => onQuickAction('grocery')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-950 bg-amber-300 hover:bg-amber-200 rounded-xl transition-all shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>+ Grocery</span>
          </button>
          <button
            onClick={() => onQuickAction('bill')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Pay / Add Bill</span>
          </button>
        </div>
      </div>

      {/* Critical Reminders & Stock Warnings */}
      {(upcomingBills.length > 0 || lowStockGroceries.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Due Bills Alert */}
          {upcomingBills.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
              <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                    {easy ? 'Zaroori Bill Ki Aakhri Tareekh' : 'Upcoming / Overdue Bills'}
                  </h4>
                  <button
                    onClick={() => onNavigateTab('bills')}
                    className="text-xs text-rose-700 dark:text-rose-300 font-semibold underline"
                  >
                    View All Bills
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  {upcomingBills.slice(0, 2).map((bill) => {
                    const days = getDaysRemaining(bill.dueDate);
                    return (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-rose-200/50 dark:border-rose-900/30"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {bill.name}
                        </span>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            {days.text}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(bill.remainingAmount, currency, symbol)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Low Stock Groceries Alert */}
          {lowStockGroceries.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                    {easy ? 'Rashan Khatam Honay Wala Hai (Stock Alert)' : 'Low Pantry Stock Alert'}
                  </h4>
                  <button
                    onClick={() => onNavigateTab('grocery')}
                    className="text-xs text-amber-700 dark:text-amber-300 font-semibold underline"
                  >
                    View Grocery
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  {lowStockGroceries.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-amber-200/50 dark:border-amber-900/30"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 ml-2">
                        Only {item.remainingStock} {item.unit} left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 12 LIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab(card.tab)}
              className={`p-4 rounded-xl bg-white dark:bg-[#0b172a] border ${card.border} hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(card.amount, currency, symbol)}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Monthly Budget Status & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Progress Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {easy ? 'Mahana Budget Ka Jaiza' : 'Monthly Budget Progress'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {easy ? 'Target ba-muqabla asal kharcha' : 'Planned budget vs actual spent'}
                </p>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  budgetUsedPercent > 100
                    ? 'text-rose-600 bg-rose-100 dark:bg-rose-950/60'
                    : budgetUsedPercent > 80
                    ? 'text-amber-600 bg-amber-100 dark:bg-amber-950/60'
                    : 'text-teal-600 bg-teal-100 dark:bg-teal-950/60'
                }`}
              >
                {budgetUsedPercent}% Used
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-5">
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetUsedPercent > 100
                      ? 'bg-rose-500'
                      : budgetUsedPercent > 80
                      ? 'bg-amber-500'
                      : 'bg-teal-500'
                  }`}
                  style={{ width: `${Math.min(100, budgetUsedPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs mt-2 text-slate-500 font-mono">
                <span>Spent: {formatCurrency(totalMonthlyExpenses, currency, symbol)}</span>
                <span>Budget: {formatCurrency(monthlyBudget, currency, symbol)}</span>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                  {easy ? 'Baqi Kharch Karne Ki Gunjaish:' : 'Remaining Spending Capacity:'}
                </span>
                <span
                  className={`font-mono font-bold ${
                    budgetRemaining >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(budgetRemaining, currency, symbol)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to calibrate limits?</span>
            <button
              onClick={() => onNavigateTab('budget')}
              className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
            >
              Adjust Budget &rarr;
            </button>
          </div>
        </div>

        {/* Top Spending Categories */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {easy ? 'Kahan Sab Se Zyada Kharcha Hua?' : 'Top Spending Categories'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {easy ? 'Is maah ke sab se baray kharchay' : 'Highest expenditure categories this month'}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
            >
              Full Ledger &rarr;
            </button>
          </div>

          {sortedCategories.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No expenses recorded for this month yet.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([category, amount], idx) => {
                const percent =
                  totalMonthlyExpenses > 0
                    ? Math.round((amount / totalMonthlyExpenses) * 100)
                    : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px] font-mono">{percent}%</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(amount, currency, symbol)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-teal-600 dark:bg-teal-500 rounded-full"
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

      {/* Bottom Section: Recent Transactions with "Kia Cheez Kitny Ki Aayi" details */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {easy ? 'Haliya Kharchay aur Kharidari (Kia Cheez Kitny Ki Aayi)' : 'Recent Household Transactions & Item Breakdown'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {easy
                ? 'Har kharidari aur bill ka tafseeli hisaab'
                : 'Latest logged expenses and itemized shopping receipts'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('expenses')}
            className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
          >
            View All &rarr;
          </button>
        </div>

        {database.expenses.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No transactions found. Click "+ Expense" to log your first transaction!
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {database.expenses.slice(0, 5).map((exp) => {
              // Check if there is an associated shopping transaction with item breakdown
              const linkedShopping = database.shoppingTransactions.find(
                (st) => st.date === exp.date && (st.totalAmount === exp.amount || st.notes?.includes(exp.category))
              );

              return (
                <div key={exp.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {exp.description}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {exp.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{formatDate(exp.date)}</span>
                        <span>·</span>
                        <span>{exp.paymentMethod}</span>
                        {exp.paidTo && (
                          <>
                            <span>·</span>
                            <span>Paid to: {exp.paidTo}</span>
                          </>
                        )}
                        {exp.memberName && (
                          <>
                            <span>·</span>
                            <span>By: {exp.memberName}</span>
                          </>
                        )}
                      </div>

                      {/* "Kia Cheez Kitny Ki Aayi" itemized breakdown if available */}
                      {linkedShopping && linkedShopping.items.length > 0 && (
                        <div className="mt-1.5 p-2 rounded-lg bg-teal-50/70 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 text-[11px] text-teal-900 dark:text-teal-200">
                          <span className="font-semibold text-teal-700 dark:text-teal-300 block mb-1">
                            {easy ? 'Kia Cheez Kitny Ki Aayi (Item Breakdown):' : 'Itemized Receipt Breakdown:'}
                          </span>
                          <div className="space-y-0.5">
                            {linkedShopping.items.map((it) => (
                              <div key={it.id} className="flex items-center justify-between font-mono">
                                <span>
                                  • {it.name} ({it.quantity} × {formatCurrency(it.unitPrice, currency, symbol)})
                                </span>
                                <span className="font-bold">
                                  {formatCurrency(it.totalPrice, currency, symbol)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0 pl-11 sm:pl-0">
                    <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                      -{formatCurrency(exp.amount, currency, symbol)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
