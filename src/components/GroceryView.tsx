import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Search,
  Filter,
  Package,
  Layers,
  X,
  RefreshCw,
  ListTodo,
} from 'lucide-react';
import { FullHouseholdDatabase, GroceryItem, Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface GroceryViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const GroceryView: React.FC<GroceryViewProps> = ({ database, onUpdateDatabase }) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const easy = database.settings.easyWording;

  const [activeTab, setActiveTab] = useState<'pantry' | 'checklist'>('pantry');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    urduName: '',
    category: 'Grains & Pulses (Daal/Aata)' as GroceryItem['category'],
    quantity: '10',
    unit: 'kg' as GroceryItem['unit'],
    purchasePrice: '3800',
    purchaseDate: new Date().toISOString().slice(0, 10),
    shopName: 'Imtiaz Super Market',
    remainingStock: '5',
    minStockAlert: '3',
    notes: '',
  });

  // Checklist quick add state
  const [quickChecklistName, setQuickChecklistName] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      urduName: '',
      category: 'Grains & Pulses (Daal/Aata)',
      quantity: '1',
      unit: 'kg',
      purchasePrice: '',
      purchaseDate: new Date().toISOString().slice(0, 10),
      shopName: 'Imtiaz Super Market',
      remainingStock: '1',
      minStockAlert: '0.5',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: GroceryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      urduName: item.urduName || '',
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      purchasePrice: item.purchasePrice.toString(),
      purchaseDate: item.purchaseDate,
      shopName: item.shopName,
      remainingStock: item.remainingStock.toString(),
      minStockAlert: item.minStockAlert.toString(),
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to remove this grocery item?')) {
      const updated = database.groceryItems.filter((g) => g.id !== id);
      onUpdateDatabase({ ...database, groceryItems: updated });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(formData.quantity) || 1;
    const priceNum = parseFloat(formData.purchasePrice) || 0;
    const remNum = parseFloat(formData.remainingStock) || 0;
    const minAlertNum = parseFloat(formData.minStockAlert) || 0;

    if (!formData.name) {
      alert('Please enter product name');
      return;
    }

    if (editingItem) {
      const updated = database.groceryItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formData.name,
              urduName: formData.urduName,
              category: formData.category,
              quantity: qtyNum,
              unit: formData.unit,
              purchasePrice: priceNum,
              purchaseDate: formData.purchaseDate,
              shopName: formData.shopName,
              remainingStock: remNum,
              minStockAlert: minAlertNum,
              notes: formData.notes,
            }
          : item
      );
      onUpdateDatabase({ ...database, groceryItems: updated });
    } else {
      const newItem: GroceryItem = {
        id: `groc_${Date.now()}`,
        name: formData.name,
        urduName: formData.urduName,
        category: formData.category,
        quantity: qtyNum,
        unit: formData.unit,
        purchasePrice: priceNum,
        purchaseDate: formData.purchaseDate,
        shopName: formData.shopName,
        remainingStock: remNum,
        minStockAlert: minAlertNum,
        notes: formData.notes,
      };

      // Also create an expense for the household if price > 0
      const newExpense: Expense = {
        id: `exp_groc_${Date.now()}`,
        date: formData.purchaseDate,
        amount: priceNum,
        category: 'Grocery (Rashan)',
        description: `Grocery Purchase: ${formData.name} (${qtyNum} ${formData.unit})`,
        paymentMethod: 'Cash',
        paidTo: formData.shopName,
        createdAt: new Date().toISOString(),
      };

      onUpdateDatabase({
        ...database,
        groceryItems: [newItem, ...database.groceryItems],
        expenses: priceNum > 0 ? [newExpense, ...database.expenses] : database.expenses,
      });
    }
    setIsModalOpen(false);
  };

  // Quick consume / adjust remaining stock
  const adjustStock = (id: string, delta: number) => {
    const updated = database.groceryItems.map((item) => {
      if (item.id === id) {
        const next = Math.max(0, Math.round((item.remainingStock + delta) * 10) / 10);
        return { ...item, remainingStock: next };
      }
      return item;
    });
    onUpdateDatabase({ ...database, groceryItems: updated });
  };

  // Quick Restock from checklist
  const restockChecklistItem = (item: GroceryItem) => {
    const updated = database.groceryItems.map((g) => {
      if (g.id === item.id) {
        return {
          ...g,
          remainingStock: g.remainingStock + g.quantity,
          isShoppingList: false,
        };
      }
      return g;
    });
    onUpdateDatabase({ ...database, groceryItems: updated });
  };

  // Toggle Shopping List flag
  const toggleShoppingList = (id: string) => {
    const updated = database.groceryItems.map((g) => {
      if (g.id === id) {
        return { ...g, isShoppingList: !g.isShoppingList };
      }
      return g;
    });
    onUpdateDatabase({ ...database, groceryItems: updated });
  };

  // Calculations
  const lowStockItems = database.groceryItems.filter(
    (g) => g.remainingStock <= g.minStockAlert
  );

  const checklistItems = database.groceryItems.filter(
    (g) => g.isShoppingList || g.remainingStock <= g.minStockAlert
  );

  const totalGrocerySpendingAllTime = database.groceryItems.reduce(
    (acc, curr) => acc + curr.purchasePrice,
    0
  );

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthGroceryExpenses = database.expenses
    .filter((e) => e.date.startsWith(currentMonthStr) && (e.category.toLowerCase().includes('grocery') || e.category.toLowerCase().includes('rashan')))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const groceryBudgetLimit =
    database.categoryBudgets.find((cb) => cb.category.toLowerCase().includes('grocery'))?.monthlyLimit || 55000;

  const filteredItems = database.groceryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.urduName && item.urduName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStock = stockFilter === 'all' || item.remainingStock <= item.minStockAlert;

    return matchesSearch && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" />
            {easy ? 'Rashan aur Kitchen Pantry (Grocery Stock)' : 'Grocery & Kitchen Stock Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'Ghar ke rashan ki miqdar, bacha hua stock aur bazaar se lany ki list'
              : 'Pantry inventory, low stock threshold warnings, and automatic shopping checklists'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switcher: Pantry vs Checklist */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('pantry')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'pantry'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Pantry Stock ({database.groceryItems.length})
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'checklist'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 text-amber-500" />
              <span>Shopping Checklist ({checklistItems.length})</span>
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Grocery Item</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Is Maah Ka Rashan Kharcha' : 'This Month Grocery Spend'}
          </span>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {formatCurrency(thisMonthGroceryExpenses, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Budget limit: {formatCurrency(groceryBudgetLimit, currency, symbol)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Khatam Honay Wala Rashan' : 'Low Stock Items Alert'}
          </span>
          <p
            className={`text-2xl font-bold font-mono mt-1 tabular-nums ${
              lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {lowStockItems.length} Item{lowStockItems.length !== 1 ? 's' : ''}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {lowStockItems.length > 0 ? 'Needs refill soon' : 'All stocks adequate'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Bazaar Ki Shopping List' : 'Checklist Items to Buy'}
          </span>
          <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
            {checklistItems.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Ready for next grocery trip</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Total Tracked Items</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {database.groceryItems.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">In pantry database</span>
        </div>
      </div>

      {activeTab === 'pantry' ? (
        <>
          {/* Search & Stock Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 ml-1" />
              <input
                type="text"
                placeholder="Search grocery item, Urdu name, or shop..."
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
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  stockFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setStockFilter('low')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
                  stockFilter === 'low'
                    ? 'bg-rose-600 text-white border-transparent'
                    : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock ({lowStockItems.length})</span>
              </button>
            </div>
          </div>

          {/* Grocery Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b172a] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item Name (Rashan)</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Shop</th>
                    <th className="py-3 px-4 text-center">Remaining Stock</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No grocery items found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isLow = item.remainingStock <= item.minStockAlert;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white block">
                                  {item.name}
                                </span>
                                {item.urduName && (
                                  <span className="text-[11px] text-slate-400 block font-arabic">
                                    {item.urduName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {item.category}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {item.shopName}
                          </td>
                          <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => adjustStock(item.id, -1)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                title="Use 1 unit"
                              >
                                -
                              </button>
                              <span className="font-bold text-slate-900 dark:text-white px-1">
                                {item.remainingStock} {item.unit}
                              </span>
                              <button
                                onClick={() => adjustStock(item.id, +1)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                title="Add 1 unit"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                                <AlertTriangle className="w-3 h-3" />
                                Low ({item.remainingStock} &le; {item.minStockAlert})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                                <CheckCircle2 className="w-3 h-3" />
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                            {formatCurrency(item.purchasePrice, currency, symbol)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => toggleShoppingList(item.id)}
                                className={`p-1 rounded text-xs ${
                                  item.isShoppingList
                                    ? 'text-amber-600 font-bold'
                                    : 'text-slate-400 hover:text-amber-600'
                                }`}
                                title={item.isShoppingList ? 'Remove from Checklist' : 'Add to Checklist'}
                              >
                                <ListTodo className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1 text-slate-400 hover:text-teal-600 rounded"
                                title="Edit Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Shopping Checklist Mode */
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-amber-500" />
                {easy ? 'Bazaar Se Lany Wala Rashan (Checklist)' : 'Smart Grocery Shopping Checklist'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {easy
                  ? 'Khatam hone walay items khud bakhud is list mein shamil ho jatay hain'
                  : 'Items automatically added when stock falls below alert threshold, plus custom checklist additions'}
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {checklistItems.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                Pantry is fully stocked! No items currently needed in shopping checklist.
              </p>
            ) : (
              checklistItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        {item.urduName && (
                          <span className="text-[11px] text-slate-400 font-arabic">
                            ({item.urduName})
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.shopName}
                        </span>
                      </div>
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        Remaining in kitchen: {item.remainingStock} {item.unit} (Alert trigger: &le; {item.minStockAlert})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-600 dark:text-slate-300 text-xs">
                      Refill: {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => restockChecklistItem(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Bought</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Grocery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-500" />
                {editingItem ? 'Edit Grocery Item' : 'Add Pantry / Rashan Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Basmati Rice"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Urdu Name (آسان نام)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. سپر باسمتی چاول"
                    value={formData.urduName}
                    onChange={(e) => setFormData({ ...formData, urduName: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Grains & Pulses (Daal/Aata)">Grains & Pulses (Daal/Aata)</option>
                  <option value="Dairy & Eggs (Doodh/Ande)">Dairy & Eggs (Doodh/Ande)</option>
                  <option value="Cooking Oil & Ghee">Cooking Oil & Ghee</option>
                  <option value="Spices & Masalay">Spices & Masalay</option>
                  <option value="Meat & Chicken (Gosht)">Meat & Chicken (Gosht)</option>
                  <option value="Vegetables & Fruits (Sabzi/Phal)">Vegetables & Fruits (Sabzi/Phal)</option>
                  <option value="Beverages & Tea (Chai/Juice)">Beverages & Tea (Chai/Juice)</option>
                  <option value="Cleaning & Household">Cleaning & Household</option>
                  <option value="Snacks & Bakery">Snacks & Bakery</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purchased Qty *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="gram">gram</option>
                    <option value="liter">liter</option>
                    <option value="ml">ml</option>
                    <option value="packet">packet</option>
                    <option value="dozen">dozen (Darjan)</option>
                    <option value="peti">peti (Crate)</option>
                    <option value="piece">piece</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Price ({symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 2450"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Remaining Stock *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.remainingStock}
                    onChange={(e) => setFormData({ ...formData, remainingStock: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Low Stock Alert Threshold *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Alert when <= this"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shop / Store Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Imtiaz Super Market"
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  {editingItem ? 'Update Grocery Item' : 'Add to Pantry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
