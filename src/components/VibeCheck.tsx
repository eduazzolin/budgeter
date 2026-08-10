import React from 'react';
import type { BudgetMetrics } from '../types';
import { Sparkles, AlertTriangle, Flame } from 'lucide-react';

interface VibeCheckProps {
  metrics: BudgetMetrics;
}

export const VibeCheck: React.FC<VibeCheckProps> = ({ metrics }) => {
  // If there's no recorded balance, we can't give a vibe check
  if (metrics.recordedBalance === undefined || metrics.difference === undefined) {
    return null;
  }

  const { difference, dailyBudget, daysRemaining, status, isPeriodEnded } = metrics;

  // Determine the Vibe State
  let vibeType: 'high' | 'warn' | 'survival' = 'high';
  let title = '';
  let message = '';
  let Icon = Sparkles;

  if (isPeriodEnded) {
    if (status === 'above' || status === 'neutral') {
      vibeType = 'high';
      title = 'Missão Cumprida ✨';
      message = 'Você terminou o período dentro da meta! Excelente!';
      Icon = Sparkles;
    } else {
      vibeType = 'survival';
      title = 'Período Encerrado no Vermelho 🚨';
      message = 'Você fechou o ciclo gastando mais do que planejou.';
      Icon = Flame;
    }
  } else {
    if (status === 'above' || status === 'neutral') {
      vibeType = 'high';
      title = 'Vibe Alta 🌿';
      message = 'Tudo sob controle. Seu planejamento está perfeito, continue assim!';
      Icon = Sparkles;
    } else {
      // Below target. Let's see if break-even happens inside the period
      const daysToRecover = dailyBudget > 0 ? Math.ceil(Math.abs(difference) / dailyBudget) : Infinity;
      
      if (daysToRecover <= daysRemaining) {
        vibeType = 'warn';
        title = 'Alerta Amarelo ⚠️';
        message = `Você gastou um pouco a mais, mas o equilíbrio volta em ${daysToRecover} dia(s). Segure os gastos hoje!`;
        Icon = AlertTriangle;
      } else {
        vibeType = 'survival';
        title = 'Modo Sobrevivência 🚨';
        message = 'Alerta de limite! Foco total em reduzir gastos ao máximo até o fim do ciclo.';
        Icon = Flame;
      }
    }
  }

  return (
    <div className={`vibe-check vibe-check-${vibeType}`}>
      <div className="vibe-icon-wrapper">
        <Icon size={24} className="vibe-icon" />
      </div>
      <div className="vibe-content">
        <h4 className="vibe-title">{title}</h4>
        <p className="vibe-message">{message}</p>
      </div>
    </div>
  );
};
