import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Period } from '../types';
import { calculateBudgetMetrics, parseLocalDate, getLocalDateString, getCalendarDaysBetween } from '../utils/calculations';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Info, 
  AlertTriangle, 
  Trash2, 
  AlertCircle, 
  Calculator, 
  ArrowLeft,
  GitCompare,
  X
} from 'lucide-react';
import { 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { PeriodNotes } from './PeriodNotes';

interface PeriodDetailProps {
  period: Period;
  periods?: Period[];
  onRecordBalance: (id: string, balance: number, date: string) => Promise<void>;
  onDeleteBalance: (id: string, date: string) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
}

export const PeriodDetail: React.FC<PeriodDetailProps> = ({
  period,
  periods = [],
  onRecordBalance,
  onDeleteBalance,
  onUpdateNotes
}) => {
  const metrics = calculateBudgetMetrics(period);
  const [balanceInput, setBalanceInput] = useState('');
  const [balanceDate, setBalanceDate] = useState('');
  const [comparedPeriodId, setComparedPeriodId] = useState<string | null>(null);
  const [showCompareDropdown, setShowCompareDropdown] = useState(false);
  const [chartMode, setChartMode] = useState<'margin' | 'balance'>('margin');
  const compareDropdownRef = useRef<HTMLDivElement>(null);
  const comparePanelRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [showChartHelp, setShowChartHelp] = useState(false);
  const showProjection = metrics.difference !== undefined && metrics.difference < 0;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [deleteTargetDate, setDeleteTargetDate] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcExpression, setCalcExpression] = useState('');
  const calcInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteClick = (dateStr: string) => {
    setDeleteTargetDate(dateStr);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetDate) return;
    try {
      setDeleting(true);
      await onDeleteBalance(period.id, deleteTargetDate);
      setDeleteTargetDate(null);
    } catch (error) {
      console.error('Error deleting balance:', error);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set default values when selected period ID changes
  useEffect(() => {
    setBalanceInput(period.currentBalance !== undefined ? period.currentBalance.toString() : '');
    
    // Set default date to today, but clamped to period bounds if today is outside the period
    const today = getLocalDateString();
    if (today < period.startDate) {
      setBalanceDate(period.startDate);
    } else if (today > period.endDate) {
      setBalanceDate(period.endDate);
    } else {
      setBalanceDate(today);
    }
    setSuccessMsg(false);

    // If active period becomes the compared period, clear comparison
    if (comparedPeriodId === period.id) {
      setComparedPeriodId(null);
    }
  }, [period.id, comparedPeriodId]);

  // Close compare dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideButton = compareDropdownRef.current?.contains(target);
      const clickedInsidePanel = comparePanelRef.current?.contains(target);
      if (!clickedInsideButton && !clickedInsidePanel) {
        setShowCompareDropdown(false);
      }
    };
    if (showCompareDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCompareDropdown]);

  // Auto focus the calculator input when opened
  useEffect(() => {
    if (showCalculator) {
      setCalcExpression('');
      setTimeout(() => {
        calcInputRef.current?.focus();
      }, 100);
    }
  }, [showCalculator]);

  // Derived state: calculate result and validity on the fly during render for the calculator expression
  let calcResult: number | null = null;
  let calcIsValid = true;

  const trimmedExpression = calcExpression.trim();

  if (trimmedExpression !== '') {
    const sanitized = trimmedExpression.replace(/,/g, '.');
    const safePattern = /^[0-9+\-*/().\s]+$/;
    
    if (!safePattern.test(sanitized)) {
      calcIsValid = false;
    } else {
      try {
        const evalFn = new Function(`return (${sanitized})`);
        const val = evalFn();
        
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          calcResult = val;
        } else {
          calcIsValid = false;
        }
      } catch {
        calcIsValid = false;
      }
    }
  }

  const handleInsertOperator = (op: string) => {
    const input = calcInputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? calcExpression.length;
    const end = input.selectionEnd ?? calcExpression.length;
    const value = calcExpression;

    const newValue = value.substring(0, start) + op + value.substring(end);
    setCalcExpression(newValue);

    setTimeout(() => {
      input.focus();
      const newCursorPos = start + op.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(balanceInput.replace(/,/g, '.'));
    if (isNaN(balance)) return;

    try {
      setSubmitting(true);
      await onRecordBalance(period.id, balance, balanceDate);
      setSuccessMsg(true);
      setBalanceInput(balance.toFixed(2));
      setTimeout(() => setSuccessMsg(false), 6000);
    } catch (error) {
      console.error('Error saving balance:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCalcBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calcResult === null || !calcIsValid) return;

    const balance = Math.round(calcResult * 100) / 100;

    try {
      setSubmitting(true);
      await onRecordBalance(period.id, balance, balanceDate);
      setSuccessMsg(true);
      setCalcExpression('');
      setBalanceInput(balance.toFixed(2));
      setTimeout(() => setSuccessMsg(false), 6000);
    } catch (error) {
      console.error('Error saving balance:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatCurrencyNoCents = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatShortDate = (dateStr: string) => {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };

  const getWeekdayShort = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    const weekdays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    return weekdays[date.getDay()];
  };

  // Comparison logic setup
  const availablePeriods = periods.filter(p => p.id !== period.id);
  const compPeriod = comparedPeriodId ? periods.find(p => p.id === comparedPeriodId) || null : null;
  const compMetrics = compPeriod ? calculateBudgetMetrics(compPeriod) : null;

  // Prepare chart data (Gasto Zero Assumption)
  const start = parseLocalDate(period.startDate);
  
  // 1. Encontra o último saldo real registrado no período atual
  let lastRecordedDayIndex = -1;
  let lastRecordedBalance: number | null = null;

  for (let i = 0; i < metrics.totalDays; i++) {
    const nextDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dateStr = getLocalDateString(nextDate);
    
    const actualBalance = period.balanceHistory?.[dateStr];
    if (actualBalance !== undefined) {
      lastRecordedDayIndex = i;
      lastRecordedBalance = actualBalance;
    }
  }

  // Data do último saldo real registrado
  const historyDates = Object.keys(period.balanceHistory || {})
    .filter((d) => period.balanceHistory?.[d] !== undefined)
    .sort();
  const lastRecordedDate = historyDates.length > 0
    ? historyDates[historyDates.length - 1]
    : (period.currentBalanceDate || null);

  // Encontra o último saldo real registrado no período comparado (se ativo)
  let compStart: Date | null = null;
  let compLastRecordedDayIndex = -1;
  let compLastRecordedBalance: number | null = null;

  if (compPeriod && compMetrics) {
    compStart = parseLocalDate(compPeriod.startDate);
    for (let i = 0; i < compMetrics.totalDays; i++) {
      const nextDate = new Date(compStart.getFullYear(), compStart.getMonth(), compStart.getDate() + i);
      const dateStr = getLocalDateString(nextDate);
      const actualBalance = compPeriod.balanceHistory?.[dateStr];
      if (actualBalance !== undefined) {
        compLastRecordedDayIndex = i;
        compLastRecordedBalance = actualBalance;
      }
    }
  }

  // 2. Build the chart data array
  const chartData: any[] = [];

  if (!compPeriod || !compMetrics || !compStart) {
    // Standard single period view: chronological order of current period days
    for (let i = 0; i < metrics.totalDays; i++) {
      const nextDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const dateStr = getLocalDateString(nextDate);
      const expectedBalance = period.initialBudget - i * metrics.dailyBudget;
      const actualBalance = period.balanceHistory?.[dateStr];

      let projectedBalance: number | null = null;
      if (lastRecordedBalance !== null && i >= lastRecordedDayIndex) {
        projectedBalance = lastRecordedBalance;
      }

      const margemReal = actualBalance !== undefined ? actualBalance - expectedBalance : null;
      const margemProjetada = projectedBalance !== null ? projectedBalance - expectedBalance : null;

      chartData.push({
        dayIndex: i + 1,
        date: formatShortDate(dateStr),
        dayLabel: `Dia ${i + 1} (${formatShortDate(dateStr)})`,
        dateStr,
        Esperado: 0,
        Real: margemReal !== null ? parseFloat(margemReal.toFixed(2)) : null,
        Projetado: margemProjetada !== null ? parseFloat(margemProjetada.toFixed(2)) : null,
        _rawEsperado: expectedBalance,
        _rawReal: actualBalance,
        _rawProjetado: projectedBalance,
      });
    }
  } else {
    // Comparison mode: align by day of month (e.g. Dia 5 of September with Dia 5 of August)
    interface DayDataEntry {
      dateStr: string;
      dayOfMonth: number;
      expectedBalance: number;
      actualBalance?: number;
      projectedBalance: number | null;
      margemReal: number | null;
      margemProjetada: number | null;
    }

    const p1ByDay = new Map<number, DayDataEntry>();
    const p1DaysOrder: number[] = [];

    for (let i = 0; i < metrics.totalDays; i++) {
      const nextDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const dateStr = getLocalDateString(nextDate);
      const dayOfMonth = nextDate.getDate();
      const expectedBalance = period.initialBudget - i * metrics.dailyBudget;
      const actualBalance = period.balanceHistory?.[dateStr];

      let projectedBalance: number | null = null;
      if (lastRecordedBalance !== null && i >= lastRecordedDayIndex) {
        projectedBalance = lastRecordedBalance;
      }

      const margemReal = actualBalance !== undefined ? actualBalance - expectedBalance : null;
      const margemProjetada = projectedBalance !== null ? projectedBalance - expectedBalance : null;

      p1ByDay.set(dayOfMonth, {
        dateStr,
        dayOfMonth,
        expectedBalance,
        actualBalance,
        projectedBalance,
        margemReal,
        margemProjetada
      });
      p1DaysOrder.push(dayOfMonth);
    }

    const p2ByDay = new Map<number, DayDataEntry>();
    const p2DaysOrder: number[] = [];

    for (let j = 0; j < compMetrics.totalDays; j++) {
      const compNextDate = new Date(compStart.getFullYear(), compStart.getMonth(), compStart.getDate() + j);
      const compDateStr = getLocalDateString(compNextDate);
      const dayOfMonth = compNextDate.getDate();
      const expBal = compPeriod.initialBudget - j * compMetrics.dailyBudget;
      const compActualBalance = compPeriod.balanceHistory?.[compDateStr];

      let compProjectedBalance: number | null = null;
      if (compLastRecordedBalance !== null && j >= compLastRecordedDayIndex) {
        compProjectedBalance = compLastRecordedBalance;
      }

      const compMargemReal = compActualBalance !== undefined ? compActualBalance - expBal : null;
      const compMargemProjetada = compProjectedBalance !== null ? compProjectedBalance - expBal : null;

      p2ByDay.set(dayOfMonth, {
        dateStr: compDateStr,
        dayOfMonth,
        expectedBalance: expBal,
        actualBalance: compActualBalance,
        projectedBalance: compProjectedBalance,
        margemReal: compMargemReal,
        margemProjetada: compMargemProjetada
      });
      p2DaysOrder.push(dayOfMonth);
    }

    // Determine ordered days of month:
    // If current period stays within a single calendar month, sort 1..31.
    // If it spans across months (e.g. 20th to 19th), follow period 1's chronological cycle.
    const end = parseLocalDate(period.endDate);
    const p1CrossesMonth = start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear();

    let orderedDays: number[] = [];

    if (!p1CrossesMonth) {
      const allDays = new Set<number>([...p1ByDay.keys(), ...p2ByDay.keys()]);
      orderedDays = Array.from(allDays).sort((a, b) => a - b);
    } else {
      orderedDays = [...p1DaysOrder];
      for (const d of p2DaysOrder) {
        if (!orderedDays.includes(d)) {
          const prevIdx = orderedDays.indexOf(d - 1);
          if (prevIdx !== -1) {
            orderedDays.splice(prevIdx + 1, 0, d);
          } else {
            orderedDays.push(d);
          }
        }
      }
    }

    for (const dayOfMonth of orderedDays) {
      const p1 = p1ByDay.get(dayOfMonth);
      const p2 = p2ByDay.get(dayOfMonth);

      chartData.push({
        dayIndex: dayOfMonth,
        date: `Dia ${dayOfMonth}`,
        dayLabel: `Dia ${dayOfMonth} do mês`,
        dateStr: p1?.dateStr || '',
        compDateStr: p2?.dateStr || '',
        Esperado: 0,
        Real: p1?.margemReal != null ? parseFloat(p1.margemReal.toFixed(2)) : null,
        Projetado: p1?.margemProjetada != null ? parseFloat(p1.margemProjetada.toFixed(2)) : null,
        _rawEsperado: p1?.expectedBalance ?? null,
        _rawReal: p1?.actualBalance ?? null,
        _rawProjetado: p1?.projectedBalance ?? null,

        // Comparison fields (Margem)
        compReal: p2?.margemReal != null ? parseFloat(p2.margemReal.toFixed(2)) : null,
        compProjetado: p2?.margemProjetada != null ? parseFloat(p2.margemProjetada.toFixed(2)) : null,
        _compRawEsperado: p2?.expectedBalance ?? null,
        _compRawReal: p2?.actualBalance ?? null,
        _compRawProjetado: p2?.projectedBalance ?? null,

        // Balance fields (Saldo Real)
        balance1: p1?.actualBalance !== undefined ? p1.actualBalance : null,
        expectedBalance1: p1?.expectedBalance != null ? parseFloat(p1.expectedBalance.toFixed(2)) : null,
        balance2: p2?.actualBalance !== undefined ? p2.actualBalance : null,
        expectedBalance2: p2?.expectedBalance != null ? parseFloat(p2.expectedBalance.toFixed(2)) : null
      });
    }
  }

  // 3. Find min/max values to calculate a fixed YAxis domain and split gradient
  let yAxisMin = 0;
  let yAxisMax = 0;
  let yTicks: number[] = [];

  if (chartMode === 'margin') {
    let maxMargin = 0;
    let minMargin = 0;
    chartData.forEach((d: any) => {
      if (d.Real !== null) {
        if (d.Real > maxMargin) maxMargin = d.Real;
        if (d.Real < minMargin) minMargin = d.Real;
      }
      if (showProjection && d.Projetado !== null) {
        if (d.Projetado > maxMargin) maxMargin = d.Projetado;
        if (d.Projetado < minMargin) minMargin = d.Projetado;
      }
      if (d.compReal !== null) {
        if (d.compReal > maxMargin) maxMargin = d.compReal;
        if (d.compReal < minMargin) minMargin = d.compReal;
      }
      if (d.compProjetado !== null) {
        if (d.compProjetado > maxMargin) maxMargin = d.compProjetado;
        if (d.compProjetado < minMargin) minMargin = d.compProjetado;
      }
    });

    const maxAbsMargin = Math.max(Math.abs(maxMargin), Math.abs(minMargin), 10);
    const targetHalf = maxAbsMargin / 2;
    const exponent = Math.floor(Math.log10(targetHalf));
    const fraction = targetHalf / Math.pow(10, exponent);
    let niceFraction = 10;
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 2.5) niceFraction = 2.5;
    else if (fraction <= 5) niceFraction = 5;

    const niceStep = niceFraction * Math.pow(10, exponent);
    yAxisMax = niceStep * 2;
    yAxisMin = -yAxisMax;
    yTicks = [-yAxisMax, -niceStep, 0, niceStep, yAxisMax];
  } else {
    // Saldo Real mode - single unified scale for both periods
    let maxVal = Math.max(period.initialBudget, compPeriod ? compPeriod.initialBudget : 0);
    let minVal = 0;

    chartData.forEach((d: any) => {
      if (d.balance1 !== null && d.balance1 !== undefined) {
        if (d.balance1 > maxVal) maxVal = d.balance1;
        if (d.balance1 < minVal) minVal = d.balance1;
      }
      if (d.balance2 !== null && d.balance2 !== undefined) {
        if (d.balance2 > maxVal) maxVal = d.balance2;
        if (d.balance2 < minVal) minVal = d.balance2;
      }
      if (d.expectedBalance1 !== null && d.expectedBalance1 !== undefined) {
        if (d.expectedBalance1 > maxVal) maxVal = d.expectedBalance1;
        if (d.expectedBalance1 < minVal) minVal = d.expectedBalance1;
      }
      if (d.expectedBalance2 !== null && d.expectedBalance2 !== undefined) {
        if (d.expectedBalance2 > maxVal) maxVal = d.expectedBalance2;
        if (d.expectedBalance2 < minVal) minVal = d.expectedBalance2;
      }
    });

    const paddedMax = Math.ceil((maxVal * 1.1) / 100) * 100;
    const paddedMin = minVal < 0 ? Math.floor((minVal * 1.1) / 100) * 100 : 0;
    yAxisMax = paddedMax || 1000;
    yAxisMin = paddedMin;
    const step = (yAxisMax - yAxisMin) / 4;
    yTicks = [
      Math.round(yAxisMin), 
      Math.round(yAxisMin + step), 
      Math.round(yAxisMin + step * 2), 
      Math.round(yAxisMin + step * 3), 
      Math.round(yAxisMax)
    ];
  }

  // Calculate precise gradient offsets for the fill (Area) and stroke (Line)
  // because SVG gradients default to objectBoundingBox which is relative to the drawn path, not the axes.
  let dataMaxReal = -Infinity;
  let dataMinReal = Infinity;
  chartData.forEach((d: any) => {
    if (d.Real !== null) {
      if (d.Real > dataMaxReal) dataMaxReal = d.Real;
      if (d.Real < dataMinReal) dataMinReal = d.Real;
    }
  });
  if (dataMaxReal === -Infinity) { dataMaxReal = 0; dataMinReal = 0; }

  const areaMax = Math.max(0, dataMaxReal);
  const areaMin = Math.min(0, dataMinReal);
  let fillOffset = areaMax === areaMin ? 0 : areaMax / (areaMax - areaMin);
  fillOffset = Math.max(0, Math.min(1, fillOffset));

  const strokeMax = dataMaxReal;
  const strokeMin = dataMinReal;
  let strokeOffset = strokeMax === strokeMin ? 0 : strokeMax / (strokeMax - strokeMin);
  strokeOffset = Math.max(0, Math.min(1, strokeOffset));

  // Helper to extract numeric value from Recharts props (which might be an array [baseline, value] for Area)
  const getRealValue = (props: any) => {
    const { value, payload } = props;
    if (payload && payload.Real !== undefined && payload.Real !== null) {
      return payload.Real;
    }
    if (Array.isArray(value)) {
      return value[1];
    }
    return value;
  };

  // Custom dots for the Area chart to avoid mixing gradient colors
  const renderCustomDot = (props: any) => {
    const { cx, cy } = props;
    if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
    const val = getRealValue(props);
    if (val === null || val === undefined || isNaN(val)) return null;
    const isPositive = val >= 0;
    return (
      <circle 
        key={`dot-${cx}-${cy}`} 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill="#fff" 
        stroke={isPositive ? 'var(--color-above)' : 'var(--color-below)'} 
        strokeWidth={2} 
      />
    );
  };

  const renderActiveDot = (props: any) => {
    const { cx, cy } = props;
    if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
    const val = getRealValue(props);
    if (val === null || val === undefined || isNaN(val)) return null;
    const isPositive = val >= 0;
    return (
      <circle 
        key={`active-dot-${cx}-${cy}`} 
        cx={cx} 
        cy={cy} 
        r={6} 
        fill="#fff" 
        stroke={isPositive ? 'var(--color-above)' : 'var(--color-below)'} 
        strokeWidth={2} 
      />
    );
  };


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formatCurrencyVal = (val: number | null | undefined) => 
        val != null ? `R$ ${val.toFixed(2)}` : '-';
        
      return (
        <div style={{ 
          backgroundColor: 'var(--card-bg)', 
          borderRadius: '8px', 
          border: '1px solid var(--card-border)', 
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)', 
          padding: '12px',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-family, "Inter", sans-serif)',
          minWidth: compPeriod ? '240px' : 'auto'
        }}>
          <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '6px', marginBottom: '8px' }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
              {compPeriod ? `${data.dayLabel}` : label}
            </p>
            {compPeriod && (data.dateStr || data.compDateStr) && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '2px 0 0 0' }}>
                {data.dateStr ? `${period.name}: ${formatDate(data.dateStr)}` : ''}
                {data.dateStr && data.compDateStr ? ' • ' : ''}
                {data.compDateStr ? `${compPeriod.name}: ${formatDate(data.compDateStr)}` : ''}
              </p>
            )}
          </div>

          {compPeriod ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Current Period */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-above)', display: 'inline-block' }} />
                  <span>{period.name} (Atual)</span>
                </div>
                <div style={{ paddingLeft: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {chartMode === 'margin' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span>Margem:</span>
                        <strong style={{ color: data.Real != null ? (data.Real >= 0 ? 'var(--color-above)' : 'var(--color-below)') : 'var(--text-muted)' }}>
                          {data.Real !== null ? formatCurrencyVal(data.Real) : '-'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span>Saldo Real:</span>
                        <span>{formatCurrencyVal(data._rawReal)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span>Saldo Real:</span>
                        <strong style={{ color: data.balance1 != null ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {formatCurrencyVal(data.balance1)}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span>Saldo Esperado:</span>
                        <span>{formatCurrencyVal(data.expectedBalance1)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Compared Period */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem', color: '#3b82f6' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', background: '#3b82f6', display: 'inline-block' }} />
                  <span>{compPeriod.name} (Comparado)</span>
                </div>
                <div style={{ paddingLeft: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {chartMode === 'margin' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span>Margem:</span>
                        <strong style={{ color: data.compReal != null ? (data.compReal >= 0 ? 'var(--color-above)' : 'var(--color-below)') : 'var(--text-muted)' }}>
                          {data.compReal !== null ? formatCurrencyVal(data.compReal) : '-'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span>Saldo Real:</span>
                        <span>{formatCurrencyVal(data._compRawReal)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span>Saldo Real:</span>
                        <strong style={{ color: data.balance2 != null ? '#3b82f6' : 'var(--text-muted)' }}>
                          {formatCurrencyVal(data.balance2)}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span>Saldo Esperado:</span>
                        <span>{formatCurrencyVal(data.expectedBalance2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Delta between values */}
              {chartMode === 'margin' && data.Real !== null && data.compReal !== null && (
                <div style={{ 
                  paddingTop: '6px', 
                  marginTop: '2px', 
                  borderTop: '1px solid var(--card-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Diferença de Margem:</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: (data.Real - data.compReal) >= 0 ? 'var(--color-above)' : 'var(--color-below)' 
                  }}>
                    {(data.Real - data.compReal) >= 0 ? '+' : ''}{formatCurrencyVal(data.Real - data.compReal)}
                  </span>
                </div>
              )}

              {chartMode === 'balance' && data.balance1 !== null && data.balance2 !== null && (
                <div style={{ 
                  paddingTop: '6px', 
                  marginTop: '2px', 
                  borderTop: '1px solid var(--card-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Diferença de Saldo:</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: (data.balance1 - data.balance2) >= 0 ? 'var(--color-above)' : 'var(--color-below)' 
                  }}>
                    {(data.balance1 - data.balance2) >= 0 ? '+' : ''}{formatCurrencyVal(data.balance1 - data.balance2)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span>Margem Real:</span>
                <span style={{ fontWeight: 600 }}>{data.Real !== null ? formatCurrencyVal(data.Real) : '-'}</span>
              </div>

              {showProjection && data.Projetado !== null && data.Real === null && (
                <div style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <span>Margem Projetada:</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrencyVal(data.Projetado)}</span>
                </div>
              )}
              
              <div style={{ 
                marginTop: '6px', 
                paddingTop: '6px', 
                borderTop: '1px solid var(--card-border)',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '4px',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <span>Saldo Real Absoluto:</span>
                  <span>{formatCurrencyVal(data._rawReal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <span>Saldo Esperado Absoluto:</span>
                  <span>{formatCurrencyVal(data._rawEsperado)}</span>
                </div>
                {showProjection && data._rawProjetado !== null && data._rawReal === undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <span>Saldo Projetado Absoluto:</span>
                    <span>{formatCurrencyVal(data._rawProjetado)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Period Header */}
      <div className="animate-in">
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(90deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          {period.name}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} /> {formatDate(period.startDate)} até {formatDate(period.endDate)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} /> {metrics.totalDays} dias
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={16} /> {formatCurrency(period.initialBudget)}
          </span>
        </div>
      </div>



      {/* SECTION 1: Record Current Balance (Moved Up for Quick Access) */}
      <div className="glass animate-in delay-100" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} style={{ color: 'var(--color-primary)' }} /> Registrar Saldo Real
          </h3>
          <button
            type="button"
            onClick={() => setShowCalculator(!showCalculator)}
            className="calculator-btn-trigger"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: isMobile ? '8px' : '4px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: 'var(--border-radius-sm)',
              transition: 'all 0.2s ease',
              outline: 'none',
              minWidth: isMobile ? '36px' : 'auto',
              height: isMobile ? '36px' : 'auto'
            }}
            title={showCalculator ? "Voltar para o formulário padrão" : "Usar calculadora de saldo"}
          >
            {showCalculator ? (
              <>
                <ArrowLeft size={isMobile ? 18 : 13} />
                {!isMobile && "Registro Padrão"}
              </>
            ) : (
              <>
                <Calculator size={isMobile ? 18 : 13} />
                {!isMobile && "Calculadora"}
              </>
            )}
          </button>
        </div>

        {!showCalculator ? (
          <form onSubmit={handleBalanceSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 200px' }}>
              <label className="form-label">Saldo Real (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="Ex: 850.00"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <label className="form-label">Data de Registro</label>
              <input
                type="date"
                className="input-field"
                min={period.startDate}
                max={period.endDate}
                value={balanceDate}
                onChange={(e) => setBalanceDate(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ height: '46px', flex: '1 1 150px' }}
              disabled={submitting || !balanceInput}
            >
              {submitting ? 'Salvando...' : successMsg ? 'Registrado!' : 'Marcar Saldo'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCalcBalanceSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 200px' }}>
              <label className="form-label">Expressão Matemática</label>
              <input
                ref={calcInputRef}
                type="text"
                inputMode="decimal"
                className="input-field"
                style={{ 
                  fontFamily: 'monospace',
                  border: !calcIsValid ? '1px solid var(--color-below)' : '1px solid var(--card-border)',
                  outline: 'none'
                }}
                placeholder="Ex: 800 + 450 - 120"
                value={calcExpression}
                onChange={(e) => setCalcExpression(e.target.value)}
                disabled={submitting}
                required
              />
              
              {/* Operators shortcut bar (always visible on both desktop and mobile in calculator view) */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {['+', '-', '*', '/', '(', ')'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => handleInsertOperator(op)}
                    className="calculator-btn-trigger"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '3px 8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      borderRadius: 'var(--border-radius-sm)',
                      transition: 'all 0.1s ease',
                      userSelect: 'none'
                    }}
                  >
                    {op}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCalcExpression('')}
                  className="calculator-btn-trigger"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--color-below)',
                    cursor: 'pointer',
                    padding: '3px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: 'var(--border-radius-sm)',
                    transition: 'all 0.1s ease',
                    userSelect: 'none',
                    marginLeft: 'auto'
                  }}
                >
                  Limpar
                </button>
              </div>
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <label className="form-label">Data de Registro</label>
              <input
                type="date"
                className="input-field"
                min={period.startDate}
                max={period.endDate}
                value={balanceDate}
                onChange={(e) => setBalanceDate(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ height: '46px', flex: '1 1 150px' }}
              disabled={submitting || calcResult === null || !calcIsValid}
            >
              {submitting ? 'Salvando...' : successMsg ? 'Registrado!' : 'Marcar Saldo'}
            </button>

            {calcExpression.trim() !== '' && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                <div 
                  className="animate-in"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    padding: '6px 12px', 
                    borderRadius: 'var(--border-radius-sm)', 
                    border: '1px solid var(--card-border)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {!calcIsValid ? (
                    <span style={{ color: 'var(--color-below)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={14} /> Fórmula inválida ou incompleta
                    </span>
                  ) : calcResult !== null ? (
                    <>
                      <span style={{ color: 'var(--text-secondary)' }}>Resultado calculado:</span>
                      <strong style={{ color: 'var(--color-above)', fontFamily: 'Outfit, sans-serif' }}>
                        {formatCurrency(calcResult)}
                      </strong>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </form>
        )}

        {lastRecordedDate && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', marginBottom: '-6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', opacity: 0.75 }}>
              Último registro: {formatDate(lastRecordedDate)}
            </span>
          </div>
        )}

      </div>

      {/* SECTION 3: Grid of Main KPIs */}
      <div className="kpi-cards-grid animate-in delay-200">
        
        {/* Budget Goals Card */}
        <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {(() => {
            let predictedNormalizationDate: Date | null = null;
            let isZeroSpendAssumption = false;
            let showWarning = false;
            const currentDiff = metrics.difference;
            
            if (lastRecordedBalance !== null && currentDiff !== undefined && currentDiff < 0) {
              const end = parseLocalDate(period.endDate);
              
              // Sempre calcula baseando-se em gasto ZERO a partir de agora, conforme solicitado pelo usuário.
              const recoveryRateZero = metrics.dailyBudget; // O quanto a diferença melhora por dia sem gastos
              if (recoveryRateZero > 0) {
                const daysToNormalizeZero = Math.ceil(Math.abs(currentDiff) / recoveryRateZero);
                const predictedDayIndexZero = lastRecordedDayIndex + daysToNormalizeZero;
                const zeroSpendProjectedDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + predictedDayIndexZero);
                
                if (zeroSpendProjectedDate <= end) {
                  predictedNormalizationDate = zeroSpendProjectedDate;
                  isZeroSpendAssumption = true;
                } else {
                  showWarning = true;
                }
              } else {
                showWarning = true;
              }
            }

            return (
              <>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Margem
                </span>
                <div style={{ margin: '12px 0' }}>
                  <span className="font-display" style={{ 
                    fontSize: '2.2rem', 
                    fontWeight: 800, 
                    lineHeight: 1.1,
                    color: metrics.status === 'above' ? 'var(--color-above)' : metrics.status === 'below' ? 'var(--color-below)' : 'var(--text-primary)',
                    display: 'block'
                  }}>
                    {metrics.difference !== undefined ? (metrics.difference > 0 ? '+' : '') + formatCurrency(metrics.difference) : '—'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: (predictedNormalizationDate || showWarning) ? '12px' : '0' }}>
                  Estimativa: {formatCurrency(metrics.dailyBudget)}/dia
                </p>
                {(predictedNormalizationDate || showWarning) && (
                  <div style={{ 
                    marginTop: 'auto',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: showWarning 
                      ? 'rgba(239, 68, 68, 0.15)' 
                      : isZeroSpendAssumption 
                        ? 'rgba(234, 179, 8, 0.15)' 
                        : 'rgba(56, 189, 248, 0.1)',
                    fontSize: '0.75rem',
                    color: showWarning 
                      ? '#ef4444' 
                      : isZeroSpendAssumption 
                        ? '#eab308' 
                        : 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    flexWrap: 'wrap'
                  }}>
                    {showWarning ? (
                      <>
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} /> 
                        <span>Complicou, a previsão diz que o saldo não terá alta.</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp size={14} style={{ flexShrink: 0 }} /> 
                        <span>
                          Previsão de alta: {formatShortDate(getLocalDateString(predictedNormalizationDate!))} ({predictedNormalizationDate!.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toLowerCase()})
                          {isZeroSpendAssumption && (
                            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'normal', opacity: 0.9, marginTop: '2px', color: 'var(--text-secondary)' }}>
                              *Se não houver mais gastos até lá.
                            </span>
                          )}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Daily Spending Card */}
        <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Valores totais
          </span>
          <div style={{ margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Esperado
              </span>
              <span className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {formatCurrency(metrics.targetBalanceTodayStart)}
              </span>
            </div>
            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Saldo Real
              </span>
              <span className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {metrics.recordedBalance !== undefined ? formatCurrency(metrics.recordedBalance) : '—'}
              </span>
            </div>
            <div style={{ borderTop: '3px double var(--card-border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Total Gasto
              </span>
              <span className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {metrics.recordedBalance !== undefined ? formatCurrency(period.initialBudget - metrics.recordedBalance) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown Card */}
        <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Contagem Regressiva
            </span>
          </div>

          <div style={{ margin: '12px 0' }}>
            {metrics.isPeriodNotStarted ? (
              <div>
                <span className="font-display" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-neutral)', lineHeight: 1.1, display: 'block' }}>
                  A Iniciar
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Período começa em breve
                </p>
              </div>
            ) : metrics.isPeriodEnded ? (
              <div>
                <span className="font-display" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-muted)', lineHeight: 1.1, display: 'block' }}>
                  Finalizado
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Contador encerrado ({metrics.totalDays} dias)
                </p>
              </div>
            ) : (
              <div>
                <span className="font-display" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {metrics.daysRemaining}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                  dias restantes
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {metrics.daysPassed} de {metrics.totalDays} dias decorridos
                </p>
              </div>
            )}

            {/* Positive vs Negative Percentage Stats */}
            {metrics.timelineStats.hasRecordedData && metrics.timelineStats.totalElapsedDays > 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: '8px', 
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid var(--card-border)',
                fontSize: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ 
                    width: '7px', 
                    height: '7px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--color-above)', 
                    display: 'inline-block',
                    flexShrink: 0
                  }} />
                  <span style={{ color: 'var(--color-above)', fontWeight: 700 }}>
                    {metrics.timelineStats.positivePercentage}% Positivo
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    ({metrics.timelineStats.positiveDays}d)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ 
                    width: '7px', 
                    height: '7px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--color-below)', 
                    display: 'inline-block',
                    flexShrink: 0
                  }} />
                  <span style={{ color: 'var(--color-below)', fontWeight: 700 }}>
                    {metrics.timelineStats.negativePercentage}% Negativo
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    ({metrics.timelineStats.negativeDays}d)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Segmented Multi-colored Progress Bar */}
          {metrics.timelineStats.hasRecordedData && metrics.timelineStats.segments.length > 0 ? (
            <div 
              className="segmented-progress-bar" 
              style={{ margin: 0 }}
              title={`Progresso: ${metrics.daysPassed} de ${metrics.totalDays} dias decorridos | ${metrics.timelineStats.positivePercentage}% Positivo, ${metrics.timelineStats.negativePercentage}% Negativo`}
            >
              {metrics.timelineStats.segments.map((seg) => {
                const isElapsed = seg.isElapsed;
                const isPos = seg.status === 'positive';

                const tooltip = isElapsed
                  ? `${formatShortDate(seg.date)}: ${isPos ? 'Margem Positiva (economizando)' : 'Margem Negativa (acima da meta)'}`
                  : `${formatShortDate(seg.date)}: Dia futuro`;

                return (
                  <div
                    key={seg.date}
                    className={`progress-segment ${isElapsed ? (isPos ? 'segment-positive' : 'segment-negative') : 'segment-future'}`}
                    title={tooltip}
                  />
                );
              })}
            </div>
          ) : (
            <div className="progress-bar-container" style={{ margin: 0 }}>
              <div className="progress-bar-fill" style={{ width: `${metrics.currentProgressPercent}%` }} />
            </div>
          )}
        </div>

      </div>

      {/* SECTION 6: Chart (New Feature) */}
      <div className="glass animate-in delay-300" style={{ padding: isMobile ? '16px 12px' : '24px' }}>
        <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: compPeriod && isMobile ? 'wrap' : 'nowrap', 
            gap: isMobile ? '6px' : '10px'
          }}>
            <h3 style={{ 
              fontSize: isMobile ? '0.95rem' : '1.2rem', 
              margin: 0, 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? '6px' : '8px',
              whiteSpace: 'nowrap',
              minWidth: 0
            }}>
              <TrendingUp size={isMobile ? 16 : 18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} /> 
              <span>Evolução do Orçamento</span>
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', flexShrink: 0 }}>
              {/* Metric Toggle: Margem vs Saldo Real (exibido apenas durante a comparação) */}
              {compPeriod && (
                <div style={{ 
                  display: 'inline-flex', 
                  background: 'var(--bg-secondary)', 
                  padding: '2px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--card-border)' 
                }}>
                  <button
                    type="button"
                    onClick={() => setChartMode('margin')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontWeight: chartMode === 'margin' ? 600 : 400,
                      background: chartMode === 'margin' ? 'var(--card-bg)' : 'transparent',
                      color: chartMode === 'margin' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      boxShadow: chartMode === 'margin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Margem
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('balance')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontWeight: chartMode === 'balance' ? 600 : 400,
                      background: chartMode === 'balance' ? 'var(--card-bg)' : 'transparent',
                      color: chartMode === 'balance' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      boxShadow: chartMode === 'balance' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Saldo Real
                  </button>
                </div>
              )}

              {/* Compare Button with Popover */}
              <div style={{ position: 'relative' }} ref={compareDropdownRef}>
                <button
                  type="button"
                  data-testid="compare-chart-btn"
                  onClick={() => setShowCompareDropdown(!showCompareDropdown)}
                  className={`btn ${compPeriod ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: isMobile ? '4px 8px' : '5px 12px',
                    fontSize: isMobile ? '0.78rem' : '0.82rem',
                    height: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '6px',
                    borderColor: compPeriod ? '#3b82f6' : 'var(--card-border)',
                    background: compPeriod ? '#3b82f6' : 'var(--card-bg)',
                    color: compPeriod ? '#ffffff' : 'var(--text-primary)'
                  }}
                  title="Comparar com outro período de orçamento"
                >
                  <GitCompare size={14} />
                  <span>{compPeriod ? 'Comparando' : 'Comparar'}</span>
                </button>

                {showCompareDropdown && (
                  isMobile ? createPortal(
                    <div 
                      className="modal-overlay" 
                      onClick={() => setShowCompareDropdown(false)}
                      style={{ zIndex: 1100, padding: '16px' }}
                    >
                      <div 
                        ref={comparePanelRef}
                        className="glass animate-in" 
                        data-testid="compare-dropdown-panel" 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          maxWidth: '360px',
                          maxHeight: '80vh',
                          overflowY: 'auto',
                          padding: '16px',
                          borderRadius: '12px',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                          border: '1px solid var(--card-border)',
                          background: 'var(--card-bg)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Comparar com outro período
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowCompareDropdown(false)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                          Selecione um período abaixo para sobrepor ao gráfico e avaliar o desempenho diário lado a lado.
                        </p>

                        {availablePeriods.length === 0 ? (
                          <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Nenhum outro período cadastrado para comparar.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {availablePeriods.map(p => {
                              const isSelected = p.id === comparedPeriodId;
                              const pDays = getCalendarDaysBetween(p.startDate, p.endDate);
                              const pRecords = Object.keys(p.balanceHistory || {}).length;

                              return (
                                <div
                                  key={p.id}
                                  data-testid={`compare-option-${p.id}`}
                                  onClick={() => {
                                    setComparedPeriodId(isSelected ? null : p.id);
                                    setShowCompareDropdown(false);
                                  }}
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: `1px solid ${isSelected ? '#3b82f6' : 'var(--card-border)'}`,
                                    background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                      {p.name}
                                    </span>
                                    {isSelected && (
                                      <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>
                                        ✓ Selecionado
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    <span>{formatShortDate(p.startDate)} a {formatShortDate(p.endDate)} ({pDays}d)</span>
                                    <span>{formatCurrencyNoCents(p.initialBudget)}</span>
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {pRecords} {pRecords === 1 ? 'lançamento registrado' : 'lançamentos registrados'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {comparedPeriodId && (
                          <button
                            type="button"
                            data-testid="clear-comparison-btn"
                            onClick={() => {
                              setComparedPeriodId(null);
                              setChartMode('margin');
                              setShowCompareDropdown(false);
                            }}
                            className="btn btn-secondary"
                            style={{ width: '100%', marginTop: '12px', fontSize: '0.8rem', padding: '8px' }}
                          >
                            Limpar Comparação
                          </button>
                        )}
                      </div>
                    </div>,
                    document.body
                  ) : (
                    <div 
                      ref={comparePanelRef}
                      className="glass animate-in" 
                      data-testid="compare-dropdown-panel" 
                      style={{
                        position: 'absolute',
                        top: '36px',
                        right: 0,
                        width: '340px',
                        maxHeight: '380px',
                        overflowY: 'auto',
                        padding: '12px',
                        zIndex: 50,
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        border: '1px solid var(--card-border)',
                        background: 'var(--card-bg)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Comparar com outro período
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCompareDropdown(false)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                        Selecione um período abaixo para sobrepor ao gráfico e avaliar o desempenho diário lado a lado.
                      </p>

                      {availablePeriods.length === 0 ? (
                        <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          Nenhum outro período cadastrado para comparar.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {availablePeriods.map(p => {
                            const isSelected = p.id === comparedPeriodId;
                            const pDays = getCalendarDaysBetween(p.startDate, p.endDate);
                            const pRecords = Object.keys(p.balanceHistory || {}).length;

                            return (
                              <div
                                key={p.id}
                                data-testid={`compare-option-${p.id}`}
                                onClick={() => {
                                  setComparedPeriodId(isSelected ? null : p.id);
                                  setShowCompareDropdown(false);
                                }}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: `1px solid ${isSelected ? '#3b82f6' : 'var(--card-border)'}`,
                                  background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-secondary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                    {p.name}
                                  </span>
                                  {isSelected && (
                                    <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>
                                      ✓ Selecionado
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  <span>{formatShortDate(p.startDate)} a {formatShortDate(p.endDate)} ({pDays}d)</span>
                                  <span>{formatCurrencyNoCents(p.initialBudget)}</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {pRecords} {pRecords === 1 ? 'lançamento registrado' : 'lançamentos registrados'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {comparedPeriodId && (
                        <button
                          type="button"
                          data-testid="clear-comparison-btn"
                          onClick={() => {
                            setComparedPeriodId(null);
                            setChartMode('margin');
                            setShowCompareDropdown(false);
                          }}
                          className="btn btn-secondary"
                          style={{ width: '100%', marginTop: '10px', fontSize: '0.75rem', padding: '6px' }}
                        >
                          Limpar Comparação
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* Ajuda do Gráfico */}
              <div 
                style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'help' }}
                onMouseEnter={() => setShowChartHelp(true)}
                onMouseLeave={() => setShowChartHelp(false)}
                onClick={() => setShowChartHelp(!showChartHelp)}
              >
                <Info size={isMobile ? 16 : 18} style={{ color: 'var(--text-muted)' }} />
                
                {showChartHelp && (
                  <div className="glass animate-in" style={{ 
                    position: 'absolute', 
                    top: '24px', 
                    right: 0, 
                    width: isMobile ? '250px' : '300px', 
                    padding: '14px', 
                    zIndex: 10,
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                  }}>
                    <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>Como ler o gráfico?</p>
                    <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li>No modo <strong>Margem</strong>, a linha reta tracejada <strong style={{ color: 'var(--text-primary)' }}>R$0</strong> representa o seu limite diário ideal para terminar no azul.</li>
                      <li>Pontos <strong>acima de R$0</strong> significam que você está economizando (Margem positiva).</li>
                      <li>Pontos <strong>abaixo de R$0</strong> significam que você ultrapassou a meta no momento (Margem negativa).</li>
                      <li>No modo <strong>Saldo Real</strong>, visualize a linha do dinheiro físico em conta vs meta.</li>
                      <li>Ao ativar a <strong>Comparação</strong>, os dois períodos são sincronizados pelos dias do mês (ex: Dia 5 de um mês com Dia 5 do outro), permitindo comparar seu desempenho dia a dia na mesma escala.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Comparison Banner */}
        {compPeriod && (
          <div data-testid="active-comparison-banner" style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '10px 14px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '8px',
            marginBottom: '16px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              <GitCompare size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
              <span>Comparando:</span>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                padding: '2px 8px', 
                background: 'var(--card-bg)', 
                border: '1px solid var(--card-border)', 
                borderRadius: '4px',
                fontSize: '0.8rem'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-above)', display: 'inline-block' }} />
                <strong>{period.name}</strong> (Atual)
              </span>
              <span style={{ color: 'var(--text-muted)' }}>vs</span>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                padding: '2px 8px', 
                background: 'var(--card-bg)', 
                border: '1px solid #3b82f6', 
                borderRadius: '4px',
                fontSize: '0.8rem',
                color: '#3b82f6'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '2px', background: '#3b82f6', display: 'inline-block' }} />
                <strong>{compPeriod.name}</strong> (Comparado)
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setComparedPeriodId(null);
                setChartMode('margin');
              }}
              className="btn btn-secondary"
              style={{
                padding: '3px 8px',
                fontSize: '0.75rem',
                height: 'auto',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                color: 'var(--text-secondary)'
              }}
              title="Encerrar comparação"
            >
              <X size={12} /> Remover
            </button>
          </div>
        )}
        
        <div style={{ width: '100%', height: isMobile ? 280 : 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={isMobile 
                ? { top: 5, right: 5, left: 5, bottom: 5 } 
                : { top: 5, right: 20, left: 10, bottom: 5 }
              }
            >
              <defs>
                <linearGradient id="colorEsperado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--text-muted)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="var(--text-muted)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  {fillOffset <= 0 ? (
                    <>
                      <stop offset="0%" stopColor="var(--color-below)" stopOpacity={0}/>
                      <stop offset="100%" stopColor="var(--color-below)" stopOpacity={0.15}/>
                    </>
                  ) : fillOffset >= 1 ? (
                    <>
                      <stop offset="0%" stopColor="var(--color-above)" stopOpacity={0.15}/>
                      <stop offset="100%" stopColor="var(--color-above)" stopOpacity={0}/>
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="var(--color-above)" stopOpacity={0.15}/>
                      <stop offset={`${fillOffset * 100}%`} stopColor="var(--color-above)" stopOpacity={0}/>
                      <stop offset={`${fillOffset * 100}%`} stopColor="var(--color-below)" stopOpacity={0}/>
                      <stop offset="100%" stopColor="var(--color-below)" stopOpacity={0.15}/>
                    </>
                  )}
                </linearGradient>
                <linearGradient id="strokeReal" x1="0" y1="0" x2="0" y2="1">
                  {strokeOffset <= 0 ? (
                    <>
                      <stop offset="0%" stopColor="var(--color-below)" stopOpacity={1}/>
                      <stop offset="100%" stopColor="var(--color-below)" stopOpacity={1}/>
                    </>
                  ) : strokeOffset >= 1 ? (
                    <>
                      <stop offset="0%" stopColor="var(--color-above)" stopOpacity={1}/>
                      <stop offset="100%" stopColor="var(--color-above)" stopOpacity={1}/>
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="var(--color-above)" stopOpacity={1}/>
                      <stop offset={`${strokeOffset * 100}%`} stopColor="var(--color-above)" stopOpacity={1}/>
                      <stop offset={`${strokeOffset * 100}%`} stopColor="var(--color-below)" stopOpacity={1}/>
                      <stop offset="100%" stopColor="var(--color-below)" stopOpacity={1}/>
                    </>
                  )}
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
                tickMargin={12} 
                axisLine={false} 
                tickLine={false}
                interval={compPeriod && chartData.length > 15 ? (isMobile ? 3 : 1) : undefined}
              />
              <YAxis 
                width={isMobile ? 40 : 60}
                domain={[yAxisMin, yAxisMax]}
                ticks={yTicks}
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
                tickFormatter={(value) => {
                  if (isMobile) {
                    if (value === 0) return '0';
                    const absVal = Math.abs(value);
                    if (absVal >= 1000) {
                      return `${Math.round((value / 1000) * 10) / 10}k`;
                    }
                    return `${Math.round(value)}`;
                  }
                  return `R$ ${Math.round(value)}`;
                }}
                axisLine={false} 
                tickLine={false} 
                tickMargin={isMobile ? 4 : 12} 
              />
              <Tooltip content={<CustomTooltip />} />
              
              {chartMode === 'margin' ? (
                <>
                  <Area 
                    name="Esperado" 
                    type="monotone" 
                    dataKey="Esperado" 
                    stroke="var(--text-muted)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorEsperado)" 
                    strokeDasharray="4 4"
                  />

                  {compPeriod && (
                    <Area 
                      name={`Margem (${compPeriod.name})`} 
                      type="monotone" 
                      dataKey="compReal" 
                      stroke="#3b82f6" 
                      strokeWidth={2.5} 
                      fill="none"
                      fillOpacity={0}
                      dot={false} 
                      activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} 
                      connectNulls 
                    />
                  )}
                  
                  <Area 
                    name="Real" 
                    type="monotone" 
                    dataKey="Real" 
                    stroke="url(#strokeReal)" 
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorReal)"
                    dot={renderCustomDot} 
                    activeDot={renderActiveDot} 
                    connectNulls 
                  />

                  {showProjection && (
                    <Line 
                      name="Projetado" 
                      type="monotone" 
                      dataKey="Projetado" 
                      stroke="var(--text-muted)" 
                      strokeWidth={1.5} 
                      strokeDasharray="2 4" 
                      dot={false} 
                    />
                  )}

                  {compPeriod && (
                    <Line 
                      name={`Projetado (${compPeriod.name})`} 
                      type="monotone" 
                      dataKey="compProjetado" 
                      stroke="#93c5fd" 
                      strokeWidth={1.5} 
                      strokeDasharray="2 4" 
                      dot={false} 
                      connectNulls 
                    />
                  )}
                </>
              ) : (
                <>
                  {/* Mode: Saldo Real */}
                  {compPeriod && (
                    <Line 
                      name={`Real (${compPeriod.name})`} 
                      type="monotone" 
                      dataKey="balance2" 
                      stroke="#3b82f6" 
                      strokeWidth={2.5} 
                      dot={false} 
                      activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} 
                      connectNulls 
                    />
                  )}
                  <Line 
                    name={`Real (${period.name})`} 
                    type="monotone" 
                    dataKey="balance1" 
                    stroke="var(--color-above)" 
                    strokeWidth={2.5} 
                    dot={{ r: 3.5, fill: '#fff', stroke: 'var(--color-above)', strokeWidth: 2 }} 
                    connectNulls 
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Period Notes Section */}
      <PeriodNotes period={period} onUpdateNotes={onUpdateNotes} />

      {/* SECTION 5: Table of Daily Projections (New Feature) */}
      <div className="glass animate-in delay-400 table-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: 'var(--color-primary)' }} /> Tabela de Evolução do Orçamento
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Veja qual o saldo esperado ao início de cada dia do período e compare com o saldo que você marcou manualmente.
        </p>
        
        <div className="table-container">
          <table className="budget-table">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Data</th>
                <th style={{ width: '21%' }}>
                  <span className="hide-mobile">Saldo Esperado</span>
                  <span className="show-mobile">Esperado</span>
                </th>
                <th style={{ width: '21%' }}>
                  <span className="hide-mobile">Saldo Real</span>
                  <span className="show-mobile">Real</span>
                </th>
                <th style={{ width: '20%' }}>
                  <span className="hide-mobile">Margem Projetada</span>
                  <span className="show-mobile">M. Proj.</span>
                </th>
                <th style={{ width: '20%' }}>Margem</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const totalDays = metrics.totalDays;
                const dates: string[] = [];
                const start = parseLocalDate(period.startDate);
                for (let i = 0; i < totalDays; i++) {
                  const nextDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
                  dates.push(getLocalDateString(nextDate));
                }
                
                const todayStr = getLocalDateString();
                const projectedVal = lastRecordedBalance !== null ? lastRecordedBalance : period.initialBudget;

                return dates.map((dateStr, index) => {
                  const expectedBalance = period.initialBudget - index * metrics.dailyBudget;
                  const recordedBalanceForDay = period.balanceHistory?.[dateStr];
                  const hasRecord = recordedBalanceForDay !== undefined;
                  const isToday = todayStr === dateStr;
                  const isPast = dateStr < todayStr;

                  let diffTextFull = '—';
                  let diffTextCompact = '—';
                  let diffColor = 'inherit';
                  let diffWeight = 'normal';

                  if (hasRecord) {
                    const diff = recordedBalanceForDay - expectedBalance;
                    const diffAbs = Math.abs(diff);
                    if (diff > 0.01) {
                      diffTextFull = formatCurrency(diffAbs);
                      diffTextCompact = formatCurrencyNoCents(diffAbs);
                      diffColor = 'var(--color-above)';
                      diffWeight = '700';
                    } else if (diff < -0.01) {
                      diffTextFull = formatCurrency(diffAbs);
                      diffTextCompact = formatCurrencyNoCents(diffAbs);
                      diffColor = 'var(--color-below)';
                      diffWeight = '700';
                    } else {
                      diffTextFull = 'Margem OK';
                      diffTextCompact = 'Margem OK';
                      diffColor = 'var(--color-neutral)';
                      diffWeight = '700';
                    }
                  }

                  let projMarginTextFull = '—';
                  let projMarginTextCompact = '—';
                  if (!isPast) {
                    const projMargin = projectedVal - expectedBalance;
                    const projMarginAbs = Math.abs(projMargin);
                    if (projMargin > 0.01) {
                      projMarginTextFull = formatCurrency(projMarginAbs);
                      projMarginTextCompact = formatCurrencyNoCents(projMarginAbs);
                    } else if (projMargin < -0.01) {
                      projMarginTextFull = `- ${formatCurrency(projMarginAbs)}`;
                      projMarginTextCompact = `- ${formatCurrencyNoCents(projMarginAbs)}`;
                    } else {
                      projMarginTextFull = 'Margem OK';
                      projMarginTextCompact = 'Margem OK';
                    }
                  }

                  return (
                    <tr key={dateStr} className={isToday ? 'today-row' : ''}>
                      <td style={{ color: isToday ? 'var(--color-primary)' : 'inherit', fontWeight: isToday ? 600 : 'normal' }}>
                        <span className="hide-mobile">{formatDate(dateStr)} ({getWeekdayShort(dateStr)})</span>
                        <span className="show-mobile">{formatShortDate(dateStr)} {getWeekdayShort(dateStr)}</span>
                      </td>
                      <td>
                        <span className="hide-mobile">{formatCurrency(expectedBalance)}</span>
                        <span className="show-mobile">{formatCurrencyNoCents(expectedBalance)}</span>
                      </td>
                      <td>
                        <div className="table-recorded-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span>
                            {hasRecord ? (
                              <>
                                <span className="hide-mobile">{formatCurrency(recordedBalanceForDay!)}</span>
                                <span className="show-mobile">{formatCurrencyNoCents(recordedBalanceForDay!)}</span>
                              </>
                            ) : '—'}
                          </span>
                          {hasRecord && (
                            <button
                              onClick={() => handleDeleteClick(dateStr)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-below)';
                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-muted)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              className="delete-balance-btn"
                              title="Remover saldo lançado"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        <span className="hide-mobile">{projMarginTextFull}</span>
                        <span className="show-mobile">{projMarginTextCompact}</span>
                      </td>

                      <td style={{ color: diffColor, fontWeight: diffWeight as any }}>
                        <span className="hide-mobile">{diffTextFull}</span>
                        <span className="show-mobile">{diffTextCompact}</span>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetDate && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteTargetDate(null)}>
          <div 
            className="modal-content glass" 
            style={{ 
              border: '1px solid var(--card-border-hover)', 
              maxWidth: '400px', 
              width: '90%',
              padding: '24px',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--color-below)' }}>
              <AlertTriangle size={48} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Confirmar Exclusão
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Tem certeza que deseja remover o saldo real registrado no dia <strong>{formatDate(deleteTargetDate)}</strong> ({formatCurrency(period.balanceHistory?.[deleteTargetDate] || 0)})?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setDeleteTargetDate(null)}
                disabled={deleting}
                style={{ flex: '1' }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{ flex: '1' }}
              >
                {deleting ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}



    </div>
  );
};
