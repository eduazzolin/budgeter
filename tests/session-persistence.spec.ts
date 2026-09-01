import { test, expect } from '@playwright/test';

function generateTestPeriods() {
  return [
    {
      id: 'period-alpha',
      name: 'Período Alpha 2026',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      initialBudget: 5000,
      finalBudget: 0,
      currentBalance: 4000,
      currentBalanceDate: '2026-01-15',
      balanceHistory: { '2026-01-15': 4000 },
      createdAt: '2026-01-01T10:00:00.000Z',
      sortOrder: 0
    },
    {
      id: 'period-beta',
      name: 'Período Beta 2026',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      initialBudget: 6000,
      finalBudget: 0,
      currentBalance: 5500,
      currentBalanceDate: '2026-02-10',
      balanceHistory: { '2026-02-10': 5500 },
      createdAt: '2026-02-01T10:00:00.000Z',
      sortOrder: 1
    },
    {
      id: 'period-gamma',
      name: 'Período Gamma 2026',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      initialBudget: 7000,
      finalBudget: 0,
      currentBalance: 6800,
      currentBalanceDate: '2026-03-05',
      balanceHistory: { '2026-03-05': 6800 },
      createdAt: '2026-03-01T10:00:00.000Z',
      sortOrder: 2
    }
  ];
}

test.describe('Session Persistence - Último Período Aberto', () => {
  test('deve restaurar automaticamente o período deixado aberto na sessão anterior (period-beta)', async ({ page }) => {
    const periods = generateTestPeriods();

    // Simula que na sessão anterior o usuário estava com o 'period-beta' aberto
    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify(data));
      window.localStorage.setItem('budgeter_selected_period_id', 'period-beta');
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, periods);

    await page.goto('/');

    // O título do detalhe deve ser o Período Beta 2026
    const detailTitle = page.locator('#detail-panel h1');
    await expect(detailTitle).toBeVisible();
    await expect(detailTitle).toContainText('Período Beta 2026');
  });

  test('ao alternar de período e recarregar a página, deve manter o novo período selecionado (period-gamma)', async ({ page }) => {
    const periods = generateTestPeriods();

    // Inicia com period-alpha somente na primeira carga (evita sobrescrever no page.reload())
    await page.addInitScript((data) => {
      if (!window.localStorage.getItem('budgeter_periods')) {
        window.localStorage.setItem('budgeter_periods', JSON.stringify(data));
        window.localStorage.setItem('budgeter_selected_period_id', 'period-alpha');
        window.localStorage.setItem('lgpd_consent_accepted', 'true');
      }
    }, periods);

    await page.goto('/');

    // Verifica que começou em Alpha
    await expect(page.locator('#detail-panel h1')).toContainText('Período Alpha 2026');

    // Se o menu lateral estiver fechado (em mobile), abre o menu
    const gammaHeading = page.locator('h3', { hasText: 'Período Gamma 2026' });
    const isVisible = await gammaHeading.isVisible().catch(() => false);
    if (!isVisible) {
      const menuBtn = page.locator('header button').first();
      await menuBtn.click();
    }

    // Clica no Período Gamma na lista lateral
    await expect(gammaHeading).toBeVisible();
    await gammaHeading.click();

    // Verifica que o painel de detalhe mudou para Gamma
    await expect(page.locator('#detail-panel h1')).toContainText('Período Gamma 2026');

    // Recarrega a página (simulando reabertura da aplicação / nova sessão)
    await page.reload();

    // Deve permanecer em Período Gamma 2026
    await expect(page.locator('#detail-panel h1')).toContainText('Período Gamma 2026');
  });
});
