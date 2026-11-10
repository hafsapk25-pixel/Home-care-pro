import { FullHouseholdDatabase } from '../types';
import { initialHouseholdData } from './initialData';

const STORAGE_KEY = 'home_care_pro_database_v1';

// In-memory cache
let cachedDb: FullHouseholdDatabase | null = null;
const listeners = new Set<() => void>();

export function getDatabase(): FullHouseholdDatabase {
  if (cachedDb) return cachedDb;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all arrays and settings exist
      cachedDb = {
        ...initialHouseholdData,
        ...parsed,
        settings: { ...initialHouseholdData.settings, ...(parsed.settings || {}) },
      };
      return cachedDb!;
    }
  } catch (err) {
    console.error('Failed to read database from localStorage:', err);
  }

  // Fallback to initial Pakistani household data
  cachedDb = JSON.parse(JSON.stringify(initialHouseholdData));
  saveDatabase(cachedDb!);
  return cachedDb!;
}

export function saveDatabase(db: FullHouseholdDatabase): void {
  cachedDb = db;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Failed to save database to localStorage:', err);
  }
  // Notify listeners
  listeners.forEach((callback) => {
    try {
      callback();
    } catch (e) {
      console.error('Listener callback error:', e);
    }
  });
}

export function subscribeDatabase(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function exportDatabaseBackup(): void {
  const db = getDatabase();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `HOME_CARE_PRO_BACKUP_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importDatabaseBackup(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') return false;

    // Validate that it has at least some keys
    const validDb: FullHouseholdDatabase = {
      ...initialHouseholdData,
      ...parsed,
      settings: { ...initialHouseholdData.settings, ...(parsed.settings || {}) },
    };
    saveDatabase(validDb);
    return true;
  } catch (err) {
    console.error('Failed to parse imported JSON:', err);
    return false;
  }
}

export function resetDatabaseToDefaults(): void {
  const fresh = JSON.parse(JSON.stringify(initialHouseholdData));
  saveDatabase(fresh);
}

export function clearDatabase(): void {
  const blank: FullHouseholdDatabase = {
    ...initialHouseholdData,
    incomes: [],
    expenses: [],
    savingsGoals: [],
    savingsAdjustments: [],
    shoppingTransactions: [],
    groceryItems: [],
    monthlyBills: [],
    inventoryItems: [],
    maintenanceTasks: [],
    reminders: [],
    receiptDocuments: [],
  };
  saveDatabase(blank);
}
