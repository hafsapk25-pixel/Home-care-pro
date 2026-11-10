import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  Calendar,
  X,
  CreditCard,
  Building,
  Tag,
} from 'lucide-react';
import { FullHouseholdDatabase, Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ExpensesViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ database, onUpdateDatabase }) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const easy = database.settings.easyWording;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    category: database.settings.customExpenseCategories[0] || 'Grocery (Rashan)',
    description: '',
    paymentMethod: 'Cash',
    paidTo: '',
    memberId: database.members[0]?.id || '',
  });

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      category: database.settings.customExpenseCategories[0] || 'Grocery (Rashan)',
      description: '',
      paymentMethod: 'Cash',
      paidTo: '',
      memberId: database.members[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      paymentMethod: expense.paymentMethod,
      paidTo: expense.paidTo || '',
      memberId: expense.memberId || database.members[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      const updated = database.expenses.filter((e) => e.id !== id);
      onUpdateDatabase({ ...database, expenses: updated });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const member = database.members.find((m) => m.id === formData.memberId);

    if (editingExpense) {
      const updated = database.expenses.map((exp) =>
        exp.id === editingExpense.id
          ? {
              ...exp,
              date: formData.date,
              amount: amountNum,
              category: formData.category,
              description: formData.description,
              paymentMethod: formData.paymentMethod,
              paidTo: formData.paidTo,
              memberId: formData.memberId,
              memberName: member?.name,
            }
          : exp
      );
      onUpdateDatabase({ ...database, expenses: updated });
    } else {
      const newExpense: Expense = {
        id: `exp_${Date.now()}`,
        date: formData.date,
        amount: amountNum,
        category: formData.category,
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        paidTo: formData.paidTo,
        memberId: formData.memberId,
        memberName: member?.name,
        createdAt: new Date().toISOString(),
      };
      onUpdateDatabase({ ...database, expenses: [newExpense, ...database.expenses] });
    }
    setIsModalOpen(false);
  };

  // Filtered expenses
  const filteredExpenses = database.expenses.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.paidTo && exp.paidTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exp.memberName && exp.memberName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;
    const matchesMonth = selectedMonth === 'All' || exp.date.startsWith(selectedMonth);

    return matchesSearch && matchesCategory && matchesMonth;
  });

  const totalFilteredExpense = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Available unique months
  const months = Array.from(new Set(database.expenses.map((e) => e.date.slice(0, 7)))).sort().reverse();

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount (PKR)', 'Payment Method', 'Paid To', 'Logged By'];
    const rows = filteredExpenses.map((e) => [
      e.date,
      `"${e.category}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      `"${e.paymentMethod}"`,
      `"${e.paidTo || ''}"`,
      `"${e.memberName || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Expenses_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-600" />
            {easy ? 'Ghar Ke Kharchay (Expense Ledger)' : 'Expense Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'Ghar ke har kharchay ka alag category aur tareekh ke mutabiq hisaab'
              : 'Log, categorize, and inspect household expenditures with precise payment details'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Filtered Total Expenses</span>
          <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            {formatCurrency(totalFilteredExpense, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''} logged
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Active Category Filter</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
            {selectedCategory === 'All' ? 'All Categories Combined' : selectedCategory}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {database.settings.customExpenseCategories.length} configured categories
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Average Per Transaction</span>
          <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatCurrency(
              filteredExpenses.length > 0 ? totalFilteredExpense / filteredExpenses.length : 0,
              currency,
              symbol
            )}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Average spending ticket</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search description, recipient, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="All">All Categories</option>
            {database.settings.customExpenseCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Month filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="All">All Months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b172a] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Paid To</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No expense records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {exp.paidTo || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                      -{formatCurrency(exp.amount, currency, symbol)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-600" />
                {editingExpense ? 'Edit Household Expense' : 'Record Household Expense'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount ({symbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 48500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
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
                  Description / Item Details *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly rashan & kitchen supplies from Imtiaz"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paid To (Shop / Person / Vendor)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Imtiaz Super Market / Plumber"
                    value={formData.paidTo}
                    onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Debit Card (Meezan)">Debit Card (Meezan)</option>
                    <option value="Debit Card (HBL)">Debit Card (HBL)</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="Online Bank Transfer">Online Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Spent By (Household Member)
                </label>
                <select
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  {database.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
