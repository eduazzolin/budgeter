import React from 'react';
import type { Period } from '../types';
import { calculateBudgetMetrics } from '../utils/calculations';
import { Trash2, Edit2, Plus, Calendar, ArrowUpRight, ArrowDownRight, Equal, GripVertical } from 'lucide-react';

interface PeriodListProps {
  periods: Period[];
  selectedPeriodId: string | null;
  onSelectPeriod: (id: string) => void;
  onEditPeriod: (period: Period) => void;
  onDeletePeriod: (id: string) => void;
  onAddNewClick: () => void;
  onReorderPeriods: (updatedPeriods: Period[]) => void;
}

export const PeriodList: React.FC<PeriodListProps> = ({
  periods,
  selectedPeriodId,
  onSelectPeriod,
  onEditPeriod,
  onDeletePeriod,
  onAddNewClick,
  onReorderPeriods
}) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragEnabledIndex, setDragEnabledIndex] = React.useState<number | null>(null);
  const [localPeriods, setLocalPeriods] = React.useState<Period[]>(periods);
  const [prevPeriods, setPrevPeriods] = React.useState<Period[]>(periods);

  if (periods !== prevPeriods) {
    setPrevPeriods(periods);
    if (draggedIndex === null) {
      setLocalPeriods(periods);
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newList = [...localPeriods];
    const [draggedItem] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, draggedItem);
    
    setLocalPeriods(newList);
    setDraggedIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragEnabledIndex(null);
    onReorderPeriods(localPeriods);
  };

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
        {localPeriods.length === 0 ? (
          <div className="glass" style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhum período cadastrado. Clique em "Novo" para começar!
          </div>
        ) : (
          localPeriods.map((period, index) => {
            const isSelected = period.id === selectedPeriodId;
            const metrics = calculateBudgetMetrics(period);
            const delayClass = index < 5 ? `delay-${(index + 1) * 100}` : '';
            const isBeingDragged = draggedIndex === index;
            
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
                draggable={dragEnabledIndex === index}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectPeriod(period.id)}
                className={`glass glass-enhanced-hover animate-in ${delayClass} ${isSelected ? 'glass-hover' : ''}`}
                style={{
                  padding: '16px 16px 16px 8px',
                  cursor: dragEnabledIndex === index ? (isBeingDragged ? 'grabbing' : 'grab') : 'pointer',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--card-border)',
                  backgroundColor: isSelected ? 'rgba(9, 9, 11, 0.08)' : 'var(--card-bg)',
                  boxShadow: isSelected ? '0 0 15px rgba(9, 9, 11, 0.15)' : 'none',
                  position: 'relative',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  opacity: isBeingDragged ? 0.4 : 1,
                  transition: 'opacity 0.2s ease, transform 0.1s ease',
                  transform: isBeingDragged ? 'scale(0.98)' : 'none'
                }}
              >
                {/* Drag Handle */}
                <div
                  onMouseEnter={() => setDragEnabledIndex(index)}
                  onMouseLeave={() => setDragEnabledIndex(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 4px',
                    color: 'var(--text-muted)',
                    cursor: isBeingDragged ? 'grabbing' : 'grab',
                    borderRadius: '4px',
                    touchAction: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent card selection on drag handle interaction
                  className="drag-handle hover-white"
                >
                  <GripVertical size={16} />
                </div>

                {/* Card Content Wrapper */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Equal size={10} /> Margem OK
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
