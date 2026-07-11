import React, { useState, useEffect } from 'react';
import type { Period } from '../types';
import { calculateBudgetMetrics, parseLocalDate, getLocalDateString } from '../utils/calculations';
import { 
  Calendar, 
  DollarSign, 
  Clock,
  TrendingUp,
  Info
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

interface PeriodDetailProps {
  period: Period;
  onRecordBalance: (id: string, balance: number, date: string) => Promise<void>;
}

export const PeriodDetail: React.FC<PeriodDetailProps> = ({
  period,
  onRecordBalance
}) => {
  const metrics = calculateBudgetMetrics(period);
  const [balanceInput, setBalanceInput] = useState('');
  const [balanceDate, setBalanceDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [showChartHelp, setShowChartHelp] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set default values when period changes
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
  }, [period]);

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(balanceInput);
    if (isNaN(balance)) return;

    try {
      setSubmitting(true);
      await onRecordBalance(period.id, balance, balanceDate);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (error) {
      console.error('Error saving balance:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatShortDate = (dateStr: string) => {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };

  // Prepare chart data & Regression
  const chartData = [];
  const start = parseLocalDate(period.startDate);
  
  // 1. Gather data for linear regression (Least Squares)
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let nPoints = 0;
  let lastRecordedDayIndex = -1;
  let lastRecordedBalance: number | null = null;

  for (let i = 0; i < metrics.totalDays; i++) {
    const nextDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dateStr = getLocalDateString(nextDate);
    
    let y = null;
    if (i === 0) {
      y = period.initialBudget; // Ponto inicial garantido
    }
    
    const actualBalance = period.balanceHistory?.[dateStr];
    if (actualBalance !== undefined) {
      y = actualBalance;
      lastRecordedDayIndex = i;
      lastRecordedBalance = y;
    }

    if (y !== null) {
      sumX += i;
      sumY += y;
      sumXY += i * y;
      sumXX += i * i;
      nPoints++;
    }
  }

  // Calculate slope (m) and intercept (b) if we have at least 2 points
  let m = 0;
  let canProject = false;
  if (nPoints >= 2) {
    const denominator = nPoints * sumXX - sumX * sumX;
    if (denominator !== 0) {
      m = (nPoints * sumXY - sumX * sumY) / denominator;
      canProject = true;
    }
  }

  // 2. Build the chart data array
  for (let i = 0; i < metrics.totalDays; i++) {
    const nextDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dateStr = getLocalDateString(nextDate);
    const expectedBalance = period.initialBudget - i * metrics.dailyBudget;
    const actualBalance = period.balanceHistory?.[dateStr];
    
    let projectedBalance = null;
    if (canProject && lastRecordedBalance !== null && i >= lastRecordedDayIndex) {
      // Projeta a partir do último saldo real conhecido usando a taxa de consumo histórica (m)
      projectedBalance = lastRecordedBalance + m * (i - lastRecordedDayIndex);
    }
    
    const margemReal = actualBalance !== undefined ? actualBalance - expectedBalance : null;
    const margemProjetada = projectedBalance !== null ? projectedBalance - expectedBalance : null;

    chartData.push({
      date: formatShortDate(dateStr),
      Esperado: 0,
      Real: margemReal !== null ? parseFloat(margemReal.toFixed(2)) : null,
      Projetado: margemProjetada !== null ? parseFloat(margemProjetada.toFixed(2)) : null,
      _rawEsperado: expectedBalance,
      _rawReal: actualBalance,
      _rawProjetado: projectedBalance
    });
  }

  // 3. Find min/max values to calculate a fixed YAxis domain and split gradient
  let maxMargin = 0;
  let minMargin = 0;
  chartData.forEach((d: any) => {
    if (d.Real !== null) {
      if (d.Real > maxMargin) maxMargin = d.Real;
      if (d.Real < minMargin) minMargin = d.Real;
    }
    if (d.Projetado !== null) {
      if (d.Projetado > maxMargin) maxMargin = d.Projetado;
      if (d.Projetado < minMargin) minMargin = d.Projetado;
    }
  });

  // Calculate max absolute margin to make the Y axis perfectly symmetric
  // This guarantees that 0 is always exactly in the center of the Y axis and visible
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
  const yAxisMax = niceStep * 2;
  const yAxisMin = -yAxisMax;
  const yTicks = [-yAxisMax, -niceStep, 0, niceStep, yAxisMax];

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
      const formatCurrency = (val: number | null | undefined) => 
        val != null ? `R$ ${val.toFixed(2)}` : '-';
        
      return (
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '8px', 
          border: '1px solid var(--card-border)', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
          padding: '12px',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-family, "Inter", sans-serif)'
        }}>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px', margin: 0 }}>{label}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span>Margem Real:</span>
              <span style={{ fontWeight: 600 }}>{data.Real !== null ? formatCurrency(data.Real) : '-'}</span>
            </div>

            {data.Projetado !== null && data.Real === null && (
              <div style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span>Margem Projetada:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(data.Projetado)}</span>
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
                <span>{formatCurrency(data._rawReal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span>Saldo Esperado Absoluto:</span>
                <span>{formatCurrency(data._rawEsperado)}</span>
              </div>
              {data._rawProjetado !== null && data._rawReal === undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <span>Saldo Projetado Absoluto:</span>
                  <span>{formatCurrency(data._rawProjetado)}</span>
                </div>
              )}
            </div>
          </div>
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
            <Clock size={16} /> {metrics.totalDays} dias no total
          </span>
        </div>
      </div>

      {/* SECTION 1: Record Current Balance (Moved Up for Quick Access) */}
      <div className="glass animate-in delay-100" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={18} style={{ color: 'var(--color-primary)' }} /> Registrar Saldo Real
        </h3>

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
      </div>

      {/* SECTION 3: Grid of Main KPIs */}
      <div className="animate-in delay-200" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        
        {/* Budget Goals Card */}
        <div className="glass glass-enhanced-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {(() => {
            let predictedNormalizationDate: Date | null = null;
            
            // A diferença atual (se o usuário está no "vermelho" do orçamento ou não)
            const currentDiff = metrics.difference;
            
            // m é a taxa de gasto real. metrics.dailyBudget é a taxa de gasto esperada.
            // Para cruzar, a taxa de gasto real (m) deve ser menos íngreme (maior) que -dailyBudget.
            // Ou seja, (m + dailyBudget) > 0.
            if (canProject && lastRecordedBalance !== null && currentDiff !== undefined && currentDiff < 0 && (m + metrics.dailyBudget) > 0) {
              const recoveryRate = m + metrics.dailyBudget; // O quanto a diferença melhora por dia
              const daysToNormalize = Math.ceil(Math.abs(currentDiff) / recoveryRate);
              const predictedDayIndex = lastRecordedDayIndex + daysToNormalize;
              predictedNormalizationDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + predictedDayIndex);
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
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: predictedNormalizationDate ? '12px' : '0' }}>
                  Saldo Real: {metrics.recordedBalance !== undefined ? formatCurrency(metrics.recordedBalance) : '—'}
                </p>
                {predictedNormalizationDate && (
                  <div style={{ 
                    marginTop: 'auto',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    fontSize: '0.75rem',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600
                  }}>
                    <TrendingUp size={14} /> Previsão de alta: {formatShortDate(getLocalDateString(predictedNormalizationDate))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Daily Spending Card */}
        <div className="glass glass-enhanced-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Alvo de Hoje (Saldo Esperado)
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
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Estimativa: {formatCurrency(metrics.dailyBudget)}/dia
          </p>
        </div>

        {/* Countdown Card */}
        <div className="glass glass-enhanced-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Contagem Regressiva
          </span>
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
                  Contador encerrado
                </p>
              </div>
            ) : (
              <div>
                <span className="font-display" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {metrics.daysRemaining}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                  dias restam
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {metrics.daysPassed} de {metrics.totalDays} transcorridos
                </p>
              </div>
            )}
          </div>
          <div className="progress-bar-container" style={{ margin: 0 }}>
            <div className="progress-bar-fill" style={{ width: `${metrics.currentProgressPercent}%` }} />
          </div>
        </div>

      </div>



      {/* SECTION 5: Table of Daily Projections (New Feature) */}
      <div className="glass animate-in delay-300" style={{ padding: '24px' }}>
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
                <th style={{ width: '10%' }}>Dia</th>
                <th style={{ width: '15%' }}>Data</th>
                <th style={{ width: '20%' }}>Saldo Esperado</th>
                <th style={{ width: '18%' }}>Saldo Real</th>
                <th style={{ width: '20%' }}>Saldo Projetado</th>
                <th style={{ width: '17%' }}>Margem</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const totalDays = metrics.totalDays;
                const dates = [];
                const start = parseLocalDate(period.startDate);
                for (let i = 0; i < totalDays; i++) {
                  const nextDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
                  dates.push(getLocalDateString(nextDate));
                }
                
                const todayStr = getLocalDateString();

                return dates.map((dateStr, index) => {
                  const expectedBalance = period.initialBudget - index * metrics.dailyBudget;
                  const recordedBalanceForDay = period.balanceHistory?.[dateStr];
                  const hasRecord = recordedBalanceForDay !== undefined;
                  const isToday = todayStr === dateStr;
                  
                  let projectedBalance = null;
                  if (canProject && lastRecordedBalance !== null && index >= lastRecordedDayIndex) {
                    projectedBalance = lastRecordedBalance + m * (index - lastRecordedDayIndex);
                  }

                  let diffText = '—';
                  let diffColor = 'inherit';
                  let diffWeight = 'normal';

                  if (hasRecord) {
                    const diff = recordedBalanceForDay - expectedBalance;
                    const diffAbs = Math.abs(diff);
                    if (diff > 0.01) {
                      diffText = `+ ${formatCurrency(diffAbs)}`;
                      diffColor = 'var(--color-above)';
                      diffWeight = '700';
                    } else if (diff < -0.01) {
                      diffText = `- ${formatCurrency(diffAbs)}`;
                      diffColor = 'var(--color-below)';
                      diffWeight = '700';
                    } else {
                      diffText = 'Margem OK';
                      diffColor = 'var(--color-neutral)';
                      diffWeight = '700';
                    }
                  }

                  return (
                    <tr key={dateStr} className={isToday ? 'today-row' : ''}>
                      <td style={{ color: isToday ? 'var(--color-primary)' : 'inherit' }}>
                        Dia {index + 1}
                        {isToday && (
                          <span className="badge badge-neutral" style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '0.65rem', textTransform: 'none' }}>
                            Hoje
                          </span>
                        )}
                      </td>
                      <td>{formatDate(dateStr)}</td>
                      <td>{formatCurrency(expectedBalance)}</td>
                      <td>
                        {hasRecord
                          ? formatCurrency(recordedBalanceForDay!) 
                          : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontStyle: projectedBalance !== null ? 'normal' : 'italic' }}>
                        {projectedBalance !== null
                          ? formatCurrency(projectedBalance)
                          : '—'}
                      </td>
                      <td style={{ color: diffColor, fontWeight: diffWeight as any }}>
                        {diffText}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 6: Chart (New Feature) */}
      <div className="glass animate-in delay-400" style={{ padding: isMobile ? '16px 12px' : '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} /> Evolução do Orçamento
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Acompanhe visualmente se os seus gastos reais estão seguindo o orçamento esperado.
            </p>
          </div>
          
          <div 
            style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'help' }}
            onMouseEnter={() => setShowChartHelp(true)}
            onMouseLeave={() => setShowChartHelp(false)}
            onClick={() => setShowChartHelp(!showChartHelp)}
          >
            <Info size={18} style={{ color: 'var(--text-muted)' }} />
            
            {showChartHelp && (
              <div className="glass animate-in" style={{ 
                position: 'absolute', 
                top: '24px', 
                right: 0, 
                width: '300px', 
                padding: '16px', 
                zIndex: 10,
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
              }}>
                <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>Como ler o gráfico?</p>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>A linha reta tracejada <strong style={{ color: 'var(--text-primary)' }}>R$0</strong> representa o seu limite diário ideal para terminar no azul.</li>
                  <li>Pontos <strong>acima de R$0</strong> significam que você está economizando (Margem positiva).</li>
                  <li>Pontos <strong>abaixo de R$0</strong> significam que você ultrapassou a meta no momento (Margem negativa).</li>
                </ul>
              </div>
            )}
          </div>
        </div>
        
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
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickMargin={12} axisLine={false} tickLine={false} />
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
              
              <Line 
                name="Projetado" 
                type="monotone" 
                dataKey="Projetado" 
                stroke="var(--text-muted)" 
                strokeWidth={1.5} 
                strokeDasharray="2 4" 
                dot={false} 
              />
              
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
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
