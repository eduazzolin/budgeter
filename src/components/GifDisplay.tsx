import React, { useEffect, useState } from 'react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Gif } from '@giphy/react-components';
import type { IGif } from '@giphy/js-types';
import type { BudgetMetrics } from '../types';
import { determineGifState } from '../config/gifStates';

// Initialize Giphy Fetch with API key from environment variables
const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || '');

interface GifDisplayProps {
  metrics: BudgetMetrics;
}

export const GifDisplay: React.FC<GifDisplayProps> = ({ metrics }) => {
  const [gif, setGif] = useState<IGif | null>(null);
  const [loading, setLoading] = useState(true);
  
  const gifState = determineGifState(metrics);

  useEffect(() => {
    let mounted = true;
    
    const fetchGif = async () => {
      setLoading(true);
      try {
        // Fetch a random gif based on the search term tag
        const { data } = await gf.random({ tag: gifState.searchTerm, type: 'gifs' });
        if (mounted) {
          setGif(data);
        }
      } catch (error) {
        console.error('Error fetching GIF from Giphy:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (import.meta.env.VITE_GIPHY_API_KEY) {
      fetchGif();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [gifState.id, gifState.searchTerm]);

  if (!import.meta.env.VITE_GIPHY_API_KEY) {
    return null; // Render nothing if API key is missing
  }

  return (
    <div className="gif-display-container glass" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      border: '1px solid var(--card-border)',
      borderRadius: '16px',
      marginTop: '16px'
    }}>
      <div style={{ width: '100%', textAlign: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Mood Atual: <strong style={{ color: 'var(--text-primary)' }}>{gifState.name}</strong>
        </h4>
      </div>
      
      <div style={{ 
        width: '100%', 
        maxWidth: '300px', 
        minHeight: '200px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: '12px'
      }}>
        {loading ? (
          <div className="skeleton-pulse" style={{ width: '300px', height: '200px', borderRadius: '12px' }} />
        ) : gif ? (
          <Gif gif={gif} width={300} borderRadius={12} noLink={true} hideAttribution={true} />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sem sinal de GIF...</span>
        )}
      </div>
    </div>
  );
};
