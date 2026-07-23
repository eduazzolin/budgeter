import React from 'react';
import { X, HelpCircle, DollarSign, Target, TrendingUp, Activity, Milestone, Mail, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GithubIcon: React.FC<{ size?: number; style?: React.CSSProperties; className?: string }> = ({ size = 16, style, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    style={style}
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

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

        {/* Créditos do Projeto */}
        <div 
          className="glass-enhanced"
          style={{ 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid rgba(99, 102, 241, 0.2)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
            <Sparkles size={16} style={{ color: '#a855f7' }} />
            <span>Créditos do Projeto</span>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <a 
              href="https://github.com/eduazzolin" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                color: 'var(--text-secondary)', 
                textDecoration: 'none', 
                fontSize: '0.85rem',
                transition: 'color 0.2s ease'
              }}
              className="hover-white"
            >
              <GithubIcon size={16} />
              github.com/eduazzolin
            </a>

            <a 
              href="mailto:eduduazzolin@gmail.com" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                color: 'var(--text-secondary)', 
                textDecoration: 'none', 
                fontSize: '0.85rem',
                transition: 'color 0.2s ease'
              }}
              className="hover-white"
            >
              <Mail size={16} />
              eduduazzolin@gmail.com
            </a>
          </div>

          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-muted)', 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
            paddingTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            Vibecoded com <span style={{ 
              background: 'linear-gradient(90deg, #6366f1, #a855f7)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              fontWeight: 700 
            }}>Antigravity</span> 🌌
          </div>
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
