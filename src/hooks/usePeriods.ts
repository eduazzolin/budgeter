import { useState, useEffect, useCallback } from 'react';
import type { Period } from '../types';
import { dbService } from '../services/db';

export const usePeriods = (userId?: string) => {
  // 1. Synchronously hydrate state from local storage cache for instant 0ms startup
  const [periods, setPeriods] = useState<Period[]>(() => {
    const cached = localStorage.getItem('budgeter_periods');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Period[];
        return parsed.sort((a, b) => {
          const orderA = a.sortOrder !== undefined ? a.sortOrder : Number.MIN_SAFE_INTEGER;
          const orderB = b.sortOrder !== undefined ? b.sortOrder : Number.MIN_SAFE_INTEGER;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // If we have cached periods locally, do not show loading state on open
  const [loading, setLoading] = useState<boolean>(() => periods.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(() => {
    const storedId = localStorage.getItem('budgeter_selected_period_id');
    if (storedId) return storedId;
    const cached = localStorage.getItem('budgeter_periods');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Period[];
        return parsed.length > 0 ? parsed[0].id : null;
      } catch {}
    }
    return null;
  });

  const selectPeriod = useCallback((id: string | null) => {
    setSelectedPeriodId(id);
    if (id) {
      localStorage.setItem('budgeter_selected_period_id', id);
    } else {
      localStorage.removeItem('budgeter_selected_period_id');
    }
  }, []);

  const fetchPeriods = useCallback(async () => {
    try {
      // Only set loading to true if we have no local cached periods to prevent UI flicker
      if (periods.length === 0) {
        setLoading(true);
      }
      setError(null);
      const data = await dbService.getPeriods(userId);
      setPeriods(data);
      
      // Auto-select period if none is selected or if the selected one doesn't exist anymore
      if (data.length > 0) {
        if (!selectedPeriodId || !data.some(p => p.id === selectedPeriodId)) {
          const storedId = localStorage.getItem('budgeter_selected_period_id');
          const exists = storedId ? data.some(p => p.id === storedId) : false;
          if (exists && storedId) {
            setSelectedPeriodId(storedId);
          } else {
            selectPeriod(data[0].id);
          }
        }
      } else {
        setSelectedPeriodId(null);
        localStorage.removeItem('budgeter_selected_period_id');
      }
    } catch (err: any) {
      console.error('Failed to fetch from Firestore, falling back to LocalStorage:', err);
      setError(err.message || 'Falha ao sincronizar dados com o Firebase.');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedPeriodId, selectPeriod, periods.length]);

  // Fetch data on user change
  useEffect(() => {
    fetchPeriods();
    // We intentionally only run this when the userId changes to prevent infinite fetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const addPeriod = async (
    name: string,
    startDate: string,
    endDate: string,
    initialBudget: number,
    finalBudget: number = 0
  ) => {
    try {
      setError(null);
      const newPeriod = await dbService.createPeriod({
        name,
        startDate,
        endDate,
        initialBudget,
        finalBudget
      }, userId);
      
      setPeriods(prev => [newPeriod, ...prev]);
      selectPeriod(newPeriod.id);
      return newPeriod;
    } catch (err: any) {
      setError(err.message || 'Falha ao adicionar período.');
      throw err;
    }
  };

  const updatePeriod = async (id: string, updates: Partial<Omit<Period, 'id' | 'createdAt'>>) => {
    try {
      setError(null);
      await dbService.updatePeriod(id, updates);
      setPeriods(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar período.');
      throw err;
    }
  };

  const deletePeriod = async (id: string) => {
    try {
      setError(null);
      await dbService.deletePeriod(id);
      setPeriods(prev => {
        const next = prev.filter(p => p.id !== id);
        if (selectedPeriodId === id) {
          if (next.length > 0) {
            selectPeriod(next[0].id);
          } else {
            selectPeriod(null);
          }
        }
        return next;
      });
    } catch (err: any) {
      setError(err.message || 'Falha ao excluir período.');
      throw err;
    }
  };

  const recordBalance = async (id: string, balance: number, date: string) => {
    try {
      setError(null);
      const period = periods.find(p => p.id === id);
      const history = period?.balanceHistory || {};
      const updates = {
        currentBalance: balance,
        currentBalanceDate: date,
        balanceHistory: {
          ...history,
          [date]: balance
        }
      };
      await dbService.updatePeriod(id, updates);
      setPeriods(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar Saldo Real.');
      throw err;
    }
  };

  const deleteBalance = async (id: string, date: string) => {
    try {
      setError(null);
      const period = periods.find(p => p.id === id);
      if (!period) return;

      const history = { ...period.balanceHistory };
      delete history[date];

      const dates = Object.keys(history).sort();
      let currentBalance: number | undefined = undefined;
      let currentBalanceDate: string | undefined = undefined;

      if (dates.length > 0) {
        const latestDate = dates[dates.length - 1];
        currentBalance = history[latestDate];
        currentBalanceDate = latestDate;
      }

      const updates = {
        currentBalance,
        currentBalanceDate,
        balanceHistory: history
      };

      await dbService.updatePeriod(id, updates);
      setPeriods(prev => prev.map(p => p.id === id ? {
        ...p,
        currentBalance,
        currentBalanceDate,
        balanceHistory: history
      } : p));
    } catch (err: any) {
      setError(err.message || 'Falha ao remover Saldo Real.');
      throw err;
    }
  };

  const syncLocalData = async () => {
    if (userId) {
      setLoading(true);
      await dbService.syncLocalToFirebase(userId);
      await fetchPeriods();
    }
  };

  const reorderPeriods = async (updatedPeriods: Period[]) => {
    const periodsWithNewOrder = updatedPeriods.map((p, idx) => ({
      ...p,
      sortOrder: idx
    }));

    setPeriods(periodsWithNewOrder);

    try {
      setError(null);
      const promises = periodsWithNewOrder.map((p) => 
        dbService.updatePeriod(p.id, { sortOrder: p.sortOrder })
      );
      await Promise.all(promises);
    } catch (err: any) {
      console.error('Failed to save reordered periods:', err);
      setError(err.message || 'Falha ao salvar a nova ordem dos contadores.');
      fetchPeriods();
    }
  };

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId) || null;

  return {
    periods,
    selectedPeriod,
    selectedPeriodId,
    loading,
    error,
    selectPeriod,
    addPeriod,
    updatePeriod,
    deletePeriod,
    recordBalance,
    deleteBalance,
    syncLocalData,
    reorderPeriods,
    refresh: fetchPeriods
  };
};
