import React from 'react';
import { X, HelpCircle, DollarSign, Target, TrendingUp, Activity, Milestone } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const terms = [
    {
      icon: <DollarSign size={20} style={{ color: 'var(--color-primary)' }} />,
      title: 'Saldo Real',
      desc: 'O dinheiro de fato que você tem na conta bancária (o valor físico que você lança no sistema).',
      badge: 'actualBalance',
    },
    {
      icon: <Target size={20} style={{ color: 'var(--color-neutral, #a1a1aa)' }} />,
      title: 'Saldo Esperado',
      desc: 'O valor ideal (alvo) que você deveria ter na conta naquele dia específico para terminar o período exatamente dentro da meta.',
      badge: 'targetBalance',
    },
    {
      icon: <Activity size={20} style={{ color: 'var(--color-primary)' }} />,
      title: 'Margem (ou Desempenho)',
      desc: 'A diferença calculada entre o Saldo Real e o Saldo Esperado (Real - Esperado). Se positivo (verde), você economizou no orçamento. Se negativo (vermelho), gastou a mais.',
      badge: 'margin',
    },
    {
      icon: <TrendingUp size={20} style={{ color: 'var(--color-above, #10b981)' }} />,
      title: 'Saldo Projetado',
      desc: 'A extrapolação matemática (linha de tendência) que indica como o seu Saldo Real vai se comportar no futuro se você mantiver a taxa de gastos atual.',
      badge: 'projectedBalance',
    },
    {
      icon: <Milestone size={20} style={{ color: 'var(--color-above, #10b981)' }} />,
      title: 'Ponto de Equilíbrio',
      desc: 'A data prevista em que a linha do Saldo Projetado cruza a linha do Saldo Esperado. Indica quando a sua Margem deixará de ser negativa e voltará a ficar positiva.',
      badge: 'breakEvenDate',
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass" 
        style={{ 
          border: '1px solid var(--card-border-hover)', 
          maxWidth: '600px', 
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={24} style={{ color: 'var(--color-primary)' }} />
            Guia de Termos do Budgeter
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

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.5 }}>
          Entenda as definições e fórmulas matemáticas usadas na nossa projeção financeira e no acompanhamento de gastos diários.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {terms.map((term, index) => (
            <div 
              key={index} 
              className="glass-enhanced-hover"
              style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                border: '1px solid var(--card-border)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start'
              }}
            >
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                padding: '10px', 
                borderRadius: '10px',
                border: '1px solid var(--card-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {term.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    {term.title}
                  </h4>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)', 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>
                    {term.badge}
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {term.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
