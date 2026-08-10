import React, { useState } from 'react';
import type { AppUser } from '../services/auth';
import { isFirebaseEnabled } from '../firebase';
import { dbService } from '../services/db';
import { authService } from '../services/auth';
import { APP_VERSION } from '../version';
import { 
  CloudOff, 
  Info, 
  LogOut, 
  RefreshCw,
  Trash2,
  Sun,
  Moon,
  X,
  User
} from 'lucide-react';

interface AuthSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  onLogout: () => Promise<void>;
  onLoginWithGoogle: () => Promise<void>;
  onSyncLocalData: () => Promise<void>;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

export const AuthSettings: React.FC<AuthSettingsProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onLoginWithGoogle,
  onSyncLocalData,
  theme,
  onThemeChange
}) => {
  const firebaseActive = isFirebaseEnabled();
  const [syncing, setSyncing] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      "Tem certeza absoluta que deseja excluir sua conta e TODOS os seus dados? Esta ação é irreversível e garantida pela LGPD."
    );
    
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      setAuthError(null);
      // 1. Delete user data
      await dbService.deleteAllUserPeriods(user.uid);
      // 2. Delete auth account
      await authService.deleteAccount();
      // On success, the auth listener will catch the signout/deletion and update UI
      alert("Sua conta e dados foram excluídos com sucesso.");
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/requires-recent-login') {
        alert("Por questões de segurança, você precisa ter feito login recentemente para excluir sua conta. Por favor, saia (logout), faça login novamente e tente excluir a conta.");
      } else {
        alert("Erro ao excluir conta: " + err.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      setAuthLoading(true);
      await onLoginWithGoogle();
      onClose();
    } catch (err: any) {
      setAuthError(err.message || 'Falha ao autenticar com o Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSyncClick = async () => {
    try {
      setSyncing(true);
      await onSyncLocalData();
      alert('Sincronização concluída com sucesso!');
    } catch (err: any) {
      alert('Erro ao sincronizar dados: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content glass" style={{ maxWidth: '480px', width: '90%', padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
          <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
            <User size={20} style={{ color: 'var(--color-primary)' }} />
            {user ? 'Minha Conta' : 'Entrar / Login'}
          </h2>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', height: 'auto' }} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
          {!firebaseActive ? (
            /* Offline Mode Content */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CloudOff size={20} style={{ color: 'var(--color-neutral)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Modo Offline (Local)</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                O Firebase não está configurado. Para habilitar sincronização em nuvem e login com o Google, adicione suas credenciais no arquivo <code>.env</code> do projeto.
              </p>
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                padding: '10px 12px', 
                background: 'rgba(15, 23, 42, 0.03)', 
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                <Info size={16} style={{ color: 'var(--color-neutral)', flexShrink: 0, marginTop: '2px' }} />
                <span>Seus contadores estão ativos e sendo salvos localmente neste navegador.</span>
              </div>
            </>
          ) : user ? (
            /* Logged In Content */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="glass" style={{ padding: '16px', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'Google User'} 
                      referrerPolicy="no-referrer"
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--card-border)' }}
                    />
                  ) : (
                    <div style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}>
                      {user.displayName ? user.displayName.substring(0, 1).toUpperCase() : 'G'}
                    </div>
                  )}
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, display: 'block', fontSize: '0.95rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user.displayName || 'Usuário Google'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="badge badge-above" style={{ alignSelf: 'flex-start', textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}>
                  ✓ Conectado e Sincronizando
                </div>

                <button 
                  onClick={handleSyncClick}
                  className="btn btn-secondary"
                  style={{ display: 'flex', gap: '8px', width: '100%', padding: '8px 12px', fontSize: '0.85rem', justifyContent: 'center' }}
                  disabled={syncing}
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                  Enviar dados do navegador para nuvem
                </button>

                <button 
                  onClick={async () => {
                    await onLogout();
                    onClose();
                  }} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', gap: '8px', border: '1px solid var(--card-border)' }}
                >
                  <LogOut size={14} /> Sair da Conta
                </button>

                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="btn btn-danger" 
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', gap: '8px', opacity: isDeleting ? 0.7 : 1 }}
                  title="Excluir permanentemente sua conta e todos os seus dados salvos (LGPD)"
                >
                  <Trash2 size={14} className={isDeleting ? 'animate-pulse' : ''} />
                  {isDeleting ? 'Excluindo...' : 'Excluir Conta e Dados'}
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out Content */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Você está operando em <strong>Modo Local (Offline)</strong>. Faça login com o Google para salvar seus contadores na nuvem e sincronizar entre dispositivos.
              </p>

              {authError && (
                <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.15)', color: 'var(--color-below)', padding: '10px', borderRadius: '4px', fontSize: '0.8rem' }}>
                  {authError}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="btn"
                style={{
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer'
                }}
                disabled={authLoading}
              >
                {authLoading ? (
                  <div style={{ border: '2px solid rgba(0,0,0,0.1)', borderTop: '2px solid #18181b', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}></div>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.683 5.482 18 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.707c-.18-.54-.282-1.119-.282-1.707 0-.588.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.32 0 2.508.454 3.44 1.345l2.582-2.58C13.463.806 11.426 0 9 0 5.482 0 2.438 2.317.957 5.27l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                )}
                <span>Entrar com o Google</span>
              </button>
            </div>
          )}

          {/* Theme Selector */}
          <div style={{ 
            borderTop: '1px solid var(--card-border)', 
            paddingTop: '16px',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px' 
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Aparência
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button"
                onClick={() => onThemeChange('light')}
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Sun size={14} /> Claro
              </button>
              <button 
                type="button"
                onClick={() => onThemeChange('dark')}
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Moon size={14} /> Escuro
              </button>
            </div>
          </div>

          {/* System Version Info */}
          <div style={{ 
            borderTop: '1px solid var(--card-border)', 
            paddingTop: '12px',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-muted)'
          }}>
            <span>Versão do sistema</span>
            <span style={{ 
              fontFamily: 'monospace', 
              fontWeight: 700, 
              padding: '2px 6px', 
              borderRadius: '4px', 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--card-border)',
              color: 'var(--text-secondary)' 
            }}>
              v{APP_VERSION}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

