import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Flame,
  Droplets,
  Wifi,
  Phone,
  Home,
  GraduationCap,
  Wrench,
  Edit2,
  Trash2,
  Search,
  X,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { FullHouseholdDatabase, MonthlyBill, Expense } from '../types';
import { formatCurrency, formatDate, getDaysRemaining } from '../utils/formatters';

interface BillsViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const BillsView: React.FC<BillsViewProps> = ({ database, onUpdateDatabase }) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const easy = database.settings.easyWording;

  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<MonthlyBill | null>(null);
  const [payingBill, setPayingBill] = useState<MonthlyBill | null>(null);

  // Pay Modal State
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'EasyPaisa',
  });

  // Bill Form State
  const [formData, setFormData] = useState({
    name: '',
    urduName: '',
    billType: 'electricity' as MonthlyBill['billType'],
    billingMonth: new Date().toISOString().slice(0, 7),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    totalAmount: '',
    consumerNumber: '',
    notes: '',
  });

  const getBillIcon = (type: MonthlyBill['billType']) => {
    switch (type) {
      case 'electricity':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'gas':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'water':
        return <Droplets className="w-4 h-4 text-sky-500" />;
      case 'internet':
        return <Wifi className="w-4 h-4 text-indigo-500" />;
      case 'mobile':
        return <Phone className="w-4 h-4 text-teal-500" />;
      case 'rent':
        return <Home className="w-4 h-4 text-purple-500" />;
      case 'school_fee':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const openAddModal = () => {
    setEditingBill(null);
    setFormData({
      name: '',
      urduName: '',
      billType: 'electricity',
      billingMonth: new Date().toISOString().slice(0, 7),
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      totalAmount: '',
      consumerNumber: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (bill: MonthlyBill) => {
    setEditingBill(bill);
    setFormData({
      name: bill.name,
      urduName: bill.urduName || '',
      billType: bill.billType,
      billingMonth: bill.billingMonth,
      dueDate: bill.dueDate,
      totalAmount: bill.totalAmount.toString(),
      consumerNumber: bill.consumerNumber || '',
      notes: bill.notes || '',
    });
    setIsModalOpen(true);
  };

  const openPayModal = (bill: MonthlyBill) => {
    setPayingBill(bill);
    setPayForm({
      amount: bill.remainingAmount.toString(),
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'EasyPaisa',
    });
    setIsPayModalOpen(true);
  };

  const handleDeleteBill = (id: string) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      const updated = database.monthlyBills.filter((b) => b.id !== id);
      onUpdateDatabase({ ...database, monthlyBills: updated });
    }
  };

  const handleSubmitBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.totalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid bill amount');
      return;
    }

    if (editingBill) {
      const updated = database.monthlyBills.map((b) =>
        b.id === editingBill.id
          ? {
              ...b,
              name: formData.name,
              urduName: formData.urduName,
              billType: formData.billType,
              billingMonth: formData.billingMonth,
              dueDate: formData.dueDate,
              totalAmount: amountNum,
              remainingAmount: Math.max(0, amountNum - b.paidAmount),
              status:
                b.paidAmount >= amountNum
                  ? ('paid' as const)
                  : b.paidAmount > 0
                  ? ('partial' as const)
                  : ('unpaid' as const),
              consumerNumber: formData.consumerNumber,
              notes: formData.notes,
            }
          : b
      );
      onUpdateDatabase({ ...database, monthlyBills: updated });
    } else {
      const newBill: MonthlyBill = {
        id: `bill_${Date.now()}`,
        name: formData.name,
        urduName: formData.urduName,
        billType: formData.billType,
        billingMonth: formData.billingMonth,
        dueDate: formData.dueDate,
        totalAmount: amountNum,
        paidAmount: 0,
        remainingAmount: amountNum,
        status: 'unpaid',
        consumerNumber: formData.consumerNumber,
        notes: formData.notes,
      };
      onUpdateDatabase({ ...database, monthlyBills: [newBill, ...database.monthlyBills] });
    }
    setIsModalOpen(false);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;

    const payAmount = parseFloat(payForm.amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      alert('Please enter a valid paid amount');
      return;
    }

    const nextPaid = payingBill.paidAmount + payAmount;
    const nextRemaining = Math.max(0, payingBill.totalAmount - nextPaid);
    const nextStatus = nextRemaining === 0 ? ('paid' as const) : ('partial' as const);

    // Update bill
    const updatedBills = database.monthlyBills.map((b) =>
      b.id === payingBill.id
        ? {
            ...b,
            paidAmount: nextPaid,
            remainingAmount: nextRemaining,
            status: nextStatus,
            paymentDate: payForm.paymentDate,
            paymentMethod: payForm.paymentMethod,
          }
        : b
    );

    // Automatically record an expense in the expenses ledger so the entire system stays accurate!
    const newExpense: Expense = {
      id: `exp_bill_${Date.now()}`,
      date: payForm.paymentDate,
      amount: payAmount,
      category:
        payingBill.billType === 'electricity'
          ? 'Electricity (Bijli)'
          : payingBill.billType === 'gas'
          ? 'Sui Gas'
          : payingBill.billType === 'water'
          ? 'Water & Tanker'
          : payingBill.billType === 'internet'
          ? 'Internet & Cable'
          : payingBill.billType === 'school_fee'
          ? 'Education & School Fees'
          : 'Other Household',
      description: `Bill Payment: ${payingBill.name} (${payingBill.billingMonth})`,
      paymentMethod: payForm.paymentMethod,
      paidTo: payingBill.name,
      createdAt: new Date().toISOString(),
    };

    onUpdateDatabase({
      ...database,
      monthlyBills: updatedBills,
      expenses: [newExpense, ...database.expenses],
    });

    setIsPayModalOpen(false);
  };

  // Calculations
  const totalBillsAmount = database.monthlyBills.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaidAmount = database.monthlyBills.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalPendingAmount = database.monthlyBills.reduce(
    (acc, curr) => acc + curr.remainingAmount,
    0
  );

  const unpaidBillsCount = database.monthlyBills.filter(
    (b) => b.status === 'unpaid' || b.status === 'overdue' || b.status === 'partial'
  ).length;

  const filteredBills = database.monthlyBills.filter((bill) => {
    const matchesSearch =
      bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.urduName && bill.urduName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bill.consumerNumber && bill.consumerNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'unpaid'
        ? bill.status === 'unpaid' || bill.status === 'overdue' || bill.status === 'partial'
        : bill.status === 'paid';

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            {easy ? 'Bijli, Gas, Internet Ke Bill (Monthly Bills)' : 'Monthly Household Utility Bills'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'Bijli, Sui Gas, Water, WiFi, Rent aur School Fees ki aakhri tareekh aur adaigi'
              : 'Track recurring utilities, countdown overdue deadlines, and log instant payments'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Utility Bill</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Wajib-ul-Ada Raqam (Pending Bills)' : 'Total Pending Bills Amount'}
          </span>
          <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            {formatCurrency(totalPendingAmount, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {unpaidBillsCount} bill{unpaidBillsCount !== 1 ? 's' : ''} to pay
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Ada Shuda Raqam (Total Paid)' : 'Total Paid Amount'}
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {formatCurrency(totalPaidAmount, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Successfully settled</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Total Billed Volume</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatCurrency(totalBillsAmount, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {database.monthlyBills.length} total bills on file
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search bill name, consumer number, or utility..."
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
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            All Bills
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
              statusFilter === 'unpaid'
                ? 'bg-rose-600 text-white border-transparent'
                : 'bg-white dark:bg-slate-800 text-rose-600 border-rose-200 dark:border-rose-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Unpaid ({unpaidBillsCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white border-transparent'
                : 'bg-white dark:bg-slate-800 text-emerald-600 border-emerald-200 dark:border-emerald-900'
            }`}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Bills Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBills.map((bill) => {
          const rem = getDaysRemaining(bill.dueDate);
          const isPaid = bill.status === 'paid';

          return (
            <div
              key={bill.id}
              className={`p-5 rounded-2xl bg-white dark:bg-[#0b172a] border transition-all shadow-sm flex flex-col justify-between ${
                isPaid
                  ? 'border-slate-200 dark:border-slate-800'
                  : rem.isOverdue
                  ? 'border-red-300 dark:border-red-900/60'
                  : 'border-amber-200 dark:border-amber-900/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 shrink-0">
                      {getBillIcon(bill.billType)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {bill.name}
                      </h4>
                      {bill.urduName && (
                        <p className="text-[11px] text-slate-400 font-arabic">{bill.urduName}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">
                        Month: {bill.billingMonth}
                        {bill.consumerNumber ? ` · Ref: ${bill.consumerNumber}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(bill)}
                      className="p-1 text-slate-400 hover:text-teal-600 rounded"
                      title="Edit Bill"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBill(bill.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete Bill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amount and Status */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Total Bill Amount
                    </span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                      {formatCurrency(bill.totalAmount, currency, symbol)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Remaining
                    </span>
                    <span
                      className={`text-base font-bold font-mono ${
                        isPaid ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(bill.remainingAmount, currency, symbol)}
                    </span>
                  </div>
                </div>

                {bill.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 px-1">
                    {bill.notes}
                  </p>
                )}
              </div>

              {/* Bottom Actions & Countdown */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Paid on {formatDate(bill.paymentDate || '')}
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        rem.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {rem.text} · Due {formatDate(bill.dueDate)}
                    </span>
                  )}
                </div>

                {!isPaid && (
                  <button
                    onClick={() => openPayModal(bill)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pay Bill</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-600" />
                {editingBill ? 'Edit Bill Details' : 'Add Monthly Utility Bill'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBill} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bill Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. K-Electric / LESCO"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Urdu Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. بجلی کا بل"
                    value={formData.urduName}
                    onChange={(e) => setFormData({ ...formData, urduName: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bill Category
                  </label>
                  <select
                    value={formData.billType}
                    onChange={(e) => setFormData({ ...formData, billType: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="electricity">Electricity (Bijli)</option>
                    <option value="gas">Sui Gas</option>
                    <option value="water">Water / Tanker</option>
                    <option value="internet">Internet / WiFi</option>
                    <option value="mobile">Mobile Postpaid</option>
                    <option value="rent">House Rent (Kiraya)</option>
                    <option value="school_fee">School / College Fees</option>
                    <option value="maintenance">Society Maintenance</option>
                    <option value="other">Other Bill</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Billing Month (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    required
                    value={formData.billingMonth}
                    onChange={(e) => setFormData({ ...formData, billingMonth: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Amount ({symbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 18500"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Consumer Reference Number / Account ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0400012345678"
                  value={formData.consumerNumber}
                  onChange={(e) => setFormData({ ...formData, consumerNumber: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bill Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. 380 units consumed, pay before 18th"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm"
                >
                  {editingBill ? 'Save Changes' : 'Record Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Bill Modal */}
      {isPayModalOpen && payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Confirm Bill Payment
              </h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {payingBill.name} ({payingBill.billingMonth})
                </span>
                <span className="text-slate-500 mt-0.5 block">
                  Remaining balance to pay:{' '}
                  <strong className="font-mono text-rose-600 dark:text-rose-400">
                    {formatCurrency(payingBill.remainingAmount, currency, symbol)}
                  </strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Paying Amount ({symbol}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={payForm.paymentDate}
                    onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Channel
                  </label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Meezan Bank 1Bill">Meezan Bank 1Bill</option>
                    <option value="HBL Mobile App">HBL Mobile App</option>
                    <option value="Bank Alfalah">Bank Alfalah</option>
                    <option value="Cash at Post Office">Cash at Post Office</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Confirming will update the bill status to Paid AND automatically add a matching expense entry to your Household Expense Ledger.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Confirm & Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
