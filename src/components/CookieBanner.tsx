import React, { useState, useEffect } from 'react';

interface CookieBannerProps {
  onOpenPrivacy: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenPrivacy }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('lgpd_consent_accepted');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('lgpd_consent_accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--bg-primary)',
      borderTop: '1px solid var(--card-border)',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
      zIndex: 9999,
      flexWrap: 'wrap'
    }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: '1 1 300px' }}>
        Utilizamos o armazenamento local e serviços de autenticação estritamente necessários para salvar seus contadores e manter você conectado (Privacy by Design). 
        Ao continuar utilizando o Budgeter, você concorda com a nossa{' '}
        <button 
          onClick={onOpenPrivacy}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--color-primary)', 
            padding: 0, 
            font: 'inherit', 
            cursor: 'pointer', 
            textDecoration: 'underline' 
          }}
        >
          Política de Privacidade (LGPD)
        </button>.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button 
          onClick={handleAccept} 
          className="btn btn-primary"
          style={{ padding: '8px 20px', fontSize: '0.85rem' }}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
};
