import React, { useState, useEffect, useRef } from 'react';
import { FileText, Check, Loader2, Save } from 'lucide-react';
import type { Period } from '../types';

interface PeriodNotesProps {
  period: Period;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
}

export const PeriodNotes: React.FC<PeriodNotesProps> = ({ period, onUpdateNotes }) => {
  const [text, setText] = useState(period.notes || '');
  const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  
  const currentPeriodId = useRef(period.id);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when active period changes
  useEffect(() => {
    if (currentPeriodId.current !== period.id) {
      currentPeriodId.current = period.id;
      setText(period.notes || '');
      setStatus('saved');
      setLastSavedTime(null);
    }
  }, [period.id]);

  const handleSave = async (contentToSave: string) => {
    try {
      setStatus('saving');
      await onUpdateNotes(period.id, contentToSave);
      setStatus('saved');
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Error saving period notes:', error);
      setStatus('unsaved');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    if (newText === (period.notes || '')) {
      setStatus('saved');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      return;
    }

    setStatus('unsaved');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave(newText);
    }, 800);
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    handleSave(text);
  };

  return (
    <div className="glass animate-in delay-200" style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h3 style={{ 
          fontSize: '1.2rem', 
          margin: 0, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
          <FileText size={18} style={{ color: 'var(--color-primary)' }} /> 
          Anotações do Período
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {status === 'saving' && (
              <>
                <Loader2 size={13} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                Salvando...
              </>
            )}
            {status === 'saved' && (
              <>
                <Check size={13} style={{ color: 'var(--color-above)' }} />
                {lastSavedTime ? `Salvo às ${lastSavedTime}` : 'Salvo'}
              </>
            )}
            {status === 'unsaved' && (
              <span style={{ color: 'var(--text-muted)' }}>Alterações pendentes...</span>
            )}
          </span>

          {status === 'unsaved' && (
            <button
              type="button"
              onClick={handleManualSave}
              className="btn btn-primary"
              style={{ 
                padding: '4px 12px', 
                fontSize: '0.8rem', 
                height: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Save size={13} />
              Salvar
            </button>
          )}
        </div>
      </div>

      <textarea
        className="input-field"
        value={text}
        onChange={handleTextChange}
        placeholder="Adicione anotações sobre este período (ex: - 15/08: Compra da geladeira R$ 2.500; - Viagem de fim de semana...)"
        rows={4}
        style={{
          width: '100%',
          resize: 'vertical',
          minHeight: '90px',
          maxHeight: '300px',
          fontFamily: 'inherit',
          fontSize: '0.95rem',
          lineHeight: '1.5',
          padding: '12px'
        }}
      />
    </div>
  );
};
