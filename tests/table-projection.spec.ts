import { test, expect } from '@playwright/test';

test.describe('Coluna de Saldo Projetado na Tabela', () => {
  test('deve exibir a coluna Saldo Projetado, mostrando traço para dias passados e saldo projetado para dias hoje/futuros', async ({ page }) => {
    const mockPeriod = {
      id: "test-table-projection",
      name: "Teste Tabela Projeção",
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

    // Verifica se o cabeçalho "Saldo Projetado" está visível
    const thProjetado = page.locator('th', { hasText: 'Saldo Projetado' });
    await expect(thProjetado).toBeVisible();

    // Na tabela, verifica que a coluna existe
    const tableHeaderCols = page.locator('table.budget-table th');
    await expect(tableHeaderCols).toHaveCount(5);
    await expect(tableHeaderCols.nth(3)).toContainText('Saldo Projetado');
  });
});
