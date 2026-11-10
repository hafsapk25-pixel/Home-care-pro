import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Store,
  CreditCard,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X,
  FileCheck,
  Search,
  Tag,
} from 'lucide-react';
import { FullHouseholdDatabase, ShoppingTransaction, ShoppingItem, Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ShoppingViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const ShoppingView: React.FC<ShoppingViewProps> = ({ database, onUpdateDatabase }) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const easy = database.settings.easyWording;

  const [expandedId, setExpandedId] = useState<string | null>(
    database.shoppingTransactions[0]?.id || null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [headerForm, setHeaderForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    shopName: '',
    category: database.settings.customShoppingCategories[0] || 'Clothing & Footwear',
    paymentMethod: 'Debit Card (Meezan)',
    notes: '',
    receiptImage: '',
  });

  const [itemsList, setItemsList] = useState<Array<{ name: string; category: string; quantity: number; unitPrice: number }>>([
    { name: '', category: 'General', quantity: 1, unitPrice: 0 },
  ]);

  const openAddModal = () => {
    setHeaderForm({
      date: new Date().toISOString().slice(0, 10),
      shopName: '',
      category: database.settings.customShoppingCategories[0] || 'Clothing & Footwear',
      paymentMethod: 'Debit Card (Meezan)',
      notes: '',
      receiptImage: '',
    });
    setItemsList([{ name: '', category: 'General', quantity: 1, unitPrice: 0 }]);
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    setItemsList([...itemsList, { name: '', category: 'General', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (idx: number) => {
    if (itemsList.length <= 1) return;
    setItemsList(itemsList.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: string, value: any) => {
    const updated = [...itemsList];
    updated[idx] = { ...updated[idx], [field]: value };
    setItemsList(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeaderForm({ ...headerForm, receiptImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const totalCalculatedBill = itemsList.reduce(
    (acc, curr) => acc + (curr.quantity || 0) * (curr.unitPrice || 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerForm.shopName) {
      alert('Please enter shop or mall name');
      return;
    }
    if (itemsList.some((it) => !it.name || it.unitPrice <= 0)) {
      alert('Please fill in product name and valid price for all items');
      return;
    }

    const transactionId = `shop_${Date.now()}`;
    const builtItems: ShoppingItem[] = itemsList.map((it, idx) => ({
      id: `sitem_${Date.now()}_${idx}`,
      name: it.name,
      category: it.category,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 0,
      totalPrice: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
      notes: `${it.quantity} × ${formatCurrency(it.unitPrice, currency, symbol)} = ${formatCurrency(
        (it.quantity || 1) * (it.unitPrice || 0),
        currency,
        symbol
      )}`,
    }));

    const totalAmt = builtItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

    const newTransaction: ShoppingTransaction = {
      id: transactionId,
      date: headerForm.date,
      shopName: headerForm.shopName,
      category: headerForm.category,
      paymentMethod: headerForm.paymentMethod,
      totalAmount: totalAmt,
      items: builtItems,
      receiptImage: headerForm.receiptImage,
      notes: headerForm.notes,
      createdAt: new Date().toISOString(),
    };

    // Auto-create matching expense in expenses ledger so totals stay synchronized!
    const newExpense: Expense = {
      id: `exp_shop_${Date.now()}`,
      date: headerForm.date,
      amount: totalAmt,
      category: 'Shopping & Clothes',
      description: `Shopping at ${headerForm.shopName} (${builtItems.map((b) => b.name).join(', ')})`,
      paymentMethod: headerForm.paymentMethod,
      paidTo: headerForm.shopName,
      receiptUrl: headerForm.receiptImage,
      createdAt: new Date().toISOString(),
    };

    onUpdateDatabase({
      ...database,
      shoppingTransactions: [newTransaction, ...database.shoppingTransactions],
      expenses: [newExpense, ...database.expenses],
    });

    setIsModalOpen(false);
    setExpandedId(transactionId);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Delete this shopping transaction record?')) {
      const updated = database.shoppingTransactions.filter((st) => st.id !== id);
      onUpdateDatabase({ ...database, shoppingTransactions: updated });
    }
  };

  // Calculations
  const allTimeShoppingAmount = database.shoppingTransactions.reduce(
    (acc, curr) => acc + curr.totalAmount,
    0
  );

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthShoppingAmount = database.shoppingTransactions
    .filter((st) => st.date.startsWith(currentMonthStr))
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Most purchased products ranking
  const productFrequency = new Map<string, { count: number; totalSpent: number }>();
  database.shoppingTransactions.forEach((st) => {
    st.items.forEach((it) => {
      const existing = productFrequency.get(it.name) || { count: 0, totalSpent: 0 };
      productFrequency.set(it.name, {
        count: existing.count + it.quantity,
        totalSpent: existing.totalSpent + it.totalPrice,
      });
    });
  });

  const topProducts = Array.from(productFrequency.entries())
    .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
    .slice(0, 4);

  const filteredTransactions = database.shoppingTransactions.filter((st) => {
    const q = searchTerm.toLowerCase();
    const matchShop = st.shopName.toLowerCase().includes(q);
    const matchCat = st.category.toLowerCase().includes(q);
    const matchItem = st.items.some((it) => it.name.toLowerCase().includes(q));
    return matchShop || matchCat || matchItem;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            {easy
              ? 'Kharidari Ka Hisaab (Kia Cheez Kitny Ki Aayi)'
              : 'Shopping Management & Itemized Receipts'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'Kapray, joote aur mall ki kharidari ka itemized rate aur rasidain'
              : 'Detailed product breakdowns: unit rates, item quantities, total costs, and receipt scans'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Shopping Bill</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Is Maah Ki Kharidari' : 'This Month Shopping Total'}
          </span>
          <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
            {formatCurrency(thisMonthShoppingAmount, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {database.shoppingTransactions.filter((st) => st.date.startsWith(currentMonthStr)).length} shopping trips logged
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Kul Shopping Kharcha (All-Time)' : 'All-Time Shopping Expenditure'}
          </span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatCurrency(allTimeShoppingAmount, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {database.shoppingTransactions.length} receipts stored
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Top Purchased Item</span>
          <p className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
            {topProducts[0] ? topProducts[0][0] : 'None logged yet'}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            {topProducts[0]
              ? `${topProducts[0][1].count} units · ${formatCurrency(topProducts[0][1].totalSpent, currency, symbol)}`
              : 'Awaiting transactions'}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          placeholder="Search by shop name, product name (e.g. Kurta, Shoes, Kettle)..."
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

      {/* Transactions List with "Kia Cheez Kitny Ki Aayi" Breakdown */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#0b172a] rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No shopping records found matching your search.
          </div>
        ) : (
          filteredTransactions.map((st) => {
            const isExpanded = expandedId === st.id;

            return (
              <div
                key={st.id}
                className="bg-white dark:bg-[#0b172a] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all"
              >
                {/* Transaction Header Bar */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-900/50"
                  onClick={() => setExpandedId(isExpanded ? null : st.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {st.shopName}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {st.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono">{formatDate(st.date)}</span>
                        <span>·</span>
                        <span>{st.paymentMethod}</span>
                        <span>·</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {st.items.length} item{st.items.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 ml-3">
                    <div className="text-right">
                      <span className="text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(st.totalAmount, currency, symbol)}
                      </span>
                      <span className="block text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                        {easy ? 'Tafseel Dekhein' : 'View Item Breakdown'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {st.receiptImage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReceiptImage(st.receiptImage || null);
                          }}
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg"
                          title="View Receipt Photo"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTransaction(st.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded "Kia Cheez Kitny Ki Aayi" Itemized Table */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 p-4 bg-slate-50/50 dark:bg-slate-900/30 animate-in fade-in duration-100">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        {easy
                          ? 'Kia Cheez Kitny Ki Aayi (Itemized Price Calculation)'
                          : 'Line-by-Line Product Breakdown'}
                      </h5>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Formula: Quantity × Price Per Item = Total
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b172a] overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100/70 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Item / Product Name</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3 text-center">Quantity (Tadaad)</th>
                            <th className="py-2.5 px-3 text-right">Price per Item (Kitny Ka Aaya)</th>
                            <th className="py-2.5 px-3 text-right">Total Price (Kul Raqam)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {st.items.map((it, idx) => (
                            <tr key={it.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                                {it.name}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">{it.category || 'General'}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                                {it.quantity}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                {formatCurrency(it.unitPrice, currency, symbol)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {formatCurrency(it.totalPrice, currency, symbol)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 font-bold">
                          <tr>
                            <td colSpan={4} className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                              Grand Total Bill:
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white text-sm">
                              {formatCurrency(st.totalAmount, currency, symbol)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {st.notes && (
                      <p className="text-xs text-slate-500 mt-2 italic">Notes: {st.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Shopping Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                Log Shopping Bill & "Kia Cheez Kitny Ki Aayi"
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shop / Bazaar Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dolmen Mall / Imtiaz / J."
                    value={headerForm.shopName}
                    onChange={(e) => setHeaderForm({ ...headerForm, shopName: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={headerForm.date}
                    onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={headerForm.paymentMethod}
                    onChange={(e) => setHeaderForm({ ...headerForm, paymentMethod: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Debit Card (Meezan)">Debit Card (Meezan)</option>
                    <option value="Debit Card (HBL)">Debit Card (HBL)</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                  </select>
                </div>
              </div>

              {/* Items Section: "Kia Cheez Kitny Ki Aayi" */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Itemized Line Items (Kia Cheez Kitny Ki Aayi)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {itemsList.map((item, idx) => {
                    const rowTotal = (item.quantity || 0) * (item.unitPrice || 0);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <input
                          type="text"
                          required
                          placeholder="Product Name (e.g. Shalwar Kameez)"
                          value={item.name}
                          onChange={(e) => updateItemRow(idx, 'name', e.target.value)}
                          className="flex-2 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                        />

                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItemRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-center focus:outline-none"
                        />

                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            placeholder={`Rate (${symbol})`}
                            value={item.unitPrice || ''}
                            onChange={(e) => updateItemRow(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none"
                          />
                        </div>

                        <div className="w-24 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(rowTotal, currency, symbol)}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={itemsList.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal Calculation */}
                <div className="flex items-center justify-between p-3 mt-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Grand Total Calculated (Automatically saved to Expenses):
                  </span>
                  <span className="font-mono font-bold text-base text-indigo-700 dark:text-indigo-300">
                    {formatCurrency(totalCalculatedBill, currency, symbol)}
                  </span>
                </div>
              </div>

              {/* Upload Receipt & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attach Bill / Receipt Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                  />
                  {headerForm.receiptImage && (
                    <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                      ✓ Image attached successfully
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shopping Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Purchased with 20% winter discount"
                    value={headerForm.notes}
                    onChange={(e) => setHeaderForm({ ...headerForm, notes: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save Shopping Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Receipt Photo Modal */}
      {selectedReceiptImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden p-4 shadow-2xl">
            <button
              onClick={() => setSelectedReceiptImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
              Attached Shopping Receipt
            </h4>
            <img
              src={selectedReceiptImage}
              alt="Receipt"
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
