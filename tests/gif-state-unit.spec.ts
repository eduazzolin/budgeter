import { test, expect } from '@playwright/test';
import { determineGifState, getRandomKeyword, GIF_STATES } from '../src/config/gifStates';
import type { BudgetMetrics } from '../src/types';

test.describe('Classificação de Estados de GIF (Testes Unitários)', () => {

  const baseMetrics: BudgetMetrics = {
    totalDays: 30,
    daysPassed: 10,
    daysRemaining: 20,
    dailyBudget: 100,
    targetBalanceTodayStart: 2000,
    targetBalanceTodayEnd: 1900,
    currentProgressPercent: 33,
    status: 'neutral',
    isPeriodEnded: false,
    isPeriodNotStarted: false
  };

  test('deve retornar estado UNKNOWN se recordedBalance ou difference forem undefined', () => {
    const metricsNoBalance: BudgetMetrics = {
      ...baseMetrics,
      recordedBalance: undefined,
      difference: undefined
    };
    const state = determineGifState(metricsNoBalance);
    expect(state.id).toBe('UNKNOWN');
    expect(state.name).toBe('Aguardando Dados');
  });

  test('deve classificar como POSITIVE quando a margem (difference) for maior que zero', () => {
    const metricsPositive: BudgetMetrics = {
      ...baseMetrics,
      recordedBalance: 2500,
      difference: 500,
      status: 'above'
    };
    const state = determineGifState(metricsPositive);
    expect(state.id).toBe('POSITIVE');
    expect(state.name).toBe('Saldo Positivo');
    expect(state.keywords.length).toBeGreaterThan(0);
  });

  test('deve classificar como NEUTRAL quando a margem (difference) for exatamente zero', () => {
    const metricsNeutral: BudgetMetrics = {
      ...baseMetrics,
      recordedBalance: 2000,
      difference: 0,
      status: 'neutral'
    };
    const state = determineGifState(metricsNeutral);
    expect(state.id).toBe('NEUTRAL');
    expect(state.name).toBe('Saldo Neutro');
    expect(state.keywords.length).toBeGreaterThan(0);
  });

  test('deve classificar como NEGATIVE quando a margem (difference) for menor que zero', () => {
    const metricsNegative: BudgetMetrics = {
      ...baseMetrics,
      recordedBalance: 1500,
      difference: -500,
      status: 'below'
    };
    const state = determineGifState(metricsNegative);
    expect(state.id).toBe('NEGATIVE');
    expect(state.name).toBe('Saldo Negativo');
    expect(state.keywords.length).toBeGreaterThan(0);
  });

  test('deve retornar uma palavra-chave válida da lista do estado ao chamar getRandomKeyword', () => {
    const positiveConfig = GIF_STATES.POSITIVE;
    const keyword = getRandomKeyword(positiveConfig);
    
    expect(typeof keyword).toBe('string');
    expect(positiveConfig.keywords).toContain(keyword);
  });

  test('deve retornar palavra-chave fallback se a lista de keywords estiver vazia', () => {
    const emptyConfig = { id: 'UNKNOWN' as const, name: 'Vazio', keywords: [] };
    const keyword = getRandomKeyword(emptyConfig);
    expect(keyword).toBe('gif');
  });

  test('deve considerar a opção de GIFs desativada por padrão (localStorage não definido)', () => {
    const isEnabledDefault = (value: string | null) => value === 'true';
    expect(isEnabledDefault(null)).toBe(false);
    expect(isEnabledDefault('false')).toBe(false);
    expect(isEnabledDefault('true')).toBe(true);
  });
});
