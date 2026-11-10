import React, { useState } from 'react';
import {
  Settings,
  Globe,
  DollarSign,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Plus,
  Shield,
  Palette,
  CheckCircle2,
  Layers,
  Languages,
} from 'lucide-react';
import { FullHouseholdDatabase, CurrencyCode } from '../types';
import { exportDatabaseBackup, importDatabaseBackup, resetDatabaseToDefaults } from '../utils/storage';

interface SettingsViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ database, onUpdateDatabase }) => {
  const easy = database.settings.easyWording;

  const [newExpCategory, setNewExpCategory] = useState('');
  const [newIncSource, setNewIncSource] = useState('');
  const [newShopCategory, setNewShopCategory] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Currency change
  const handleCurrencyChange = (code: CurrencyCode) => {
    let symbol = 'Rs.';
    if (code === 'USD') symbol = '$';
    else if (code === 'EUR') symbol = '€';
    else if (code === 'AED') symbol = 'AED';
    else if (code === 'SAR') symbol = 'SAR';
    else if (code === 'GBP') symbol = '£';
    else if (code === 'PKR') symbol = 'Rs.';

    onUpdateDatabase({
      ...database,
      settings: { ...database.settings, currency: code, currencySymbol: symbol },
    });
    showToast(`Currency changed to ${code} (${symbol})`);
  };

  // Wording toggle
  const toggleWording = () => {
    onUpdateDatabase({
      ...database,
      settings: { ...database.settings, easyWording: !database.settings.easyWording },
    });
    showToast(`Language set to ${!database.settings.easyWording ? 'Easy Urdu / Bilingual' : 'Standard English'}`);
  };

  // Theme change
  const handleThemeChange = (theme: 'light' | 'dark') => {
    onUpdateDatabase({
      ...database,
      settings: { ...database.settings, theme },
    });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Add Expense Category
  const handleAddExpenseCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpCategory.trim()) return;
    if (database.settings.customExpenseCategories.includes(newExpCategory.trim())) {
      alert('Category already exists');
      return;
    }
    const updated = [newExpCategory.trim(), ...database.settings.customExpenseCategories];
    onUpdateDatabase({
      ...database,
      settings: { ...database.settings, customExpenseCategories: updated },
    });
    setNewExpCategory('');
    showToast('Expense category added');
  };

  const handleDeleteExpenseCategory = (cat: string) => {
    if (database.settings.customExpenseCategories.length <= 1) return;
    const updated = database.settings.customExpenseCategories.filter((c) => c !== cat);
    onUpdateDatabase({
      ...database,
      settings: { ...database.settings, customExpenseCategories: updated },
    });
    showToast('Category removed');
  };

  // Add Income Source
  const handleAddIncomeSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncSource.trim()) return;
    const updated = [newIncSource.trim(), ...database.settings.customIncomeSources];
    onUpdateDatabase({
      ...database,
      settings: { ...database.settings, customIncomeSources: updated },
    });
    setNewIncSource('');
    showToast('Income source added');
  };

  const handleDeleteIncomeSource = (source: string) => {
    if (database.settings.customIncomeSources.length <= 1) return;
    const updated = database.settings.customIncomeSources.filter((s) => s !== source);
    onUpdateDatabase({
      ...database,
      settings: { ...database.settings, customIncomeSources: updated },
    });
    showToast('Income source removed');
  };

  // Backup & Restore
  const handleBackup = () => {
    exportDatabaseBackup();
    showToast('Database JSON backup downloaded');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = importDatabaseBackup(content);
          if (success) {
            showToast('Database restored successfully!');
            setTimeout(() => window.location.reload(), 1000);
          } else {
            alert('Failed to parse backup JSON file.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'Reset database to initial Pakistani household sample data (Karachi/Lahore scenario)?'
      )
    ) {
      resetDatabaseToDefaults();
      showToast('Database reset to defaults');
      setTimeout(() => window.location.reload(), 500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl shadow-lg text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-600" />
          {easy ? 'System Settings & Customization' : 'System Settings & Customization'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {easy
            ? 'Currency, Roman Urdu Wording, Categories, Backup aur Database Control'
            : 'Configure currency, UI wording, custom expense categories, JSON backups, and system reset'}
        </p>
      </div>

      {/* Section 1: Regional & Currency Configuration */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-teal-600" />
          <span>Currency & Regional Localization</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Active Currency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['PKR', 'USD', 'EUR', 'AED', 'SAR', 'GBP'] as CurrencyCode[]).map((c) => (
                <button
                  key={c}
                  onClick={() => handleCurrencyChange(c)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                    database.settings.currency === c
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {c} {c === 'PKR' ? '(Rs.)' : ''}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Default for Pakistani households: PKR (₨ / Rs.)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Language & Subtitle Mode
            </label>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {database.settings.easyWording ? 'Easy Urdu / Bilingual' : 'Standard English'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Includes "Kia cheez kitny ki aayi", "Rashan", "Bijli Bill" subtitles
                  </span>
                </div>
                <button
                  onClick={toggleWording}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    database.settings.easyWording
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {database.settings.easyWording ? 'Enabled ✓' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Custom Categories Manager */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-teal-600" />
          <span>Custom Expense & Income Categories</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expense Categories */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Expense Categories ({database.settings.customExpenseCategories.length})
            </label>
            <form onSubmit={handleAddExpenseCategory} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="New category name..."
                value={newExpCategory}
                onChange={(e) => setNewExpCategory(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                + Add
              </button>
            </form>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {database.settings.customExpenseCategories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs"
                >
                  <span className="text-slate-800 dark:text-slate-200">{cat}</span>
                  <button
                    onClick={() => handleDeleteExpenseCategory(cat)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Income Sources */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Income Sources ({database.settings.customIncomeSources.length})
            </label>
            <form onSubmit={handleAddIncomeSource} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="New income source..."
                value={newIncSource}
                onChange={(e) => setNewIncSource(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                + Add
              </button>
            </form>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {database.settings.customIncomeSources.map((source) => (
                <div
                  key={source}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs"
                >
                  <span className="text-slate-800 dark:text-slate-200">{source}</span>
                  <button
                    onClick={() => handleDeleteIncomeSource(source)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Data Backup, Restore & Reset */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-teal-600" />
          <span>Database Backup, Restore & Reset</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Export JSON Backup</h4>
            <p className="text-[11px] text-slate-500">
              Download complete household transactions, items, and bills file.
            </p>
            <button
              onClick={handleBackup}
              className="w-full py-2 px-3 text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-lg flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Restore From Backup</h4>
            <p className="text-[11px] text-slate-500">
              Upload previously saved JSON backup to restore all data.
            </p>
            <label className="w-full py-2 px-3 text-xs font-semibold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Backup File</span>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Reload Starter Data</h4>
            <p className="text-[11px] text-slate-500">
              Reset database to Pakistani household starter scenario.
            </p>
            <button
              onClick={handleResetToDefaults}
              className="w-full py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
