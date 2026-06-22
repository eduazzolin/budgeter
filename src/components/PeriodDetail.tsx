import React, { useState, useEffect } from 'react';
import type { Period } from '../types';
import { calculateBudgetMetrics, parseLocalDate, getLocalDateString } from '../utils/calculations';
import { 
  Calendar, 
  DollarSign, 
  Clock
} from 'lucide-react';

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

  // Set default values when period changes
  useEffect(() => {
    setBalanceInput(period.currentBalance !== undefined ? period.currentBalance.toString() : '');
    
    // Set default date to today, but clamped to period bounds if today is outside the period
    const today = new Date().toISOString().split('T')[0];
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Period Header */}
      <div>
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
      <div className="glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={18} style={{ color: 'var(--color-primary)' }} /> Registrar Saldo Atual
        </h3>

        <form onSubmit={handleBalanceSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 200px' }}>
            <label className="form-label">Saldo Atual (R$)</label>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        
        {/* Budget Goals Card */}
        <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Saldo
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
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Atual: {metrics.recordedBalance !== undefined ? formatCurrency(metrics.recordedBalance) : '—'}
          </p>
        </div>

        {/* Daily Spending Card */}
        <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Esperado para Hoje
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
                Atual
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
        <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
      <div className="glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: 'var(--color-primary)' }} /> Tabela de Prospecção Diária
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Veja qual o saldo esperado ao início de cada dia do período e compare com o saldo que você marcou manualmente.
        </p>
        
        <div className="table-container">
          <table className="budget-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Dia</th>
                <th style={{ width: '20%' }}>Data</th>
                <th style={{ width: '25%' }}>Saldo Esperado (Início)</th>
                <th style={{ width: '20%' }}>Saldo Inserido</th>
                <th style={{ width: '20%' }}>Diferença</th>
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
                      diffText = 'Saldo OK';
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

    </div>
  );
};
