import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Wallet,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  FileText,
  Boxes,
  Wrench,
  Users,
  ChevronRight,
} from 'lucide-react';
import { FullHouseholdDatabase } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface GlobalSearchModalProps {
  database: FullHouseholdDatabase;
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  database,
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const [query, setQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search Results
  const matchingIncomes = q
    ? database.incomes.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.source.toLowerCase().includes(q) ||
          (i.memberName && i.memberName.toLowerCase().includes(q))
      )
    : [];

  const matchingExpenses = q
    ? database.expenses.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.paidTo && e.paidTo.toLowerCase().includes(q))
      )
    : [];

  const matchingShopping = q
    ? database.shoppingTransactions.filter(
        (s) =>
          s.shopName.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.items.some((it) => it.name.toLowerCase().includes(q))
      )
    : [];

  const matchingGrocery = q
    ? database.groceryItems.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.urduName && g.urduName.toLowerCase().includes(q)) ||
          g.shopName.toLowerCase().includes(q)
      )
    : [];

  const matchingBills = q
    ? database.monthlyBills.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.urduName && b.urduName.toLowerCase().includes(q)) ||
          (b.consumerNumber && b.consumerNumber.toLowerCase().includes(q))
      )
    : [];

  const matchingInventory = q
    ? database.inventoryItems.filter(
        (inv) =>
          inv.name.toLowerCase().includes(q) ||
          inv.category.toLowerCase().includes(q) ||
          inv.location.toLowerCase().includes(q)
      )
    : [];

  const matchingMembers = q
    ? database.members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.relation.toLowerCase().includes(q) ||
          m.responsibilities.some((r) => r.toLowerCase().includes(q))
      )
    : [];

  const totalResultsCount =
    matchingIncomes.length +
    matchingExpenses.length +
    matchingShopping.length +
    matchingGrocery.length +
    matchingBills.length +
    matchingInventory.length +
    matchingMembers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-16 sm:pt-24 animate-in fade-in duration-100">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search income, expense, shopping items, rashan, bills, or assets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent border-none focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!query ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Type anything to search across all household tables, receipts, pantry items, and bills.
            </div>
          ) : totalResultsCount === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching records found for "{query}".
            </div>
          ) : (
            <div className="space-y-4">
              {/* Matching Expenses */}
              {matchingExpenses.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    Household Expenses ({matchingExpenses.length})
                  </span>
                  <div className="space-y-1">
                    {matchingExpenses.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          onSelectResult('expenses');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {e.description}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {e.category} · {formatDate(e.date)}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-rose-600">
                          -{formatCurrency(e.amount, currency, symbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Shopping */}
              {matchingShopping.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Shopping Bills & Items ({matchingShopping.length})
                  </span>
                  <div className="space-y-1">
                    {matchingShopping.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onSelectResult('shopping');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {s.shopName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Items: {s.items.map((i) => i.name).join(', ')}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(s.totalAmount, currency, symbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Grocery */}
              {matchingGrocery.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Grocery & Rashan ({matchingGrocery.length})
                  </span>
                  <div className="space-y-1">
                    {matchingGrocery.slice(0, 3).map((g) => (
                      <div
                        key={g.id}
                        onClick={() => {
                          onSelectResult('grocery');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{g.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Stock remaining: {g.remainingStock} {g.unit} · {g.shopName}
                          </p>
                        </div>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(g.purchasePrice, currency, symbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Utility Bills */}
              {matchingBills.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Utility Bills ({matchingBills.length})
                  </span>
                  <div className="space-y-1">
                    {matchingBills.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          onSelectResult('bills');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{b.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Due: {formatDate(b.dueDate)} · Status: {b.status}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(b.remainingAmount, currency, symbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Inventory */}
              {matchingInventory.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-1.5">
                    <Boxes className="w-3.5 h-3.5" />
                    Household Assets ({matchingInventory.length})
                  </span>
                  <div className="space-y-1">
                    {matchingInventory.slice(0, 3).map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => {
                          onSelectResult('inventory');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {inv.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Location: {inv.location} · {inv.condition}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(inv.estimatedCurrentValue || inv.purchasePrice, currency, symbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
