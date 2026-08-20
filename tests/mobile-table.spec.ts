import { test, expect } from '@playwright/test';

test.describe('Tabela de Evolução em Telas Mobile e Desktop', () => {
  const mockPeriod = {
    id: "test-table-responsive",
    name: "Teste Tabela Responsiva",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    initialBudget: 3000,
    finalBudget: 500,
    currentBalance: 2500,
    currentBalanceDate: "2026-08-15",
    balanceHistory: {
      "2026-08-01": 3000,
      "2026-08-15": 2500
    },
    createdAt: "2026-08-01T10:00:00Z",
    userId: "teste"
  };

  test('não deve gerar barra de rolagem horizontal em telas mobile (Pixel 5)', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, mockPeriod);

    await page.goto('/');

    const tableContainer = page.locator('.table-container');
    await expect(tableContainer).toBeVisible();

    // Verifica se a largura do conteúdo da tabela cabe na largura do container sem rolagem
    const scrollWidth = await tableContainer.evaluate((el) => el.scrollWidth);
    const clientWidth = await tableContainer.evaluate((el) => el.clientWidth);

    // scrollWidth deve ser igual ou muito próximo de clientWidth (tolerância de até 2px por conta de arredondamento de subpixel)
    expect(scrollWidth - clientWidth).toBeLessThanOrEqual(2);

    // Verifica se as colunas estão visíveis
    const ths = page.locator('.budget-table th');
    await expect(ths).toHaveCount(5);
  });

  test('deve manter o tamanho original da tabela em telas desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, mockPeriod);

    await page.goto('/');

    const table = page.locator('.budget-table');
    await expect(table).toBeVisible();

    // Em desktop, a tabela deve respeitar min-width de 600px
    const tableWidth = await table.evaluate((el) => el.getBoundingClientRect().width);
    expect(tableWidth).toBeGreaterThanOrEqual(600);
  });
});
