import { test, expect } from '@playwright/test';

test.describe('Calculadora de Apoio ao Saldo Real (Unificada)', () => {
  test('deve permitir digitação direta de expressões no input de saldo e salvar diretamente', async ({ page }) => {
    // Definimos uma data de hoje fixa (2026-07-23) para consistência dos testes
    const today = new Date('2026-07-23T12:00:00');
    
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
        "2026-07-01": 3994,
        "2026-07-18": 2000
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

    // Encontra o input inteligente de Saldo Real
    const balanceInput = page.locator('input[placeholder="Ex: 850.00 ou 1200 + 250"]');
    await expect(balanceInput).toBeVisible();

    // Digita uma expressão matemática
    await balanceInput.fill('1200,50 + 350');

    // Clica no botão operador '-' da barra de atalhos
    const minusOperatorBtn = page.locator('button.calculator-btn-trigger', { hasText: '-' });
    await expect(minusOperatorBtn).toBeVisible();
    await minusOperatorBtn.click();

    // Adiciona o restante da fórmula ('100')
    await balanceInput.pressSequentially('100');

    // O input deve conter a expressão completa
    await expect(balanceInput).toHaveValue('1200,50 + 350-100');

    // Verifica se o resultado calculado dinamicamente está correto
    // Deve mostrar R$ 1.450,50 formatado
    const resultDisplay = page.locator('strong', { hasText: 'R$ 1.450,50' });
    await expect(resultDisplay).toBeVisible();

    // Encontra o botão "Marcar Saldo" e submete
    const submitBtn = page.locator('button[type="submit"]', { hasText: 'Marcar Saldo' });
    await submitBtn.click();

    // Encontra a linha da tabela para o dia do registro (23/07/2026)
    const row23 = page.locator('tr', { hasText: '23/07/2026' });
    await expect(row23).toBeVisible();
    await expect(row23.locator('td').nth(2)).toContainText('R$ 1.450,50');

    // Salva um screenshot da página final para verificação visual
    await page.screenshot({ path: 'calculator-applied-check.png', fullPage: true });
    console.log('Screenshot salva em calculator-applied-check.png');
  });
});
