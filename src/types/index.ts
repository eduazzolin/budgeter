export interface Period {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  initialBudget: number;
  finalBudget: number;
  currentBalance?: number;
  currentBalanceDate?: string; // YYYY-MM-DD
  balanceHistory?: Record<string, number>; // date YYYY-MM-DD -> balance
  createdAt: string;
  userId?: string;
  sortOrder?: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface BudgetMetrics {
  totalDays: number;
  daysPassed: number;
  daysRemaining: number;
  dailyBudget: number;
  targetBalanceTodayStart: number;
  targetBalanceTodayEnd: number;
  currentProgressPercent: number;
  recordedBalance?: number;
  recordedBalanceDate?: string;
  difference?: number; // currentBalance - targetBalanceTodayStart
  status: 'above' | 'below' | 'neutral';
  isPeriodEnded: boolean;
  isPeriodNotStarted: boolean;
}
