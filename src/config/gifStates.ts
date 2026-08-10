import type { BudgetMetrics } from '../types';

export type GifStateType = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'UNKNOWN';

export interface GifStateConfig {
  id: GifStateType;
  name: string;
  keywords: string[];
}

export const GIF_STATES: Record<GifStateType, GifStateConfig> = {
  UNKNOWN: {
    id: 'UNKNOWN',
    name: 'Aguardando Dados',
    keywords: ['esperando', 'entediado', 'carregando', 'aguardando']
  },
  POSITIVE: {
    id: 'POSITIVE',
    name: 'Saldo Positivo',
    keywords: [
      'ostentacao',
      'rico',
      'festa',
      'comemoracao',
      'dinheiro',
      'sucesso',
      'vitoria',
      'favoravel',
      'aleluia',
      'gratidao',
      'deus',
      'de boa'
    ]
  },
  NEUTRAL: {
    id: 'NEUTRAL',
    name: 'Saldo Neutro',
    keywords: [
      'tranquilo',
      'equilibrado',
      'na paz',
      'tudo certo',
      'calma',
      'ok',
      'estavel',
      'normal'
    ]
  },
  NEGATIVE: {
    id: 'NEGATIVE',
    name: 'Saldo Negativo',
    keywords: [
      'desespero',
      'chorando',
      'sem dinheiro',
      'liso',
      'falido',
      'suando frio',
      'perigo',
      'emergencia',
      'fogo'
    ]
  }
};

/**
 * Classifica as métricas do orçamento em um dos 3 estados principais:
 * - Saldo Positivo (difference > 0)
 * - Saldo Neutro (difference === 0)
 * - Saldo Negativo (difference < 0)
 * Ou UNKNOWN se nenhum saldo tiver sido registrado ainda.
 */
export const determineGifState = (metrics: BudgetMetrics): GifStateConfig => {
  if (metrics.recordedBalance === undefined || metrics.difference === undefined) {
    return GIF_STATES.UNKNOWN;
  }

  const { difference } = metrics;

  if (difference > 0) {
    return GIF_STATES.POSITIVE;
  } else if (difference < 0) {
    return GIF_STATES.NEGATIVE;
  } else {
    return GIF_STATES.NEUTRAL;
  }
};

/**
 * Seleciona aleatoriamente uma palavra-chave da lista de palavras do estado fornecido.
 */
export const getRandomKeyword = (stateConfig: GifStateConfig): string => {
  if (!stateConfig.keywords || stateConfig.keywords.length === 0) {
    return 'gif';
  }
  const randomIndex = Math.floor(Math.random() * stateConfig.keywords.length);
  return stateConfig.keywords[randomIndex];
};
