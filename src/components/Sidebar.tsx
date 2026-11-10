import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PiggyBank,
  ShoppingBag,
  ShoppingCart,
  FileText,
  Boxes,
  Wrench,
  Users,
  Target,
  BarChart3,
  Calendar,
  FolderLock,
  Settings,
  ShieldCheck,
  ChevronRight,
  X,
  Home,
} from 'lucide-react';
import { FullHouseholdDatabase } from '../types';
import { easyWordingDict } from '../utils/formatters';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  database: FullHouseholdDatabase;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  database,
  isOpen,
  onClose,
}) => {
  const easy = database.settings.easyWording;

  // Calculate live badge alerts
  const pendingBillsCount = database.monthlyBills.filter(
    (b) => b.status === 'unpaid' || b.status === 'overdue'
  ).length;

  const lowStockCount = database.groceryItems.filter(
    (g) => g.remainingStock <= g.minStockAlert
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: easy ? easyWordingDict.dashboard.urdu : easyWordingDict.dashboard.en,
      sublabel: easy ? 'Dashboard & Summary' : undefined,
      icon: LayoutDashboard,
    },
    {
      id: 'income',
      label: easy ? easyWordingDict.income.urdu : easyWordingDict.income.en,
      sublabel: easy ? 'Salary, Business & Rent' : undefined,
      icon: Wallet,
    },
    {
      id: 'expenses',
      label: easy ? easyWordingDict.expenses.urdu : easyWordingDict.expenses.en,
      sublabel: easy ? 'All Household Expenses' : undefined,
      icon: Receipt,
    },
    {
      id: 'savings',
      label: easy ? easyWordingDict.savings.urdu : easyWordingDict.savings.en,
      sublabel: easy ? 'Emergency & Goals' : undefined,
      icon: PiggyBank,
    },
    {
      id: 'shopping',
      label: easy ? 'Kharidari (Kia Cheez Kitny Ki)' : easyWordingDict.shopping.en,
      sublabel: easy ? 'Itemized Shopping & Receipts' : undefined,
      icon: ShoppingBag,
    },
    {
      id: 'grocery',
      label: easy ? easyWordingDict.grocery.urdu : easyWordingDict.grocery.en,
      sublabel: easy ? 'Pantry & Rashan Stock' : undefined,
      icon: ShoppingCart,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'text-amber-400 bg-amber-400/10',
    },
    {
      id: 'bills',
      label: easy ? easyWordingDict.bills.urdu : easyWordingDict.bills.en,
      sublabel: easy ? 'Electricity, Gas & WiFi' : undefined,
      icon: FileText,
      badge: pendingBillsCount > 0 ? `${pendingBillsCount} Due` : undefined,
      badgeColor: 'text-rose-400 bg-rose-500/10',
    },
    {
      id: 'inventory',
      label: easy ? easyWordingDict.inventory.urdu : easyWordingDict.inventory.en,
      sublabel: easy ? 'Appliances & Assets' : undefined,
      icon: Boxes,
    },
    {
      id: 'maintenance',
      label: easy ? easyWordingDict.maintenance.urdu : easyWordingDict.maintenance.en,
      sublabel: easy ? 'Repairs & Services' : undefined,
      icon: Wrench,
    },
    {
      id: 'members',
      label: easy ? easyWordingDict.members.urdu : easyWordingDict.members.en,
      sublabel: easy ? 'Family Roles & Chores' : undefined,
      icon: Users,
    },
    {
      id: 'budget',
      label: easy ? easyWordingDict.budget.urdu : easyWordingDict.budget.en,
      sublabel: easy ? 'Monthly Spending Limits' : undefined,
      icon: Target,
    },
    {
      id: 'reports',
      label: easy ? easyWordingDict.reports.urdu : easyWordingDict.reports.en,
      sublabel: easy ? 'Income vs Expense Analytics' : undefined,
      icon: BarChart3,
    },
    {
      id: 'calendar',
      label: easy ? easyWordingDict.calendar.urdu : easyWordingDict.calendar.en,
      sublabel: easy ? 'Due Dates & Schedule' : undefined,
      icon: Calendar,
    },
    {
      id: 'vault',
      label: easy ? easyWordingDict.vault.urdu : easyWordingDict.vault.en,
      sublabel: easy ? 'Document & Bill Storage' : undefined,
      icon: FolderLock,
    },
    {
      id: 'settings',
      label: easy ? easyWordingDict.settings.urdu : easyWordingDict.settings.en,
      sublabel: easy ? 'Currency, Backup & Custom' : undefined,
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-[#091528] text-slate-200 border-r border-[#152744] transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#152744] bg-[#07101f]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white shadow-lg shadow-teal-500/20">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                HOME CARE PRO
              </h1>
              <p className="text-[11px] text-teal-400 font-medium tracking-wide">
                Smart Home System · PKR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-300 tracking-wider">
            HOUSEHOLD NAVIGATION
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40 font-semibold'
                    : 'text-slate-300 hover:bg-[#13233c] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                    }`}
                  />
                  <div className="text-left truncate">
                    <span className="block truncate">{item.label}</span>
                    {item.sublabel && (
                      <span
                        className={`block text-[10px] truncate ${
                          isActive ? 'text-teal-100 font-normal' : 'text-slate-400'
                        }`}
                      >
                        {item.sublabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Profile & Status */}
        <div className="p-3.5 border-t border-[#152744] bg-[#07101f]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#0d1d36] border border-[#1b3155]">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 font-bold text-xs">
              HP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {database.members[0]?.name || 'Family Admin'}
              </p>
              <p className="text-[11px] text-teal-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified System Admin</span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
