import React from 'react';
import { X, ShieldCheck, Database, Trash2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={24} style={{ color: 'var(--color-primary)' }} />
            Privacidade e Termos (LGPD)
          </h2>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 20px' }}>
          
          <section>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={18} style={{ color: 'var(--color-primary)' }} />
              Coleta e Armazenamento de Dados
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              O <strong>Budgeter</strong> valoriza a sua privacidade. Por padrão, nosso aplicativo opera de forma <strong>Offline-First</strong>. Isso significa que todos os seus dados orçamentários são salvos exclusivamente no armazenamento local (`localStorage`) do seu navegador. 
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '8px' }}>
              Se você optar por fazer login com sua conta do Google, nós armazenaremos seu nome, email e foto de perfil, além de sincronizar seus períodos financeiros nos nossos servidores protegidos do Google (Firebase Firestore) para permitir o acesso multi-dispositivos.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={18} style={{ color: 'var(--color-below)' }} />
              Seus Direitos (Direito ao Esquecimento)
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Em total conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>, você tem controle total sobre suas informações. 
              A qualquer momento, na aba "Minha Conta", você pode utilizar a opção <strong>"Excluir Conta e Dados"</strong>. 
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '8px' }}>
              Esta ação removerá instantânea e permanentemente sua conta de autenticação e todo o seu histórico financeiro de nossos servidores, não deixando cópias residuais.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🍪 Uso de Cookies
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Não utilizamos cookies de rastreamento para anúncios ou marketing. Utilizamos apenas tecnologias essenciais (como o localStorage e sessões seguras) estritamente necessárias para manter você conectado e salvar suas informações locais.
            </p>
          </section>

        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
