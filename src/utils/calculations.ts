import type { Period, BudgetMetrics } from '../types';

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formats a Date object into YYYY-MM-DD string in local time.
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates the number of calendar days between two dates inclusive.
 */
export const getCalendarDaysBetween = (startStr: string, endStr: string): number => {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  
  const oneDay = 24 * 60 * 60 * 1000;
  
  // Use UTC to avoid daylight saving hour shifts
  const utc1 = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utc2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  
  // End date is inclusive, so we add 1 day
  return Math.round((utc2 - utc1) / oneDay) + 1;
};

/**
 * Calculates all metrics for a given period based on a reference date (defaults to today).
 */
export const calculateBudgetMetrics = (period: Period, referenceDateStr?: string): BudgetMetrics => {
  const todayStr = referenceDateStr || getLocalDateString();
  
  const totalDays = Math.max(1, getCalendarDaysBetween(period.startDate, period.endDate));
  const dailyBudget = (period.initialBudget - period.finalBudget) / totalDays;
  
  const isPeriodNotStarted = todayStr < period.startDate;
  const isPeriodEnded = todayStr > period.endDate;
  
  let daysPassed = 0;
  let daysRemaining = totalDays;
  
  if (isPeriodNotStarted) {
    daysPassed = 0;
    daysRemaining = totalDays;
  } else if (isPeriodEnded) {
    daysPassed = totalDays;
    daysRemaining = 0;
  } else {
    daysPassed = getCalendarDaysBetween(period.startDate, todayStr);
    daysRemaining = totalDays - daysPassed;
  }
  
  // Progress percent based on days passed
  const currentProgressPercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
  
  // Target balance for TODAY
  // Start of day d (1-indexed) is the balance at start of day
  // End of day d is the balance at end of day
  // If period hasn't started or has ended, targets are initial or final budget respectively.
  let targetBalanceTodayStart = period.initialBudget;
  let targetBalanceTodayEnd = period.initialBudget;
  
  if (!isPeriodNotStarted && !isPeriodEnded) {
    targetBalanceTodayStart = period.initialBudget - (daysPassed - 1) * dailyBudget;
    targetBalanceTodayEnd = period.initialBudget - daysPassed * dailyBudget;
  } else if (isPeriodEnded) {
    targetBalanceTodayStart = period.finalBudget;
    targetBalanceTodayEnd = period.finalBudget;
  }

  // Calculate stats for the recorded balance
  // If the user recorded a balance, we compare it with the targets of the day it was recorded!
  let difference: number | undefined;
  let status: 'above' | 'below' | 'neutral' = 'neutral';
  
  if (period.currentBalance !== undefined && period.currentBalanceDate) {
    const recDate = period.currentBalanceDate;
    
    if (recDate < period.startDate) {
      // Recorded before start
      difference = period.currentBalance - period.initialBudget;
    } else if (recDate > period.endDate) {
      // Recorded after end
      difference = period.currentBalance - period.finalBudget;
    } else {
      // Recorded during period
      const recDaysPassed = getCalendarDaysBetween(period.startDate, recDate);
      // Compare to the target at the start of that day
      const targetAtRecStart = period.initialBudget - (recDaysPassed - 1) * dailyBudget;
      difference = period.currentBalance - targetAtRecStart;
    }
    
    if (difference > 0.01) {
      status = 'above';
    } else if (difference < -0.01) {
      status = 'below';
    } else {
      status = 'neutral';
    }
  }

  return {
    totalDays,
    daysPassed,
    daysRemaining,
    dailyBudget,
    targetBalanceTodayStart,
    targetBalanceTodayEnd,
    currentProgressPercent,
    recordedBalance: period.currentBalance,
    recordedBalanceDate: period.currentBalanceDate,
    difference,
    status,
    isPeriodEnded,
    isPeriodNotStarted
  };
};
