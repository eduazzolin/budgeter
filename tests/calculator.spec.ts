import { test, expect } from '@playwright/test';

test.describe('Calculadora de Apoio ao Saldo Real', () => {
  test('deve abrir a calculadora, fazer operações e aplicar o valor no campo de saldo real', async ({ page }) => {
    const mockPeriod = {
      id: "BDMeguP0XldfUDnnVeNU",
      name: "jul26",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      initialBudget: 4000,
      finalBudget: 400,
      currentBalance: 2000,
      currentBalanceDate: "2026-07-18",
      balanceHistory: {
        "2026-07-01": 3994
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

    // Encontra o botão "Calcular"
    const calculateBtn = page.locator('button.calculator-btn-trigger', { hasText: 'Calcular' });
    await expect(calculateBtn).toBeVisible();

    // Clica no botão para abrir a calculadora
    await calculateBtn.click();

    // Verifica se o modal abriu e mostra o título
    const modalTitle = page.locator('h3', { hasText: 'Calculadora de Saldo' });
    await expect(modalTitle).toBeVisible();

    // Seleciona o input da calculadora
    const calcInput = page.locator('input[placeholder="Ex: 800 + 450 - 120"]');
    await expect(calcInput).toBeVisible();
    await expect(calcInput).toBeFocused();

    // Digita a expressão "1200.50 + 350 - 100" na calculadora
    await calcInput.fill('1200,50 + 350 - 100');

    // Verifica se o resultado calculado dinamicamente está correto
    // Deve mostrar R$ 1.450,50 formatado
    const resultDisplay = page.locator('span', { hasText: 'R$ 1.450,50' });
    await expect(resultDisplay).toBeVisible();

    // Clica em "Aplicar no Saldo"
    const applyBtn = page.locator('button', { hasText: 'Aplicar no Saldo' });
    await applyBtn.click();

    // O modal deve fechar
    await expect(modalTitle).not.toBeVisible();

    // O input do Saldo Real principal deve agora conter "1450.50"
    const balanceInput = page.locator('input[placeholder="Ex: 850.00"]');
    await expect(balanceInput).toHaveValue('1450.50');

    // Salva um screenshot da página final para verificação visual
    await page.screenshot({ path: 'calculator-applied-check.png', fullPage: true });
    console.log('Screenshot salva em calculator-applied-check.png');
  });
});
