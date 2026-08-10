import { test, expect } from '@playwright/test';

test.describe('Botão de Exibir/Ocultar Projeção no Gráfico', () => {
  test('deve manter a projeção oculta por padrão e exibi-la ao clicar no botão', async ({ page }) => {
    const mockPeriod = {
      id: "test-period-projection",
      name: "Teste Projeção",
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

    // Carrega os dados via localStorage usando addInitScript (conforme AGENTS.md)
    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
    }, mockPeriod);

    await page.goto('/');

    // Verifica se a página carregou
    await expect(page.locator('h1')).toContainText('Teste Projeção');

    // O botão de projeção deve estar visível e mostrar "Exibir Projeção" por padrão
    const toggleBtn = page.locator('button.toggle-projection-btn');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toContainText('Exibir Projeção');

    // Por padrão, a linha/legenda da projeção não deve estar visível ou não renderizada no Recharts
    // Ao clicar no botão, o texto do botão deve mudar para "Ocultar Projeção"
    await toggleBtn.click();
    await expect(toggleBtn).toContainText('Ocultar Projeção');

    // Clicar novamente oculta a projeção
    await toggleBtn.click();
    await expect(toggleBtn).toContainText('Exibir Projeção');
  });
});
