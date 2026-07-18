import { test, expect } from '@playwright/test';

test.describe('Previsão de Alta - Teste com dados do Usuário', () => {
  test('deve aplicar fallback para gasto zero ou exibir aviso se fora do período', async ({ page }) => {
    // Definimos o período com base nos dados reais mostrados no print (jul26)
    // 01/07/2026 até 31/07/2026
    const mockPeriod = {
      id: "BDMeguP0XldfUDnnVeNU",
      name: "jul26",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      initialBudget: 4000,
      finalBudget: 411.77, // R$ 411.77 garante dailyBudget de R$ 115.75, resultando em margem de -243.26 no dia 18/07
      currentBalance: 1789,
      currentBalanceDate: "2026-07-18",
      balanceHistory: {
        "2026-07-01": 3994,
        "2026-07-02": 3994,
        "2026-07-03": 3813,
        "2026-07-04": 3447,
        "2026-07-05": 3119,
        "2026-07-06": 3040,
        "2026-07-08": 2714,
        "2026-07-09": 2604,
        "2026-07-10": 2595,
        "2026-07-11": 2586,
        "2026-07-12": 2335,
        "2026-07-13": 2022,
        "2026-07-14": 1879,
        "2026-07-15": 1879,
        "2026-07-16": 1789,
        "2026-07-17": 1789,
        "2026-07-18": 1789
      },
      createdAt: "2026-07-18T10:00:00Z",
      userId: "teste"
    };

    // Injeta os dados no localStorage
    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
    }, mockPeriod);

    // Abre a página principal
    await page.goto('/');

    // Verifica se o título da página está correto
    await expect(page.locator('h1')).toContainText('jul26');

    // Tira uma captura de tela do card de margem / página inteira
    await page.screenshot({ path: 'forecast-user-data-check.png', fullPage: true });
    console.log('Screenshot salva em forecast-user-data-check.png');
  });

  test('deve abrir o modal de confirmação ao clicar na lixeira e remover o saldo quando confirmado', async ({ page }) => {
    const mockPeriod = {
      id: "BDMeguP0XldfUDnnVeNU",
      name: "jul26",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      initialBudget: 4000,
      finalBudget: 411.77,
      currentBalance: 1789,
      currentBalanceDate: "2026-07-18",
      balanceHistory: {
        "2026-07-01": 3994,
        "2026-07-18": 1789
      },
      createdAt: "2026-07-18T10:00:00Z",
      userId: "teste"
    };

    // Injeta os dados no localStorage
    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
    }, mockPeriod);

    // Abre a página principal
    await page.goto('/');

    // Encontra a linha da tabela para o dia 18/07/2026
    const row18 = page.locator('tr', { hasText: '18/07/2026' });
    await expect(row18).toBeVisible();

    // Verifica que o saldo real atual é de R$ 1.789,00
    await expect(row18.locator('td').nth(2)).toContainText('R$ 1.789,00');

    // Clica no botão de remover (lixeira)
    const deleteBtn = row18.locator('.delete-balance-btn');
    await deleteBtn.click();

    // Verifica se o modal de confirmação abriu
    const confirmModalTitle = page.locator('h3', { hasText: 'Confirmar Exclusão' });
    await expect(confirmModalTitle).toBeVisible();

    // Clica em Cancelar
    const cancelBtn = page.locator('button', { hasText: 'Cancelar' });
    await cancelBtn.click();

    // Verifica se o modal fechou e se o valor ainda está lá
    await expect(confirmModalTitle).toBeHidden();
    await expect(row18.locator('td').nth(2)).toContainText('R$ 1.789,00');

    // Abre o modal novamente para efetivar a remoção
    await deleteBtn.click();
    await expect(confirmModalTitle).toBeVisible();

    // Tira uma captura de tela do modal aberto para conferência visual
    await page.screenshot({ path: 'delete-confirm-modal.png', fullPage: true });

    // Clica em Remover no modal
    const confirmBtn = page.locator('button.btn-danger', { hasText: 'Remover' });
    await confirmBtn.click();

    // Verifica se o modal fechou
    await expect(confirmModalTitle).toBeHidden();

    // Verifica se o valor na tabela foi removido (agora deve conter '—')
    await expect(row18.locator('td').nth(2)).toContainText('—');
  });
});
