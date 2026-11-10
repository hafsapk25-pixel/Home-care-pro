import React, { useState } from 'react';
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Edit2,
  Trash2,
  X,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { FullHouseholdDatabase, CategoryBudget } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BudgetViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ database, onUpdateDatabase }) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const easy = database.settings.easyWording;

  const [isEditingTotalBudget, setIsEditingTotalBudget] = useState(false);
  const [tempTotalBudget, setTempTotalBudget] = useState(
    database.settings.totalMonthlyBudget.toString()
  );

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryBudget, setEditingCategoryBudget] = useState<CategoryBudget | null>(null);
  const [catBudgetForm, setCatBudgetForm] = useState({
    category: database.settings.customExpenseCategories[0] || 'Grocery (Rashan)',
    monthlyLimit: '50000',
  });

  // Current month prefix e.g. "2026-11"
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Current Month Actual Expenses
  const currentMonthExpenses = database.expenses.filter((e) =>
    e.date.startsWith(currentMonthStr)
  );
  const totalActualSpent = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPlannedBudget = database.settings.totalMonthlyBudget;
  const overallRemaining = totalPlannedBudget - totalActualSpent;
  const overallPercentage =
    totalPlannedBudget > 0 ? Math.round((totalActualSpent / totalPlannedBudget) * 100) : 0;

  // Category actual spending map
  const categorySpentMap = new Map<string, number>();
  currentMonthExpenses.forEach((exp) => {
    const cur = categorySpentMap.get(exp.category) || 0;
    categorySpentMap.set(exp.category, cur + exp.amount);
  });

  const handleSaveTotalBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempTotalBudget);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid monthly budget');
      return;
    }
    onUpdateDatabase({
      ...database,
      settings: { ...database.settings, totalMonthlyBudget: val },
    });
    setIsEditingTotalBudget(false);
  };

  const handleSaveCategoryBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(catBudgetForm.monthlyLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      alert('Please enter a valid limit');
      return;
    }

    const exists = database.categoryBudgets.find((cb) => cb.category === catBudgetForm.category);
    let updatedCategoryBudgets: CategoryBudget[];

    if (exists) {
      updatedCategoryBudgets = database.categoryBudgets.map((cb) =>
        cb.category === catBudgetForm.category ? { ...cb, monthlyLimit: limitNum } : cb
      );
    } else {
      updatedCategoryBudgets = [
        ...database.categoryBudgets,
        { category: catBudgetForm.category, monthlyLimit: limitNum },
      ];
    }

    onUpdateDatabase({ ...database, categoryBudgets: updatedCategoryBudgets });
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategoryBudget = (categoryName: string) => {
    const updated = database.categoryBudgets.filter((cb) => cb.category !== categoryName);
    onUpdateDatabase({ ...database, categoryBudgets: updated });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            {easy ? 'Mahana Budget Limit (Household Budget)' : 'Monthly Budget Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'Kul mahana budget aur har category ki hadd taake kharcha control mein rahay'
              : 'Enforce overall household spending limits and category-by-category ceiling budgets'}
          </p>
        </div>

        <button
          onClick={() => {
            setCatBudgetForm({
              category: database.settings.customExpenseCategories[0] || 'Grocery (Rashan)',
              monthlyLimit: '30000',
            });
            setIsCategoryModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Set Category Budget</span>
        </button>
      </div>

      {/* Main Budget Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#091528] via-[#0d223f] to-[#0a273b] text-white border border-[#1b355a] shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">
              TOTAL HOUSEHOLD MONTHLY TARGET · {currentMonthStr}
            </span>
            <div className="flex items-center gap-3 mt-1">
              {isEditingTotalBudget ? (
                <form onSubmit={handleSaveTotalBudget} className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={tempTotalBudget}
                    onChange={(e) => setTempTotalBudget(e.target.value)}
                    className="w-44 px-3 py-1.5 text-lg font-mono font-bold bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold bg-teal-500 text-slate-900 rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTotalBudget(false)}
                    className="px-2 py-1.5 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
                    {formatCurrency(totalPlannedBudget, currency, symbol)}
                  </span>
                  <button
                    onClick={() => {
                      setTempTotalBudget(totalPlannedBudget.toString());
                      setIsEditingTotalBudget(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-teal-300 rounded-lg hover:bg-white/10"
                    title="Change Monthly Budget"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Spent This Month</span>
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatCurrency(totalActualSpent, currency, symbol)}
            </span>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium">
              Budget Consumed: <strong className="font-mono text-teal-300">{overallPercentage}%</strong>
            </span>
            <span
              className={`font-semibold font-mono ${
                overallRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {overallRemaining >= 0
                ? `${formatCurrency(overallRemaining, currency, symbol)} remaining`
                : `${formatCurrency(Math.abs(overallRemaining), currency, symbol)} OVER BUDGET!`}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage > 100
                  ? 'bg-rose-500'
                  : overallPercentage > 80
                  ? 'bg-amber-400'
                  : 'bg-teal-400'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category-Wise Budgets Table & Progress */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-teal-600" />
              {easy ? 'Category Ke Mutabiq Budget Hadd' : 'Category-Wise Budget Breakdown'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {easy
                ? 'Har category ka tay shuda budget ba-muqabla asal kharcha'
                : 'Live tracking of planned monthly allocations vs actual money spent per department'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {database.categoryBudgets.map((cb) => {
            const spent = categorySpentMap.get(cb.category) || 0;
            const percent = cb.monthlyLimit > 0 ? Math.round((spent / cb.monthlyLimit) * 100) : 0;
            const remaining = cb.monthlyLimit - spent;
            const isExceeded = spent > cb.monthlyLimit;

            return (
              <div
                key={cb.category}
                className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {cb.category}
                    </span>
                    {isExceeded && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Exceeded by {formatCurrency(Math.abs(remaining), currency, symbol)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(spent, currency, symbol)}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {' '}
                        / {formatCurrency(cb.monthlyLimit, currency, symbol)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteCategoryBudget(cb.category)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Remove category budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isExceeded
                        ? 'bg-rose-500'
                        : percent > 80
                        ? 'bg-amber-500'
                        : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{percent}% allocated</span>
                  <span className={remaining >= 0 ? 'text-slate-500' : 'text-rose-600 font-bold'}>
                    {remaining >= 0
                      ? `${formatCurrency(remaining, currency, symbol)} available`
                      : 'Limit exceeded'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Set Category Budget Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" />
                Set Category Monthly Limit
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryBudget} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Category
                </label>
                <select
                  value={catBudgetForm.category}
                  onChange={(e) =>
                    setCatBudgetForm({ ...catBudgetForm, category: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {database.settings.customExpenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Spending Ceiling ({symbol}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 50000"
                  value={catBudgetForm.monthlyLimit}
                  onChange={(e) =>
                    setCatBudgetForm({ ...catBudgetForm, monthlyLimit: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
