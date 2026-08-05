import React from 'react';
import { Briefcase, HelpCircle, ShieldCheck, User, Cloud, CloudOff } from 'lucide-react';
import { APP_VERSION } from '../version';
import { isFirebaseEnabled } from '../firebase';

interface FooterProps {
  onOpenHelp: () => void;
  onOpenPrivacy: () => void;
  onToggleSettings: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenHelp,
  onOpenPrivacy,
  onToggleSettings,
}) => {
  const firebaseActive = isFirebaseEnabled();

  return (
    <footer className="app-footer glass" style={{
      marginTop: '60px',
      borderTop: '1px solid var(--card-border)',
      padding: '32px 24px',
      background: 'var(--card-bg)',
      color: 'var(--text-secondary)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Top Row: Brand Info + Quick Action Links */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--card-border)'
        }}>
          {/* Brand & Version Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px var(--color-primary-glow)'
            }}>
              <Briefcase size={18} style={{ color: 'var(--bg-primary)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="font-display" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  Budgeter
                </span>
                <span 
                  className="version-badge"
                  title={`Versão do sistema: v${APP_VERSION}`}
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    fontFamily: 'monospace'
                  }}
                >
                  v{APP_VERSION}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Planejamento financeiro simples, previsível e focado na sua meta diária
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', fontSize: '0.85rem' }}>
            <button
              onClick={onOpenHelp}
              className="footer-link-btn"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <HelpCircle size={15} /> Ajuda & Termos
            </button>

            <button
              onClick={onOpenPrivacy}
              className="footer-link-btn"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <ShieldCheck size={15} /> Privacidade (LGPD)
            </button>

            <button
              onClick={onToggleSettings}
              className="footer-link-btn"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <User size={15} /> Minha Conta
            </button>
          </div>
        </div>

        {/* Bottom Row: System Connection Status + Copyright */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            © {new Date().getFullYear()} Budgeter. Todos os direitos reservados.
          </div>

          {/* Connection Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--card-border)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              {firebaseActive ? (
                <>
                  <Cloud size={13} style={{ color: 'var(--color-above)' }} />
                  Nuvem Ativa (Firebase)
                </>
              ) : (
                <>
                  <CloudOff size={13} style={{ color: 'var(--color-neutral)' }} />
                  Modo Local (Offline)
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
