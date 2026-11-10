import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Languages,
  Sun,
  Moon,
  Plus,
  Bell,
  Wallet,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  FileText,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { FullHouseholdDatabase } from '../types';
import { formatCurrency, getDaysRemaining } from '../utils/formatters';

interface HeaderProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onQuickAction: (actionType: 'income' | 'expense' | 'shopping' | 'grocery' | 'bill') => void;
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  database,
  onUpdateDatabase,
  onOpenMobileMenu,
  onOpenSearch,
  onQuickAction,
  activeTabTitle,
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const quickMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isDark = database.settings.theme === 'dark';
  const isEasyWording = database.settings.easyWording;

  // Toggle theme
  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    const updated = {
      ...database,
      settings: { ...database.settings, theme: nextTheme as 'light' | 'dark' },
    };
    onUpdateDatabase(updated);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toggle easy wording
  const toggleEasyWording = () => {
    const updated = {
      ...database,
      settings: { ...database.settings, easyWording: !isEasyWording },
    };
    onUpdateDatabase(updated);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target as Node)) {
        setShowQuickMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notifications calculation
  const pendingBills = database.monthlyBills
    .filter((b) => b.status === 'unpaid' || b.status === 'overdue')
    .slice(0, 5);

  const lowStockGroceries = database.groceryItems
    .filter((g) => g.remainingStock <= g.minStockAlert)
    .slice(0, 5);

  const totalNotifs = pendingBills.length + lowStockGroceries.length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/95 dark:bg-[#070e1b]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {/* Left Zone: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-teal-600 dark:text-teal-400">
            HOME CARE PRO
          </span>
          <span className="text-slate-400 dark:text-slate-600 text-xs">/</span>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {activeTabTitle}
          </h2>
        </div>
      </div>

      {/* Right Zone: Search, Language Wording, Theme, Notifications & Quick Action */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg border border-slate-200/70 dark:border-slate-700/60 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search anything...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-500">
            Ctrl+K
          </kbd>
        </button>

        {/* Easy Wording toggle (English / Roman Urdu) */}
        <button
          onClick={toggleEasyWording}
          title={isEasyWording ? 'Switch to Standard English' : 'Switch to Easy Roman Urdu (Asaan Urdu)'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            isEasyWording
              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Languages className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="font-semibold text-[11px]">
            {isEasyWording ? 'آسان اردو' : 'Easy Urdu'}
          </span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {totalNotifs > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                {totalNotifs}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-teal-500" />
                  Household Alerts ({totalNotifs})
                </span>
                <span className="text-[11px] text-slate-500">Live household reminders</span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {pendingBills.length === 0 && lowStockGroceries.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">
                    No pending alerts! All household bills and grocery stocks are clear.
                  </p>
                ) : (
                  <>
                    {pendingBills.map((b) => {
                      const rem = getDaysRemaining(b.dueDate);
                      return (
                        <div
                          key={b.id}
                          className="flex items-start justify-between p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-xs"
                        >
                          <div className="flex items-start gap-2">
                            <Clock className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {b.name}
                              </p>
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                {rem.text} · Due on {b.dueDate}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-300">
                            {formatCurrency(b.totalAmount, database.settings.currency, database.settings.currencySymbol)}
                          </span>
                        </div>
                      );
                    })}

                    {lowStockGroceries.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-start justify-between p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {g.name}
                            </p>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400">
                              Stock remaining: {g.remainingStock} {g.unit} (Alert threshold: {g.minStockAlert})
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                          Low Stock
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Menu */}
        <div className="relative" ref={quickMenuRef}>
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-lg shadow-sm shadow-teal-700/20 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Record</span>
          </button>

          {showQuickMenu && (
            <div className="absolute right-0 mt-2 w-52 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 animate-in fade-in duration-100">
              <button
                onClick={() => {
                  onQuickAction('income');
                  setShowQuickMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg text-left"
              >
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span>Add Income (Aamdani)</span>
              </button>

              <button
                onClick={() => {
                  onQuickAction('expense');
                  setShowQuickMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg text-left"
              >
                <Receipt className="w-4 h-4 text-rose-500" />
                <span>Add Expense (Kharcha)</span>
              </button>

              <button
                onClick={() => {
                  onQuickAction('shopping');
                  setShowQuickMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg text-left"
              >
                <ShoppingBag className="w-4 h-4 text-sky-500" />
                <span>Log Shopping Bill</span>
              </button>

              <button
                onClick={() => {
                  onQuickAction('grocery');
                  setShowQuickMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg text-left"
              >
                <ShoppingCart className="w-4 h-4 text-amber-500" />
                <span>Add Grocery / Rashan</span>
              </button>

              <button
                onClick={() => {
                  onQuickAction('bill');
                  setShowQuickMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg text-left"
              >
                <FileText className="w-4 h-4 text-violet-500" />
                <span>Add Utility Bill</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
