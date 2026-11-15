import { test, expect } from '@playwright/test';

function generateSeededPeriod() {
  const today = new Date();
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const start = new Date(today);
  start.setDate(today.getDate() - 5);

  const end = new Date(today);
  end.setDate(today.getDate() + 5);

  const initialBudget = 1000;
  const totalDays = 11;
  const dailyBudget = initialBudget / (totalDays - 1); // 100 per day

  const history: Record<string, number> = {};
  let currentBalance = initialBudget;

  for (let i = 0; i <= 5; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const expected = initialBudget - i * dailyBudget;
    const margin = i === 5 ? 150 : i * 20;
    currentBalance = Math.round(expected + margin);
    history[formatDate(d)] = currentBalance;
  }

  return {
    id: 'gas-pump-test-period',
    name: 'Período Teste Gas Pump',
    startDate: formatDate(start),
    endDate: formatDate(end),
    initialBudget,
    finalBudget: 0,
    currentBalance,
    currentBalanceDate: formatDate(today),
    balanceHistory: history,
    createdAt: new Date().toISOString(),
    userId: 'teste'
  };
}

test.describe('Animação Estilo Bomba de Gasolina no Card de Margem', () => {
  test('deve animar os números subindo e descendo ao registrar novo Saldo Real', async ({ page }) => {
    const mockPeriod = generateSeededPeriod();

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, mockPeriod);

    await page.goto('/');

    const marginValue = page.getByTestId('margin-card-value');
    await expect(marginValue).toBeVisible();
    await expect(marginValue).toContainText('+R$ 150,00');
    await expect(marginValue).toHaveAttribute('data-animating', 'false');

    // 1. Registrar um Saldo Real maior via calculadora para ver os números SUBINDO
    // Esperado hoje (dia 5): 500. Se registrarmos 850, a Margem sobe de +150,00 para +350,00
    const toggleCalcBtn = page.locator('button.calculator-btn-trigger').first();
    await toggleCalcBtn.click();

    const calcInput = page.locator('input[placeholder="Ex: 800 + 450 - 120"]');
    await calcInput.fill('850');

    const submitBtn = page.locator('button[type="submit"]', { hasText: 'Marcar Saldo' });
    await submitBtn.click();

    // Verifica que a animação iniciou na direção "up"
    await expect(marginValue).toHaveAttribute('data-animating', 'true');
    await expect(marginValue).toHaveAttribute('data-direction', 'up');

    // Aguarda concluir a animação e estabilizar no valor final +R$ 350,00
    await expect(marginValue).toContainText('+R$ 350,00');
    await expect(marginValue).toHaveAttribute('data-animating', 'false');

    // 2. Registrar um Saldo Real menor para ver os números DESCENDO
    // Se registrarmos 420, a Margem desce de +350,00 para -80,00
    await calcInput.fill('420');
    await submitBtn.click();

    await expect(marginValue).toHaveAttribute('data-animating', 'true');
    await expect(marginValue).toHaveAttribute('data-direction', 'down');

    // Aguarda concluir a animação e estabilizar em -R$ 80,00
    await expect(marginValue).toContainText('-R$ 80,00');
    await expect(marginValue).toHaveAttribute('data-animating', 'false');
  });
});
