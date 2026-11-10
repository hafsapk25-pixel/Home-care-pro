import { CurrencyCode } from '../types';

export function formatCurrency(amount: number, currency: CurrencyCode = 'PKR', symbol: string = 'Rs.'): string {
  const num = isNaN(amount) ? 0 : amount;
  const formattedNumber = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(num));

  if (currency === 'PKR') {
    return `${symbol} ${formattedNumber}`;
  }
  return `${symbol}${formattedNumber}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getDaysRemaining(dueDateStr: string): { days: number; text: string; isOverdue: boolean } {
  if (!dueDateStr) return { days: 0, text: 'No date', isOverdue: false };
  const target = new Date(dueDateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: Math.abs(diffDays),
      text: `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`,
      isOverdue: true,
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      text: 'Due today',
      isOverdue: false,
    };
  } else {
    return {
      days: diffDays,
      text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
      isOverdue: false,
    };
  }
}

// Easy Roman Urdu & English Vocabulary Map
export const easyWordingDict: Record<string, { en: string; urdu: string; desc: string }> = {
  dashboard: {
    en: 'Main Dashboard',
    urdu: 'Ghar Ka Dashboard',
    desc: 'Kul Aamdani, Kharchay, Bachat aur Bil Ka Mukammal Khulasa',
  },
  income: {
    en: 'Income Management',
    urdu: 'Aamdani Ka Hisaab',
    desc: 'Tankhwah, Karobar, Kiraya aur Aamad Ka Record',
  },
  expenses: {
    en: 'Expense Management',
    urdu: 'Ghar Ke Kharchay',
    desc: 'Har qisam ke kharchay ka alag hisaab kitab',
  },
  savings: {
    en: 'Savings & Goals',
    urdu: 'Bachat aur Kameti',
    desc: 'Aapata Fund, Bank Bachat, Kameti aur Maqasid',
  },
  shopping: {
    en: 'Shopping Manager',
    urdu: 'Kharidari (Kia Cheez Kitny Ki Aayi)',
    desc: 'Shopping item breakdown, Rate aur Rasidain',
  },
  grocery: {
    en: 'Grocery & Rashan',
    urdu: 'Rashan aur Kitchen Pantry',
    desc: 'Ghar Ka Rashan, Bachi Hui Miqdar aur Stock Alert',
  },
  bills: {
    en: 'Monthly Utility Bills',
    urdu: 'Bijli, Gas, Internet Ke Bill',
    desc: 'Mahana Bill, Aakhri Tareekh aur Adaigi Ka Record',
  },
  inventory: {
    en: 'Household Inventory',
    urdu: 'Ghar Ka Saman & Assets',
    desc: 'Electronics, Furniture, Keemat aur Warranty',
  },
  maintenance: {
    en: 'House Maintenance',
    urdu: 'Ghar Ki Marammat',
    desc: 'Plumber, AC Service, Bijli Ka Kaam aur Kharacha',
  },
  members: {
    en: 'Family Members',
    urdu: 'Ghar Ke Afraad',
    desc: 'Khandan ke log, Hissa aur Ghar Ki Zimadarian',
  },
  budget: {
    en: 'Monthly Budget',
    urdu: 'Mahana Budget Limit',
    desc: 'Kharchay ki hadd aur bachi hui raqam ka hisaab',
  },
  reports: {
    en: 'Reports & Analytics',
    urdu: 'Maliyati Reports & Graphs',
    desc: 'Mahana, Salana aur Category ke mutabiq hisaab',
  },
  calendar: {
    en: 'Household Calendar',
    urdu: 'Yaad-Dehani & Calendar',
    desc: 'Bill ki tareekhain, Rashan aur zaroori kaam',
  },
  vault: {
    en: 'Receipts & Documents',
    urdu: 'Rasidain aur Files',
    desc: 'Warranty cards, shopping bills aur zaroori kagazat',
  },
  settings: {
    en: 'Settings & Admin',
    urdu: 'Settings & Database',
    desc: 'Currency, Backup, Theme aur Categories badalna',
  },
};
