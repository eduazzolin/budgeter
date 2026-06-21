import React from 'react';
import type { Period } from '../types';
import { calculateBudgetMetrics } from '../utils/calculations';
import { Trash2, Edit2, Plus, Calendar, ArrowUpRight, ArrowDownRight, Equal } from 'lucide-react';

interface PeriodListProps {
  periods: Period[];
  selectedPeriodId: string | null;
  onSelectPeriod: (id: string) => void;
  onEditPeriod: (period: Period) => void;
  onDeletePeriod: (id: string) => void;
  onAddNewClick: () => void;
}

export const PeriodList: React.FC<PeriodListProps> = ({
  periods,
  selectedPeriodId,
  onSelectPeriod,
  onEditPeriod,
  onDeletePeriod,
  onAddNewClick
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Seus Contadores
        </h2>
        <button 
          onClick={onAddNewClick} 
          className="btn btn-primary" 
          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> Novo
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '70vh', paddingRight: '4px' }}>
        {periods.length === 0 ? (
          <div className="glass" style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhum período cadastrado. Clique em "Novo" para começar!
          </div>
        ) : (
          periods.map((period) => {
            const isSelected = period.id === selectedPeriodId;
            const metrics = calculateBudgetMetrics(period);
            
            // Format currency in BRL
            const formatCurrency = (val: number) => {
              return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            };

            // Format dates for display (DD/MM)
            const formatDate = (dateStr: string) => {
              const [, m, d] = dateStr.split('-');
              return `${d}/${m}`;
            };

            return (
              <div
                key={period.id}
                onClick={() => onSelectPeriod(period.id)}
                className={`glass ${isSelected ? 'glass-hover' : ''}`}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--card-border)',
                  backgroundColor: isSelected ? 'rgba(9, 9, 11, 0.08)' : 'var(--card-bg)',
                  boxShadow: isSelected ? '0 0 15px rgba(9, 9, 11, 0.15)' : 'none',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                    {period.name}
                  </h3>
                  <div 
                    style={{ display: 'flex', gap: '8px' }}
                    onClick={(e) => e.stopPropagation()} // Prevent card selection on action button clicks
                  >
                    <button
                      onClick={() => onEditPeriod(period)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="Editar"
                    >
                      <Edit2 size={14} className="hover-white" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o período "${period.name}"?`)) {
                          onDeletePeriod(period.id);
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="Excluir"
                    >
                      <Trash2 size={14} className="hover-rose" />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {formatDate(period.startDate)} - {formatDate(period.endDate)}
                  </span>
                  <span>
                    Dias: {metrics.totalDays}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase' }}>
                      Orçamento
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(period.initialBudget)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {metrics.difference !== undefined && (
                    <div style={{ alignSelf: 'flex-end' }}>
                      {metrics.status === 'above' && (
                        <span className="badge badge-above">
                          <ArrowUpRight size={10} /> +{formatCurrency(Math.abs(metrics.difference))}
                        </span>
                      )}
                      {metrics.status === 'below' && (
                        <span className="badge badge-below">
                          <ArrowDownRight size={10} /> -{formatCurrency(Math.abs(metrics.difference))}
                        </span>
                      )}
                      {metrics.status === 'neutral' && (
                        <span className="badge badge-neutral">
                          <Equal size={10} /> Saldo OK
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar of days */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Progresso</span>
                    <span>{Math.round(metrics.currentProgressPercent)}% ({metrics.daysPassed}d / {metrics.totalDays}d)</span>
                  </div>
                  <div className="progress-bar-container" style={{ margin: '0', height: '4px' }}>
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${metrics.currentProgressPercent}%`,
                        background: isSelected 
                          ? 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))'
                          : 'rgba(255, 255, 255, 0.25)' 
                      }} 
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
