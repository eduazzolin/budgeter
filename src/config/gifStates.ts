import type { BudgetMetrics } from '../types';

export type GifStateType = 
  | 'UNKNOWN'
  | 'GOD_OF_WEALTH'
  | 'BALLING'
  | 'CHILL'
  | 'ON_TRACK'
  | 'ATTENTION'
  | 'SWEATING'
  | 'SURVIVAL'
  | 'DESPAIR'
  | 'BURNING'
  | 'MISSION_ACCOMPLISHED';

export interface GifStateConfig {
  id: GifStateType;
  name: string;
  searchTerm: string;
}

export const GIF_STATES: Record<GifStateType, GifStateConfig> = {
  UNKNOWN: {
    id: 'UNKNOWN',
    name: 'Desconhecido',
    searchTerm: 'waiting bored'
  },
  GOD_OF_WEALTH: {
    id: 'GOD_OF_WEALTH',
    name: 'Deus da Riqueza',
    searchTerm: 'making it rain rich'
  },
  BALLING: {
    id: 'BALLING',
    name: 'Ostentação',
    searchTerm: 'balling luxury'
  },
  CHILL: {
    id: 'CHILL',
    name: 'Tranquilo e Favorável',
    searchTerm: 'chill relax'
  },
  ON_TRACK: {
    id: 'ON_TRACK',
    name: 'No Caminho Certo',
    searchTerm: 'thumbs up steady'
  },
  ATTENTION: {
    id: 'ATTENTION',
    name: 'Atenção',
    searchTerm: 'cautious hmm'
  },
  SWEATING: {
    id: 'SWEATING',
    name: 'Suando Frio',
    searchTerm: 'sweating nervous'
  },
  SURVIVAL: {
    id: 'SURVIVAL',
    name: 'Modo Sobrevivência',
    searchTerm: 'struggle empty wallet'
  },
  DESPAIR: {
    id: 'DESPAIR',
    name: 'Desespero',
    searchTerm: 'crying broke'
  },
  BURNING: {
    id: 'BURNING',
    name: 'Tudo em Chamas',
    searchTerm: 'this is fine burning'
  },
  MISSION_ACCOMPLISHED: {
    id: 'MISSION_ACCOMPLISHED',
    name: 'Missão Cumprida',
    searchTerm: 'mission accomplished celebration'
  }
};

/**
 * Determina o estado atual do GIF com base nas métricas do orçamento.
 */
export const determineGifState = (metrics: BudgetMetrics): GifStateConfig => {
  if (metrics.recordedBalance === undefined || metrics.difference === undefined) {
    return GIF_STATES.UNKNOWN;
  }

  const { difference, dailyBudget, daysRemaining, status, isPeriodEnded } = metrics;

  if (isPeriodEnded) {
    if (status === 'above' || status === 'neutral') {
      return GIF_STATES.MISSION_ACCOMPLISHED;
    } else {
      return GIF_STATES.BURNING;
    }
  }

  if (status === 'above' || status === 'neutral') {
    if (dailyBudget > 0) {
      const daysAhead = difference / dailyBudget;
      if (daysAhead >= 15) return GIF_STATES.GOD_OF_WEALTH;
      if (daysAhead >= 7) return GIF_STATES.BALLING;
      if (daysAhead >= 3) return GIF_STATES.CHILL;
    }
    return GIF_STATES.ON_TRACK;
  } else {
    if (dailyBudget > 0) {
      const daysToRecover = Math.ceil(Math.abs(difference) / dailyBudget);
      
      if (daysToRecover > daysRemaining) {
        return GIF_STATES.DESPAIR;
      }
      if (daysToRecover > 7) {
        return GIF_STATES.SURVIVAL;
      }
      if (daysToRecover > 3) {
        return GIF_STATES.SWEATING;
      }
      return GIF_STATES.ATTENTION;
    } else {
      return GIF_STATES.BURNING;
    }
  }
};
