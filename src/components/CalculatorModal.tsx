import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, HelpCircle, Check, AlertCircle } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (value: string) => void;
  initialValue?: string;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialValue = ''
}) => {
  const [expression, setExpression] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus the input after mount (modal transition)
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Derived state: calculate result and validity on the fly during render
  let result: number | null = null;
  let isValid = true;

  const trimmedExpression = expression.trim();
  if (trimmedExpression !== '') {
    const sanitized = trimmedExpression.replace(/,/g, '.');
    const safePattern = /^[0-9+\-*/().\s]+$/;
    
    if (!safePattern.test(sanitized)) {
      isValid = false;
    } else {
      try {
        const evalFn = new Function(`return (${sanitized})`);
        const val = evalFn();
        
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          result = val;
        } else {
          isValid = false;
        }
      } catch {
        isValid = false;
      }
    }
  }

  if (!isOpen) return null;

  const handleApply = () => {
    if (result !== null && isValid) {
      // Round to 2 decimal places to match the step="0.01" of Saldo Real
      const roundedResult = Math.round(result * 100) / 100;
      onApply(roundedResult.toFixed(2));
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass animate-in" 
        style={{ 
          border: '1px solid var(--card-border-hover)', 
          maxWidth: '450px', 
          width: '90%',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 20px var(--color-primary-glow)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            Calculadora de Saldo
          </h3>
          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info/Help */}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
          <HelpCircle size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
          <span>Digite uma expressão matemática (ex: <code>1500 - 350 + 40,25</code>). Use ponto ou vírgula para os centavos.</span>
        </p>

        {/* Input area */}
        <div style={{ marginBottom: '24px' }}>
          <input
            ref={inputRef}
            type="text"
            className="input-field"
            style={{ 
              fontSize: '1.15rem', 
              fontFamily: 'monospace',
              padding: '12px 16px',
              border: !isValid ? '1px solid var(--color-below)' : '1px solid var(--card-border)',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}
            placeholder="Ex: 800 + 450 - 120"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Result Area */}
        <div 
          style={{ 
            background: 'var(--bg-secondary)', 
            padding: '16px 20px', 
            borderRadius: 'var(--border-radius-md)', 
            marginBottom: '24px',
            minHeight: '76px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            border: '1px solid var(--card-border)',
            transition: 'all 0.2s ease'
          }}
        >
          {expression.trim() === '' ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
              Digite a fórmula acima para calcular o resultado
            </span>
          ) : !isValid ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-below)', fontSize: '0.9rem', justifyContent: 'center' }}>
              <AlertCircle size={16} />
              <span>Fórmula inválida ou incompleta...</span>
            </div>
          ) : result !== null ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Resultado Calculado
              </span>
              <span style={{ 
                fontSize: '1.8rem', 
                fontWeight: 800, 
                color: 'var(--color-above)',
                marginTop: '4px',
                fontFamily: 'Outfit, sans-serif',
                animation: 'scaleIn 0.15s ease-out'
              }}>
                {formatCurrency(result)}
              </span>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button"
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ flex: 1 }}
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleApply} 
            className="btn btn-primary" 
            style={{ flex: 1.5 }}
            disabled={result === null || !isValid}
          >
            <Check size={16} /> Aplicar no Saldo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
