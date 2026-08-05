import React from 'react';
import { APP_VERSION } from '../version';

export const Footer: React.FC = () => {
  return (
    <footer className="glass app-footer" style={{
      marginTop: '40px',
      borderTop: '1px solid var(--card-border)',
      padding: '16px 24px',
      background: 'var(--card-bg)',
      color: 'var(--text-muted)',
      fontSize: '0.8rem'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          © {new Date().getFullYear()} Budgeter
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'monospace',
          fontSize: '0.78rem'
        }}>
          <span>versão</span>
          <span style={{
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--card-border)',
            color: 'var(--text-secondary)'
          }}>
            v{APP_VERSION}
          </span>
        </div>
      </div>
    </footer>
  );
};
