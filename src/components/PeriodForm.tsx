import React, { useState, useEffect } from 'react';
import type { Period } from '../types';
import { X, Calendar, DollarSign, Tag } from 'lucide-react';

interface PeriodFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, startDate: string, endDate: string, initialBudget: number, finalBudget: number) => Promise<void>;
  editPeriod?: Period | null;
}

export const PeriodForm: React.FC<PeriodFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editPeriod
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialBudget, setInitialBudget] = useState('');
  const [finalBudget, setFinalBudget] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editPeriod) {
      setName(editPeriod.name);
      setStartDate(editPeriod.startDate);
      setEndDate(editPeriod.endDate);
      setInitialBudget(editPeriod.initialBudget.toString());
      setFinalBudget(editPeriod.finalBudget.toString());
    } else {
      // Default to empty for new period
      setName('');
      // Set start date to today as default
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate('');
      setInitialBudget('');
      setFinalBudget('0');
    }
    setError(null);
  }, [editPeriod, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('O nome do período é obrigatório.');
      return;
    }
    if (!startDate) {
      setError('A data de início é obrigatória.');
      return;
    }
    if (!endDate) {
      setError('A data de fim é obrigatória.');
      return;
    }
    if (endDate < startDate) {
      setError('A data de fim deve ser igual ou posterior à data de início.');
      return;
    }
    const initVal = parseFloat(initialBudget);
    if (isNaN(initVal) || initVal <= 0) {
      setError('O orçamento inicial deve ser um número maior que zero.');
      return;
    }
    const finalVal = parseFloat(finalBudget);
    if (isNaN(finalVal) || finalVal < 0) {
      setError('O orçamento final deve ser zero ou um número positivo.');
      return;
    }
    if (initVal < finalVal) {
      setError('O orçamento inicial deve ser maior ou igual ao orçamento final.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(name.trim(), startDate, endDate, initVal, finalVal);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o período.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ border: '1px solid var(--card-border-hover)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            {editPeriod ? 'Editar Período' : 'Novo Período'}
          </h3>
          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(244, 63, 94, 0.12)', 
            border: '1px solid rgba(244, 63, 94, 0.3)', 
            color: 'var(--color-below)', 
            padding: '12px', 
            borderRadius: 'var(--border-radius-sm)', 
            fontSize: '0.9rem', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <Tag size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Nome do Período
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: Junho 2026, Férias de Verão"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Data Início
              </label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Data Fim
              </label>
              <input
                type="date"
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                <DollarSign size={12} style={{ marginRight: '2px', verticalAlign: 'middle' }} /> Orc. Inicial
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                placeholder="R$ 1.000,00"
                value={initialBudget}
                onChange={(e) => setInitialBudget(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <DollarSign size={12} style={{ marginRight: '2px', verticalAlign: 'middle' }} /> Orc. Final
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                placeholder="R$ 0,00"
                value={finalBudget}
                onChange={(e) => setFinalBudget(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
