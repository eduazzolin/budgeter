export interface Period {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  initialBudget: number;
  finalBudget: number;
  currentBalance?: number;
  currentBalanceDate?: string; // YYYY-MM-DD
  lastRecordedAt?: string; // ISO string timestamp
  balanceHistory?: Record<string, number>; // date YYYY-MM-DD -> balance
  balanceTimestamps?: Record<string, string>; // date YYYY-MM-DD -> ISO string timestamp
  notes?: string;
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

export interface TimelineDaySegment {
  date: string;
  dayIndex: number;
  isElapsed: boolean;
  expectedBalance: number;
  recordedBalance?: number;
  activeBalance: number;
  margin: number;
  status: 'positive' | 'negative' | 'future';
}

export interface TimelineStats {
  hasRecordedData: boolean;
  positiveDays: number;
  negativeDays: number;
  totalElapsedDays: number;
  positivePercentage: number;
  negativePercentage: number;
  segments: TimelineDaySegment[];
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
  timelineStats: TimelineStats;
}
