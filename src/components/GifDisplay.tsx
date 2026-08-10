import React, { useEffect, useState } from 'react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import type { BudgetMetrics } from '../types';
import { determineGifState, getRandomKeyword } from '../config/gifStates';

// Obtain API key from runtime window env, Vite build-time env, or fallback default
const API_KEY = window._env_?.VITE_GIPHY_API_KEY || import.meta.env.VITE_GIPHY_API_KEY || 'fiFPNFt9GWQOZdw2PbpbFiC4Zg6Wwdpp';
const gf = new GiphyFetch(API_KEY);

interface GifDisplayProps {
  metrics: BudgetMetrics;
}

export const GifDisplay: React.FC<GifDisplayProps> = ({ metrics }) => {
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const gifState = determineGifState(metrics);

  useEffect(() => {
    let mounted = true;
    
    const fetchGif = async () => {
      setLoading(true);

      // 1. Pick a random keyword from the state's keywords list
      const searchTerm = getRandomKeyword(gifState);

      try {
        // 2. Search Giphy with that random keyword (limit 25 to get a good pool of gifs)
        const res = await gf.search(searchTerm, { limit: 25, rating: 'g', lang: 'pt' });
        
        if (mounted && res.data && res.data.length > 0) {
          // 3. Pick a random GIF from the returned list
          const randomIndex = Math.floor(Math.random() * res.data.length);
          const selectedGif = res.data[randomIndex];
          const url = selectedGif.images.fixed_height?.url || selectedGif.images.original?.url;
          setGifUrl(url || null);
        } else if (mounted) {
          // Fallback to random endpoint if search yields no results
          const randomRes = await gf.random({ tag: searchTerm, type: 'gifs' });
          const url = randomRes.data?.images?.fixed_height?.url || randomRes.data?.images?.original?.url;
          setGifUrl(url || null);
        }
      } catch (error) {
        console.error('Error fetching GIF from Giphy SDK:', error);
        // Fallback fetch directly from Giphy API endpoint if SDK encounters issue
        try {
          const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=25&rating=g&lang=pt`);
          const json = await response.json();
          if (mounted && json.data && json.data.length > 0) {
            const randomIndex = Math.floor(Math.random() * json.data.length);
            const url = json.data[randomIndex].images.fixed_height?.url || json.data[randomIndex].images.original?.url;
            setGifUrl(url);
          }
        } catch (fetchErr) {
          console.error('Fallback fetch error:', fetchErr);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchGif();

    return () => {
      mounted = false;
    };
  }, [metrics.difference, metrics.recordedBalance]);

  return (
    <div className="gif-display-container glass" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      border: '1px solid var(--card-border)',
      borderRadius: '16px',
      marginTop: '16px',
      background: 'rgba(255, 255, 255, 0.03)'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '300px', 
        minHeight: '180px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        {loading ? (
          <div className="skeleton-pulse" style={{ width: '300px', height: '180px', borderRadius: '12px' }} />
        ) : gifUrl ? (
          <img 
            src={gifUrl} 
            alt={gifState.name} 
            style={{ width: '100%', height: 'auto', maxHeight: '220px', objectFit: 'cover', borderRadius: '12px' }} 
          />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum GIF encontrado</span>
        )}
      </div>
    </div>
  );
};
