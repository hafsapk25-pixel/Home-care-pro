import React, { useState } from 'react';
import {
  PiggyBank,
  Plus,
  Target,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  Wallet,
  Calendar,
  Layers,
} from 'lucide-react';
import { FullHouseholdDatabase, SavingsGoal, SavingsAdjustment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface SavingsViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({ database, onUpdateDatabase }) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const easy = database.settings.easyWording;

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Goal Form State
  const [goalForm, setGoalForm] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    category: 'Emergency Fund' as SavingsGoal['category'],
    targetDate: '2027-12-31',
    notes: '',
  });

  // Transfer / Adjustment Form State
  const [adjForm, setAdjForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    type: 'deposit' as 'deposit' | 'withdrawal',
    goalId: database.savingsGoals[0]?.id || '',
    account: 'Meezan Bank Savings',
    notes: '',
  });

  // Calculations
  const allTimeIncome = database.incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const allTimeExpense = database.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const calculatedNetSavings = allTimeIncome - allTimeExpense;

  const totalGoalsTarget = database.savingsGoals.reduce((acc, curr) => acc + curr.targetAmount, 0);
  const totalGoalsSaved = database.savingsGoals.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const overallSavingsPercent = totalGoalsTarget > 0 ? Math.round((totalGoalsSaved / totalGoalsTarget) * 100) : 0;

  // Monthly savings calculation
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthIncome = database.incomes
    .filter((i) => i.date.startsWith(currentMonthStr))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const thisMonthExpense = database.expenses
    .filter((e) => e.date.startsWith(currentMonthStr))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const thisMonthSavings = thisMonthIncome - thisMonthExpense;

  // Goal Handlers
  const openAddGoalModal = () => {
    setEditingGoal(null);
    setGoalForm({
      title: '',
      targetAmount: '',
      currentAmount: '',
      category: 'Emergency Fund',
      targetDate: '2027-12-31',
      notes: '',
    });
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      category: goal.category,
      targetDate: goal.targetDate,
      notes: goal.notes || '',
    });
    setIsGoalModalOpen(true);
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      const updated = database.savingsGoals.filter((g) => g.id !== id);
      onUpdateDatabase({ ...database, savingsGoals: updated });
    }
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(goalForm.targetAmount);
    const currentNum = parseFloat(goalForm.currentAmount) || 0;

    if (isNaN(targetNum) || targetNum <= 0) {
      alert('Please enter a valid target amount');
      return;
    }

    if (editingGoal) {
      const updated = database.savingsGoals.map((g) =>
        g.id === editingGoal.id
          ? {
              ...g,
              title: goalForm.title,
              targetAmount: targetNum,
              currentAmount: currentNum,
              category: goalForm.category,
              targetDate: goalForm.targetDate,
              notes: goalForm.notes,
            }
          : g
      );
      onUpdateDatabase({ ...database, savingsGoals: updated });
    } else {
      const newGoal: SavingsGoal = {
        id: `svg_${Date.now()}`,
        title: goalForm.title,
        targetAmount: targetNum,
        currentAmount: currentNum,
        category: goalForm.category,
        targetDate: goalForm.targetDate,
        notes: goalForm.notes,
        createdAt: new Date().toISOString(),
      };
      onUpdateDatabase({ ...database, savingsGoals: [...database.savingsGoals, newGoal] });
    }
    setIsGoalModalOpen(false);
  };

  // Adjustment Handlers
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(adjForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid transfer amount');
      return;
    }

    const newAdj: SavingsAdjustment = {
      id: `sadj_${Date.now()}`,
      date: adjForm.date,
      amount: amountNum,
      type: adjForm.type,
      goalId: adjForm.goalId,
      account: adjForm.account,
      notes: adjForm.notes,
      createdAt: new Date().toISOString(),
    };

    // Also update the target goal current amount
    const updatedGoals = database.savingsGoals.map((goal) => {
      if (goal.id === adjForm.goalId) {
        const delta = adjForm.type === 'deposit' ? amountNum : -amountNum;
        return {
          ...goal,
          currentAmount: Math.max(0, goal.currentAmount + delta),
        };
      }
      return goal;
    });

    onUpdateDatabase({
      ...database,
      savingsGoals: updatedGoals,
      savingsAdjustments: [newAdj, ...database.savingsAdjustments],
    });

    setIsAdjModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-teal-600" />
            {easy ? 'Bachat aur Kameti (Savings & Goals)' : 'Savings & Goals Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'Aapata Fund, Bank Bachat, Kameti aur Maqasid ki raqam'
              : 'Track emergency funds, Islamic bank savings, committee pools, and target milestones'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdjModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-teal-600" />
            <span>Deposit / Transfer</span>
          </button>
          <button
            onClick={openAddGoalModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Savings Goal</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Asal Bachat (Income - Expenses)' : 'Auto-Calculated Net Savings'}
          </span>
          <p
            className={`text-2xl font-bold font-mono mt-1 tabular-nums ${
              calculatedNetSavings >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600'
            }`}
          >
            {formatCurrency(calculatedNetSavings, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Cumulative household surplus</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Is Maah Ki Bachat' : 'This Month Net Savings'}
          </span>
          <p
            className={`text-2xl font-bold font-mono mt-1 tabular-nums ${
              thisMonthSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
            }`}
          >
            {formatCurrency(thisMonthSavings, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Current monthly balance</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Maqasid Mein Jama Shuda' : 'Total Saved in Goals'}
          </span>
          <p className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1 tabular-nums">
            {formatCurrency(totalGoalsSaved, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Target: {formatCurrency(totalGoalsTarget, currency, symbol)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Overall Goal Completion</span>
          <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
            {overallSavingsPercent}%
          </p>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${Math.min(100, overallSavingsPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Savings Goals Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Target className="w-4 h-4 text-teal-600" />
            {easy ? 'Ghar Ke Zaroori Maqasid (Active Savings Goals)' : 'Active Savings Targets & Emergency Funds'}
          </h3>
          <span className="text-xs text-slate-400">
            {database.savingsGoals.length} goal{database.savingsGoals.length !== 1 ? 's' : ''} tracked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {database.savingsGoals.map((goal) => {
            const percent =
              goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400">
                        {goal.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {goal.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditGoalModal(goal)}
                        className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {formatCurrency(goal.currentAmount, currency, symbol)}
                      </span>
                      <span className="text-slate-500 font-mono">
                        Target: {formatCurrency(goal.targetAmount, currency, symbol)}
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                      <span>{percent}% Completed</span>
                      <span>Remaining: {formatCurrency(remaining, currency, symbol)}</span>
                    </div>
                  </div>

                  {goal.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {goal.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Target: {formatDate(goal.targetDate)}
                  </span>
                  <button
                    onClick={() => {
                      setAdjForm({ ...adjForm, goalId: goal.id, type: 'deposit' });
                      setIsAdjModalOpen(true);
                    }}
                    className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                  >
                    + Add Money
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Adjustments & Transfers History */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-slate-500" />
          {easy ? 'Bachat / Kameti Transfers History' : 'Savings Adjustments & Account Deposits'}
        </h3>

        {database.savingsAdjustments.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No transfer or adjustment history logged yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {database.savingsAdjustments.map((adj) => {
              const goal = database.savingsGoals.find((g) => g.id === adj.goalId);
              const isDeposit = adj.type === 'deposit';

              return (
                <div key={adj.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isDeposit
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                      }`}
                    >
                      {isDeposit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {goal ? goal.title : adj.account}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatDate(adj.date)} · Account: {adj.account}
                        {adj.notes ? ` · ${adj.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold ${
                      isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                    }`}
                  >
                    {isDeposit ? '+' : '-'}
                    {formatCurrency(adj.amount, currency, symbol)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" />
                {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hajj Fund / Solar Installation"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Target ({symbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 500000"
                    value={goalForm.targetAmount}
                    onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Already Saved ({symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 150000"
                    value={goalForm.currentAmount}
                    onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Bank Savings">Bank Savings</option>
                    <option value="Cash in Hand">Cash in Hand</option>
                    <option value="Gold / Kameti">Gold / Kameti</option>
                    <option value="Home Improvement">Home Improvement</option>
                    <option value="Hajj / Umrah">Hajj / Umrah</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    required
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes & Strategy
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dedicated Meezan bank profit account"
                  value={goalForm.notes}
                  onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  {editingGoal ? 'Update Goal' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment / Deposit Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-teal-600" />
                Deposit / Adjust Savings
              </h3>
              <button
                onClick={() => setIsAdjModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Savings Goal
                </label>
                <select
                  value={adjForm.goalId}
                  onChange={(e) => setAdjForm({ ...adjForm, goalId: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {database.savingsGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({formatCurrency(g.currentAmount, currency, symbol)} saved)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={adjForm.type}
                    onChange={(e) => setAdjForm({ ...adjForm, type: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="deposit">+ Deposit (Jama)</option>
                    <option value="withdrawal">- Withdrawal (Nikalwaya)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount ({symbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 25000"
                    value={adjForm.amount}
                    onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={adjForm.date}
                    onChange={(e) => setAdjForm({ ...adjForm, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account / Pool
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Meezan Bank / Cash Safe"
                    value={adjForm.account}
                    onChange={(e) => setAdjForm({ ...adjForm, account: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly allocation from salary"
                  value={adjForm.notes}
                  onChange={(e) => setAdjForm({ ...adjForm, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Record Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
