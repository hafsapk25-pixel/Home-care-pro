export type CurrencyCode = 'PKR' | 'USD' | 'EUR' | 'AED' | 'SAR' | 'GBP';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToPKR: number; // For conversion if user toggles
}

export interface Income {
  id: string;
  date: string;
  amount: number;
  source: string; // 'Salary' | 'Business' | 'Rental' | 'Freelance' | 'Remittance' | 'Other'
  description: string;
  paymentMethod: string; // 'Bank Transfer' | 'Cash' | 'JazzCash' | 'EasyPaisa' | 'Cheque'
  memberId?: string;
  memberName?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string; // 'Food & Dining' | 'Electricity' | 'Gas' | 'Water' | 'Internet' | 'Shopping' | 'Grocery' | 'Medical' | 'Education' | 'Transport' | 'Maintenance' | 'Clothing' | 'Entertainment' | 'Other'
  description: string;
  paymentMethod: string;
  paidTo?: string; // Shop, vendor, or utility company
  memberId?: string;
  memberName?: string;
  receiptUrl?: string; // Data URL or reference
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: 'Emergency Fund' | 'Bank Savings' | 'Cash in Hand' | 'Gold / Kameti' | 'Home Improvement' | 'Hajj / Umrah' | 'Vehicle' | 'General';
  targetDate: string;
  notes?: string;
  createdAt: string;
}

export interface SavingsAdjustment {
  id: string;
  date: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  goalId?: string;
  account: string; // 'Meezan Bank' | 'HBL' | 'Cash in Safe' | 'Kameti'
  notes: string;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number; // Rate per item ("Kitny ki aayi")
  totalPrice: number; // quantity * unitPrice
  notes?: string;
}

export interface ShoppingTransaction {
  id: string;
  date: string;
  shopName: string;
  category: string; // 'Clothing' | 'Electronics' | 'Home Decor' | 'Kitchenware' | 'Kids & Toys' | 'Other'
  paymentMethod: string;
  totalAmount: number;
  items: ShoppingItem[];
  receiptImage?: string;
  notes?: string;
  createdAt: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  urduName?: string;
  category: 'Grains & Pulses (Daal/Aata)' | 'Dairy & Eggs (Doodh/Ande)' | 'Cooking Oil & Ghee' | 'Spices & Masalay' | 'Meat & Chicken (Gosht)' | 'Vegetables & Fruits (Sabzi/Phal)' | 'Beverages & Tea (Chai/Juice)' | 'Cleaning & Household' | 'Snacks & Bakery' | 'Other';
  quantity: number;
  unit: 'kg' | 'gram' | 'liter' | 'ml' | 'packet' | 'dozen' | 'peti' | 'can' | 'piece';
  purchasePrice: number; // Purchase price
  purchaseDate: string;
  shopName: string;
  remainingStock: number;
  minStockAlert: number;
  isShoppingList?: boolean; // In shopping checklist
  notes?: string;
}

export interface MonthlyBill {
  id: string;
  name: string;
  urduName?: string;
  billType: 'electricity' | 'gas' | 'water' | 'internet' | 'mobile' | 'rent' | 'school_fee' | 'maintenance' | 'other';
  billingMonth: string; // YYYY-MM
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  paymentDate?: string;
  paymentMethod?: string;
  consumerNumber?: string;
  billAttachment?: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Furniture' | 'Electronics' | 'Kitchen Appliances' | 'Kitchen Utensils' | 'Bedroom Items' | 'Bathroom Items' | 'Cleaning Equipment' | 'Clothes & Linen' | 'Decorations' | 'Home Appliances' | 'Tools & Hardware' | 'Other';
  quantity: number;
  purchaseDate: string;
  purchasePrice: number;
  estimatedCurrentValue: number;
  condition: 'Brand New' | 'Excellent' | 'Good' | 'Fair' | 'Needs Repair';
  location: 'Living Lounge' | 'Master Bedroom' | 'Kids Bedroom' | 'Kitchen' | 'Drawing Room' | 'Store Room' | 'Roof & Terrace' | 'Garage & Garden';
  warrantyDetails?: string;
  warrantyExpiryDate?: string;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  category: 'Plumbing' | 'Electrical' | 'Painting' | 'Furniture Repair' | 'AC Maintenance' | 'Deep Cleaning' | 'Appliance Repair' | 'Carpentry' | 'Roof & Water Tank' | 'Other';
  status: 'scheduled' | 'in_progress' | 'completed';
  scheduledDate: string;
  completedDate?: string;
  serviceProvider: string;
  providerPhone?: string;
  cost: number;
  nextMaintenanceDate?: string;
  notes?: string;
  createdAt: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  relation: 'Head of Family' | 'Spouse' | 'Father' | 'Mother' | 'Son' | 'Daughter' | 'Brother' | 'Sister' | 'Other';
  contact: string;
  role: 'Admin' | 'Family Member' | 'Viewer';
  monthlyContribution: number;
  responsibilities: string[];
  avatarColor: string;
}

export interface CategoryBudget {
  category: string;
  monthlyLimit: number;
}

export interface HouseholdReminder {
  id: string;
  title: string;
  date: string;
  time?: string;
  priority: 'low' | 'medium' | 'high';
  type: 'bill' | 'grocery' | 'maintenance' | 'event' | 'custom';
  completed: boolean;
  notes?: string;
}

export interface ReceiptDocument {
  id: string;
  title: string;
  category: 'Shopping Receipt' | 'Grocery Bill' | 'Electricity Bill' | 'Gas Bill' | 'Water Bill' | 'Warranty Card' | 'Property Document' | 'Other Document';
  uploadDate: string;
  fileData: string; // Base64 data URL
  fileName: string;
  fileSize: string;
  notes?: string;
}

export interface AppSettings {
  currency: CurrencyCode;
  currencySymbol: string;
  easyWording: boolean; // True: Shows "Kia cheez kitny ki aayi", Roman Urdu + English labels
  dateFormat: string;
  totalMonthlyBudget: number;
  theme: 'light' | 'dark';
  customExpenseCategories: string[];
  customIncomeSources: string[];
  customShoppingCategories: string[];
  adminPinEnabled: boolean;
  adminPin: string;
}

export interface FullHouseholdDatabase {
  incomes: Income[];
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  savingsAdjustments: SavingsAdjustment[];
  shoppingTransactions: ShoppingTransaction[];
  groceryItems: GroceryItem[];
  monthlyBills: MonthlyBill[];
  inventoryItems: InventoryItem[];
  maintenanceTasks: MaintenanceTask[];
  members: HouseholdMember[];
  categoryBudgets: CategoryBudget[];
  reminders: HouseholdReminder[];
  receiptDocuments: ReceiptDocument[];
  settings: AppSettings;
}
