import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  MapPin,
  ShieldCheck,
  Calendar,
  Layers,
  X,
  Sparkles,
  Tag,
} from 'lucide-react';
import { FullHouseholdDatabase, InventoryItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InventoryViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ database, onUpdateDatabase }) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const easy = database.settings.easyWording;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Home Appliances' as InventoryItem['category'],
    quantity: '1',
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchasePrice: '',
    estimatedCurrentValue: '',
    condition: 'Excellent' as InventoryItem['condition'],
    location: 'Master Bedroom' as InventoryItem['location'],
    warrantyDetails: '',
    warrantyExpiryDate: '',
    notes: '',
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Home Appliances',
      quantity: '1',
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchasePrice: '',
      estimatedCurrentValue: '',
      condition: 'Excellent',
      location: 'Master Bedroom',
      warrantyDetails: '',
      warrantyExpiryDate: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      purchaseDate: item.purchaseDate,
      purchasePrice: item.purchasePrice.toString(),
      estimatedCurrentValue: item.estimatedCurrentValue.toString(),
      condition: item.condition,
      location: item.location,
      warrantyDetails: item.warrantyDetails || '',
      warrantyExpiryDate: item.warrantyExpiryDate || '',
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Delete this household asset from inventory?')) {
      const updated = database.inventoryItems.filter((i) => i.id !== id);
      onUpdateDatabase({ ...database, inventoryItems: updated });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(formData.quantity) || 1;
    const priceNum = parseFloat(formData.purchasePrice) || 0;
    const currentValNum = parseFloat(formData.estimatedCurrentValue) || priceNum;

    if (!formData.name) {
      alert('Please enter item name');
      return;
    }

    if (editingItem) {
      const updated = database.inventoryItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formData.name,
              category: formData.category,
              quantity: qtyNum,
              purchaseDate: formData.purchaseDate,
              purchasePrice: priceNum,
              estimatedCurrentValue: currentValNum,
              condition: formData.condition,
              location: formData.location,
              warrantyDetails: formData.warrantyDetails,
              warrantyExpiryDate: formData.warrantyExpiryDate,
              notes: formData.notes,
            }
          : item
      );
      onUpdateDatabase({ ...database, inventoryItems: updated });
    } else {
      const newItem: InventoryItem = {
        id: `inv_${Date.now()}`,
        name: formData.name,
        category: formData.category,
        quantity: qtyNum,
        purchaseDate: formData.purchaseDate,
        purchasePrice: priceNum,
        estimatedCurrentValue: currentValNum,
        condition: formData.condition,
        location: formData.location,
        warrantyDetails: formData.warrantyDetails,
        warrantyExpiryDate: formData.warrantyExpiryDate,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
      };
      onUpdateDatabase({
        ...database,
        inventoryItems: [newItem, ...database.inventoryItems],
      });
    }
    setIsModalOpen(false);
  };

  // Calculations
  const totalValuation = database.inventoryItems.reduce(
    (acc, curr) => acc + (curr.estimatedCurrentValue || curr.purchasePrice),
    0
  );
  const totalOriginalCost = database.inventoryItems.reduce(
    (acc, curr) => acc + curr.purchasePrice,
    0
  );

  const locations = [
    'Living Lounge',
    'Master Bedroom',
    'Kids Bedroom',
    'Kitchen',
    'Drawing Room',
    'Store Room',
    'Roof & Terrace',
    'Garage & Garden',
  ];

  const categories = [
    'Furniture',
    'Electronics',
    'Kitchen Appliances',
    'Kitchen Utensils',
    'Bedroom Items',
    'Bathroom Items',
    'Cleaning Equipment',
    'Clothes & Linen',
    'Decorations',
    'Home Appliances',
    'Tools & Hardware',
    'Other',
  ];

  const filteredItems = database.inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLoc = selectedLocation === 'All' || item.location === selectedLocation;
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;

    return matchesSearch && matchesLoc && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            {easy ? 'Ghar Ka Saman & Assets (Household Inventory)' : 'Household Inventory & Asset Valuation'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'Electronics, Furniture, Kitchen aur har kamray ke saman ki keemat aur warranty'
              : 'Complete catalog of household appliances, furniture valuation, locations, and warranties'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Household Asset</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Ghar Ke Saman Ki Mojooda Maliyat' : 'Total Asset Valuation'}
          </span>
          <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {formatCurrency(totalValuation, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Original cost: {formatCurrency(totalOriginalCost, currency, symbol)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Registered Household Items</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {database.inventoryItems.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {new Set(database.inventoryItems.map((i) => i.location)).size} rooms
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Warranties Under Active Cover</span>
          <p className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1 tabular-nums">
            {database.inventoryItems.filter((i) => i.warrantyExpiryDate).length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">With registered claim cards</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search appliance, furniture, room location..."
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
          {/* Location filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="All">All Rooms & Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="All">All Asset Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Location: {item.location}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1">
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
              </div>

              {/* Valuation & Condition */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimated Current Value:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {formatCurrency(item.estimatedCurrentValue || item.purchasePrice, currency, symbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Purchased Price:</span>
                  <span className="font-mono">{formatCurrency(item.purchasePrice, currency, symbol)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500">Condition:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.condition}
                  </span>
                </div>
              </div>

              {item.warrantyDetails && (
                <div className="mt-2.5 p-2 rounded-lg bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-900/30 text-[11px] text-teal-900 dark:text-teal-300 flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block">{item.warrantyDetails}</span>
                    {item.warrantyExpiryDate && (
                      <span className="text-teal-600 dark:text-teal-400">
                        Valid until: {formatDate(item.warrantyExpiryDate)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {item.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 px-1">
                  {item.notes}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Qty: {item.quantity}</span>
              <span>Purchased: {formatDate(item.purchaseDate)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-600" />
                {editingItem ? 'Edit Asset Record' : 'Add Household Asset'}
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
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Haier 1.5T DC Inverter AC"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Price ({symbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 155000"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Worth / Valuation ({symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Estimated market value"
                    value={formData.estimatedCurrentValue}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedCurrentValue: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location in House *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    {locations.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Repair">Needs Repair</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Warranty Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Years Compressor"
                    value={formData.warrantyDetails}
                    onChange={(e) => setFormData({ ...formData, warrantyDetails: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Warranty Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.warrantyExpiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, warrantyExpiryDate: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Model Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Model HSU-18HFP, with surge protector"
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {editingItem ? 'Save Changes' : 'Record Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
