import React from 'react';
import { Plus, Calendar, Clock, DollarSign } from 'lucide-react';

export const SkeletonPeriodList: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Seus Contadores
        </h2>
        <button 
          className="btn btn-primary" 
          style={{ padding: '8px 12px', fontSize: '0.85rem', opacity: 0.7, pointerEvents: 'none' }}
          disabled
        >
          <Plus size={16} /> Novo
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'hidden', paddingRight: '4px' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass"
            style={{
              padding: '16px',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--card-border)',
              backgroundColor: 'var(--card-bg)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton-pulse" style={{ height: '18px', width: '50%', borderRadius: '4px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="skeleton-pulse" style={{ height: '14px', width: '14px', borderRadius: '3px' }} />
                <div className="skeleton-pulse" style={{ height: '14px', width: '14px', borderRadius: '3px' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="skeleton-pulse" style={{ height: '12px', width: '35%', borderRadius: '3px' }} />
              <div className="skeleton-pulse" style={{ height: '12px', width: '25%', borderRadius: '3px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <div className="skeleton-pulse" style={{ height: '14px', width: '40%', borderRadius: '3px' }} />
              <div className="skeleton-pulse" style={{ height: '18px', width: '30%', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonPeriodDetail: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Period Header */}
      <div>
        <div className="skeleton-pulse" style={{ height: '36px', width: '220px', borderRadius: '6px', marginBottom: '8px' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} /> 
            <span className="skeleton-pulse" style={{ height: '14px', width: '90px', borderRadius: '3px' }} />
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} /> 
            <span className="skeleton-pulse" style={{ height: '14px', width: '80px', borderRadius: '3px' }} />
          </span>
        </div>
      </div>

      {/* SECTION 1: Record Current Balance */}
      <div className="glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <DollarSign size={18} style={{ color: 'var(--text-muted)' }} /> 
          <span className="skeleton-pulse" style={{ height: '16px', width: '150px', borderRadius: '4px' }} />
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 200px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
              <span className="skeleton-pulse" style={{ height: '12px', width: '80px', borderRadius: '3px' }} />
            </label>
            <div className="skeleton-pulse" style={{ height: '40px', width: '100%', borderRadius: 'var(--border-radius-sm)' }} />
            
            {/* Operators shortcut bar */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-pulse" style={{ width: '28px', height: '24px', borderRadius: 'var(--border-radius-sm)' }} />
              ))}
            </div>
          </div>
          
          <div className="skeleton-pulse" style={{ height: '40px', width: '120px', borderRadius: 'var(--border-radius-sm)' }} />
        </div>
      </div>

      {/* SECTION 2: Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {/* Metric 1 */}
        <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '140px', justifyContent: 'space-between' }}>
          <div className="skeleton-pulse" style={{ height: '14px', width: '120px', borderRadius: '4px' }} />
          <div className="skeleton-pulse" style={{ height: '36px', width: '160px', borderRadius: '6px' }} />
          <div className="skeleton-pulse" style={{ height: '12px', width: '180px', borderRadius: '4px' }} />
        </div>
        {/* Metric 2 */}
        <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '140px', justifyContent: 'space-between' }}>
          <div className="skeleton-pulse" style={{ height: '14px', width: '100px', borderRadius: '4px' }} />
          <div className="skeleton-pulse" style={{ height: '36px', width: '140px', borderRadius: '6px' }} />
          <div className="skeleton-pulse" style={{ height: '12px', width: '200px', borderRadius: '4px' }} />
        </div>
        {/* Metric 3 */}
        <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '140px', justifyContent: 'space-between' }}>
          <div className="skeleton-pulse" style={{ height: '14px', width: '150px', borderRadius: '4px' }} />
          <div className="skeleton-pulse" style={{ height: '36px', width: '110px', borderRadius: '6px' }} />
          <div className="skeleton-pulse" style={{ height: '12px', width: '160px', borderRadius: '4px' }} />
        </div>
      </div>

      {/* SECTION 3: Chart Card */}
      <div className="glass" style={{ padding: '24px' }}>
        <div className="skeleton-pulse" style={{ height: '18px', width: '140px', borderRadius: '4px', marginBottom: '20px' }} />
        <div className="skeleton-pulse" style={{ height: '250px', width: '100%', borderRadius: '6px' }} />
      </div>

      {/* SECTION 4: Table Card */}
      <div className="glass" style={{ padding: '24px' }}>
        <div className="skeleton-pulse" style={{ height: '18px', width: '150px', borderRadius: '4px', marginBottom: '20px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', gap: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--card-border)' }}>
            <div className="skeleton-pulse" style={{ height: '14px', flex: 1, borderRadius: '4px' }} />
            <div className="skeleton-pulse" style={{ height: '14px', flex: 1, borderRadius: '4px' }} />
            <div className="skeleton-pulse" style={{ height: '14px', flex: 1, borderRadius: '4px' }} />
            <div className="skeleton-pulse" style={{ height: '14px', flex: 1, borderRadius: '4px' }} />
          </div>
          {/* Data rows */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div className="skeleton-pulse" style={{ height: '14px', flex: 1, borderRadius: '4px' }} />
              <div className="skeleton-pulse" style={{ height: '14px', flex: 1, borderRadius: '4px' }} />
              <div className="skeleton-pulse" style={{ height: '14px', flex: 1, borderRadius: '4px' }} />
              <div className="skeleton-pulse" style={{ height: '14px', flex: 1, borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
