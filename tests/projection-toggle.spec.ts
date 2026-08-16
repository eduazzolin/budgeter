import { test, expect } from '@playwright/test';

test.describe('Exibição Automática da Projeção no Gráfico', () => {
  test('não deve exibir botão manual de toggle', async ({ page }) => {
    const mockPeriod = {
      id: "test-period-projection-btn",
      name: "Teste Botão Projeção",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      initialBudget: 4000,
      finalBudget: 500,
      currentBalance: 2000,
      currentBalanceDate: "2026-07-15",
      balanceHistory: {
        "2026-07-01": 4000,
        "2026-07-15": 2000
      },
      createdAt: "2026-07-01T10:00:00Z",
      userId: "teste"
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, mockPeriod);

    await page.goto('/');

    // O botão de toggle de projeção não deve existir na interface
    const toggleBtn = page.locator('button.toggle-projection-btn');
    await expect(toggleBtn).toBeHidden();
  });

  test('deve exibir a linha de projeção quando a margem for negativa', async ({ page }) => {
    // Margem negativa: saldo registrado (1500) é menor que o esperado (~2366 no dia 15)
    const mockPeriodNegative = {
      id: "test-period-proj-neg",
      name: "Teste Margem Negativa",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      initialBudget: 4000,
      finalBudget: 500,
      currentBalance: 1500,
      currentBalanceDate: "2026-07-15",
      balanceHistory: {
        "2026-07-01": 4000,
        "2026-07-15": 1500
      },
      createdAt: "2026-07-01T10:00:00Z",
      userId: "teste"
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, mockPeriodNegative);

    await page.goto('/');
    await page.waitForSelector('.recharts-responsive-container');

    // A linha de projeção (.recharts-line) deve estar presente no SVG do Recharts
    const projectedLine = page.locator('.recharts-line');
    await expect(projectedLine).toBeVisible();
  });

  test('deve ocultar a linha de projeção quando a margem for positiva', async ({ page }) => {
    // Margem positiva: saldo registrado (3000) é maior que o esperado (~2366 no dia 15)
    const mockPeriodPositive = {
      id: "test-period-proj-pos",
      name: "Teste Margem Positiva",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      initialBudget: 4000,
      finalBudget: 500,
      currentBalance: 3000,
      currentBalanceDate: "2026-07-15",
      balanceHistory: {
        "2026-07-01": 4000,
        "2026-07-15": 3000
      },
      createdAt: "2026-07-01T10:00:00Z",
      userId: "teste"
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, mockPeriodPositive);

    await page.goto('/');
    await page.waitForSelector('.recharts-responsive-container');

    // A linha de projeção (.recharts-line) deve estar oculta / não renderizada no SVG
    const projectedLine = page.locator('.recharts-line');
    await expect(projectedLine).toBeHidden();
  });
});
