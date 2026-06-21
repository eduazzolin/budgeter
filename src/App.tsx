import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePeriods } from './hooks/usePeriods';
import { PeriodList } from './components/PeriodList';
import { PeriodDetail } from './components/PeriodDetail';
import { PeriodForm } from './components/PeriodForm';
import { AuthSettings } from './components/AuthSettings';
import { isFirebaseEnabled } from './firebase';
import type { Period } from './types';
import { 
  User, 
  Plus, 
  Cloud, 
  CloudOff, 
  Briefcase,
  LayoutDashboard,
  Menu
} from 'lucide-react';

function App() {
  const { 
    user, 
    loading: authLoading, 
    loginWithGoogle,
    logout
  } = useAuth();

  const {
    periods,
    selectedPeriod,
    selectedPeriodId,
    loading: periodsLoading,
    error: periodsError,
    selectPeriod,
    addPeriod,
    updatePeriod,
    deletePeriod,
    recordBalance,
    syncLocalData
  } = usePeriods(user?.uid);

  // Modal & Settings states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  // Handle Create or Edit Period form submit
  const handleFormSubmit = async (
    name: string,
    startDate: string,
    endDate: string,
    initialBudget: number,
    finalBudget: number
  ) => {
    if (editingPeriod) {
      await updatePeriod(editingPeriod.id, {
        name,
        startDate,
        endDate,
        initialBudget,
        finalBudget
      });
    } else {
      await addPeriod(name, startDate, endDate, initialBudget, finalBudget);
    }
  };

  const handleAddNewClick = () => {
    setEditingPeriod(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (period: Period) => {
    setEditingPeriod(period);
    setIsFormOpen(true);
  };

  const handleSelectPeriod = (id: string) => {
    selectPeriod(id);
    // Auto-scroll to detail panel on small screens
    if (window.innerWidth <= 968) {
      document.getElementById('detail-panel')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Loading Screen (Auth initialization check)
  if (authLoading && isFirebaseEnabled()) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-primary)', gap: '16px' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Conectando ao Firebase...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const isFirebaseMode = isFirebaseEnabled();

  return (
    <div>
      {/* Top Header Bar */}
      <header className="glass app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn btn-secondary hide-desktop"
            style={{ padding: '4px', border: 'none', background: 'transparent', boxShadow: 'none' }}
            onClick={() => setIsMobileListOpen(!isMobileListOpen)}
          >
            <Menu size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px var(--color-primary-glow)'
          }}>
            <Briefcase size={22} style={{ color: '#ffffff' }} />
          </div>
          <span className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.02em' }}>
            Budgeter
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Backend Status Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {isFirebaseMode ? (
              <>
                <Cloud size={14} style={{ color: 'var(--color-above)' }} />
                <span className="hide-mobile">Firebase Conectado</span>
              </>
            ) : (
              <>
                <CloudOff size={14} style={{ color: 'var(--color-neutral)' }} />
                <span className="hide-mobile">Modo Offline (Local)</span>
              </>
            )}
          </div>

          {/* Toggle Settings Button */}
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="btn btn-secondary"
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.85rem',
              borderColor: showSettings ? 'var(--color-primary)' : 'var(--card-border)',
              background: showSettings ? 'rgba(9, 9, 11, 0.05)' : '#ffffff'
            }}
          >
            <User size={15} /> 
            <span>{user ? 'Minha Conta' : 'Entrar / Login'}</span>
          </button>
        </div>
      </header>

      {periodsError && (
        <div className="periods-error-banner">
          <span style={{ fontWeight: 'bold', flexShrink: 0 }}>⚠️ Sincronização offline:</span>
          <span style={{ flex: 1 }}>{periodsError} (Exibindo dados locais seguros).</span>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', border: '1px solid #fecdd3', flexShrink: 0 }}
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <main className="dashboard-container">
        
        {/* Left Side: Period List + Settings (if open) */}
        <div className={isMobileListOpen ? '' : 'mobile-panel-hidden'} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Settings Box (Collapsible) */}
          {showSettings && (
            <AuthSettings 
              user={user}
              onLogout={logout}
              onLoginWithGoogle={loginWithGoogle}
              onSyncLocalData={syncLocalData}
            />
          )}

          {/* Period List Panel */}
          <PeriodList 
            periods={periods}
            selectedPeriodId={selectedPeriodId}
            onSelectPeriod={handleSelectPeriod}
            onEditPeriod={handleEditClick}
            onDeletePeriod={deletePeriod}
            onAddNewClick={handleAddNewClick}
          />
        </div>

        {/* Right Side: Detailed View */}
        <div id="detail-panel">
          {periodsLoading ? (
            <div className="glass" style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : selectedPeriod ? (
            <PeriodDetail 
              period={selectedPeriod}
              onRecordBalance={recordBalance}
            />
          ) : (
            <div className="glass" style={{ 
              padding: '60px 30px', 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '20px',
              minHeight: '400px',
              justifyContent: 'center'
            }}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px dashed var(--card-border)'
              }}>
                <LayoutDashboard size={36} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Nenhum contador ativo</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Crie um novo período de orçamento ou selecione um dos contadores da lista lateral para visualizar as projeções diárias e acompanhar seus saldos.
                </p>
              </div>
              <button onClick={handleAddNewClick} className="btn btn-primary">
                <Plus size={16} /> Criar Primeiro Período
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Period Modal Form */}
      <PeriodForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editPeriod={editingPeriod}
      />
    </div>
  );
}

export default App;
