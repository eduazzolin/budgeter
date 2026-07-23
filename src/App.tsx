import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePeriods } from './hooks/usePeriods';
import { PeriodList } from './components/PeriodList';
import { PeriodDetail } from './components/PeriodDetail';
import { PeriodForm } from './components/PeriodForm';
import { AuthSettings } from './components/AuthSettings';
import { HelpModal } from './components/HelpModal';
import { PrivacyModal } from './components/PrivacyModal';
import { CookieBanner } from './components/CookieBanner';
import { isFirebaseEnabled } from './firebase';
import { SkeletonPeriodList, SkeletonPeriodDetail } from './components/SkeletonDashboard';
import type { Period } from './types';
import { 
  User, 
  Plus, 
  Briefcase,
  LayoutDashboard,
  Menu,
  HelpCircle,
  ShieldCheck
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
    deleteBalance,
    syncLocalData
  } = usePeriods(user?.uid);

  const isLoading = (authLoading && isFirebaseEnabled()) || periodsLoading;

  // Modal & Settings states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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





  return (
    <div>
      {/* Top Header Bar */}
      <header className="glass app-header">
        <div>
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
            <Briefcase size={22} style={{ color: 'var(--bg-primary)' }} />
          </div>
          <span className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
            Budgeter
          </span>
        </div>

        <div>


          {/* Help Button */}
          <button 
            onClick={() => setIsHelpOpen(true)} 
            className="btn btn-secondary hide-mobile-text header-btn"
            style={{ 
              borderColor: 'var(--card-border)',
              background: 'var(--card-bg)'
            }}
            title="Ajuda / Glossário"
          >
            <HelpCircle size={15} />
            <span>Ajuda</span>
          </button>

          {/* Privacy Button */}
          <button 
            onClick={() => setIsPrivacyOpen(true)} 
            className="btn btn-secondary hide-mobile-text header-btn"
            style={{ 
              borderColor: 'var(--card-border)',
              background: 'var(--card-bg)'
            }}
            title="Política de Privacidade (LGPD)"
          >
            <ShieldCheck size={15} />
            <span>Privacidade</span>
          </button>

          {/* Toggle Settings Button */}
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="btn btn-secondary hide-mobile-text header-btn"
            style={{ 
              borderColor: showSettings ? 'var(--color-primary)' : 'var(--card-border)',
              background: showSettings ? 'var(--bg-secondary)' : 'var(--card-bg)',
              pointerEvents: isLoading ? 'none' : 'auto'
            }}
            disabled={isLoading}
          >
            <User size={15} /> 
            {isLoading ? (
              <div className="skeleton-pulse" style={{ width: '80px', height: '14px', borderRadius: '3px' }} />
            ) : (
              <span>{user ? 'Minha Conta' : 'Entrar / Login'}</span>
            )}
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
      <main className="dashboard-container animate-in">
        
        {/* Left Side: Period List + Settings (if open) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Settings Box (Collapsible) */}
          {showSettings && (
            <AuthSettings 
              user={user}
              onLogout={logout}
              onLoginWithGoogle={loginWithGoogle}
              onSyncLocalData={syncLocalData}
              theme={theme}
              onThemeChange={setTheme}
            />
          )}

          {/* Period List Panel */}
          <div className={isMobileListOpen ? '' : 'mobile-panel-hidden'} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {isLoading ? (
              <SkeletonPeriodList />
            ) : (
              <PeriodList 
                periods={periods}
                selectedPeriodId={selectedPeriodId}
                onSelectPeriod={handleSelectPeriod}
                onEditPeriod={handleEditClick}
                onDeletePeriod={deletePeriod}
                onAddNewClick={handleAddNewClick}
              />
            )}
          </div>
        </div>

        {/* Right Side: Detailed View */}
        <div id="detail-panel">
          {isLoading ? (
            <SkeletonPeriodDetail />
          ) : selectedPeriod ? (
            <PeriodDetail 
              period={selectedPeriod}
              onRecordBalance={recordBalance}
              onDeleteBalance={deleteBalance}
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
                  Crie um novo período de orçamento ou selecione um dos contadores da lista lateral para visualizar as projeções diárias e acompanhar sua Margem e Saldo Real.
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

      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Privacy Modal */}
      <PrivacyModal 
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      {/* LGPD Cookie Banner */}
      <CookieBanner 
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />
    </div>
  );
}

export default App;
