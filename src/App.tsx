import React, { useState, useEffect } from 'react';
import { getDatabase, saveDatabase, subscribeDatabase } from './utils/storage';
import { FullHouseholdDatabase } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { IncomeView } from './components/IncomeView';
import { ExpensesView } from './components/ExpensesView';
import { SavingsView } from './components/SavingsView';
import { ShoppingView } from './components/ShoppingView';
import { GroceryView } from './components/GroceryView';
import { BillsView } from './components/BillsView';
import { InventoryView } from './components/InventoryView';
import { MaintenanceView } from './components/MaintenanceView';
import { MembersView } from './components/MembersView';
import { BudgetView } from './components/BudgetView';
import { ReportsView } from './components/ReportsView';
import { CalendarView } from './components/CalendarView';
import { ReceiptsVaultView } from './components/ReceiptsVaultView';
import { SettingsView } from './components/SettingsView';
import { GlobalSearchModal } from './components/GlobalSearchModal';

export default function App() {
  const [database, setDatabase] = useState<FullHouseholdDatabase>(getDatabase());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = subscribeDatabase(() => {
      setDatabase({ ...getDatabase() });
    });
    return () => unsubscribe();
  }, []);

  // Sync theme
  useEffect(() => {
    if (database.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [database.settings.theme]);

  // Global Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdateDatabase = (updated: FullHouseholdDatabase) => {
    saveDatabase(updated);
    setDatabase({ ...updated });
  };

  const handleQuickAction = (
    actionType: 'income' | 'expense' | 'shopping' | 'grocery' | 'bill'
  ) => {
    if (actionType === 'income') setActiveTab('income');
    else if (actionType === 'expense') setActiveTab('expenses');
    else if (actionType === 'shopping') setActiveTab('shopping');
    else if (actionType === 'grocery') setActiveTab('grocery');
    else if (actionType === 'bill') setActiveTab('bills');
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return database.settings.easyWording ? 'Ghar Ka Dashboard' : 'Household Dashboard';
      case 'income':
        return database.settings.easyWording ? 'Aamdani Ka Hisaab' : 'Income Management';
      case 'expenses':
        return database.settings.easyWording ? 'Ghar Ke Kharchay' : 'Expense Management';
      case 'savings':
        return database.settings.easyWording ? 'Bachat aur Kameti' : 'Savings & Goals';
      case 'shopping':
        return database.settings.easyWording ? 'Kharidari (Kia Cheez Kitny Ki)' : 'Shopping Management';
      case 'grocery':
        return database.settings.easyWording ? 'Rashan & Kitchen Stock' : 'Grocery & Kitchen Stock';
      case 'bills':
        return database.settings.easyWording ? 'Bijli, Gas, Internet Ke Bill' : 'Monthly Bills';
      case 'inventory':
        return database.settings.easyWording ? 'Ghar Ka Saman & Assets' : 'Household Inventory';
      case 'maintenance':
        return database.settings.easyWording ? 'Ghar Ki Marammat' : 'House Maintenance';
      case 'members':
        return database.settings.easyWording ? 'Ghar Ke Afraad' : 'Family Members';
      case 'budget':
        return database.settings.easyWording ? 'Mahana Budget Limit' : 'Budget Management';
      case 'reports':
        return database.settings.easyWording ? 'Maliyati Reports' : 'Reports & Analytics';
      case 'calendar':
        return database.settings.easyWording ? 'Household Calendar' : 'Household Calendar';
      case 'vault':
        return database.settings.easyWording ? 'Rasidain aur Files' : 'Receipts & Documents';
      case 'settings':
        return database.settings.easyWording ? 'System Settings' : 'Settings & Admin';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-500 selection:text-white flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        database={database}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 transition-all">
        {/* Top Header */}
        <Header
          database={database}
          onUpdateDatabase={handleUpdateDatabase}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onQuickAction={handleQuickAction}
          activeTabTitle={getTabTitle()}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              database={database}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onQuickAction={handleQuickAction}
            />
          )}

          {activeTab === 'income' && (
            <IncomeView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'savings' && (
            <SavingsView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'shopping' && (
            <ShoppingView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'grocery' && (
            <GroceryView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'bills' && (
            <BillsView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'inventory' && (
            <InventoryView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'members' && (
            <MembersView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'budget' && (
            <BudgetView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'reports' && <ReportsView database={database} />}

          {activeTab === 'calendar' && (
            <CalendarView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'vault' && (
            <ReceiptsVaultView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}

          {activeTab === 'settings' && (
            <SettingsView database={database} onUpdateDatabase={handleUpdateDatabase} />
          )}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        database={database}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
