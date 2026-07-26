import { test, expect } from '@playwright/test';

function generateMockPeriod() {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const start = new Date(today);
  start.setDate(today.getDate() - 5);
  const end = new Date(today);
  end.setDate(today.getDate() + 5);

  return {
    id: "notes-test-period",
    name: "Período Teste Anotações",
    startDate: formatDate(start),
    endDate: formatDate(end),
    initialBudget: 1000,
    finalBudget: 0,
    currentBalance: 500,
    currentBalanceDate: formatDate(today),
    balanceHistory: {},
    notes: "- 15/08: Geladeira R$ 2.500",
    createdAt: new Date().toISOString(),
    userId: "teste"
  };
}

test.describe('Period Notes Feature', () => {
  test('displays existing period notes and saves changes', async ({ page }) => {
    const mockData = generateMockPeriod();

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
    }, mockData);

    await page.goto('/');
    await page.waitForSelector('textarea');

    const textarea = page.locator('textarea');
    await expect(textarea).toHaveValue("- 15/08: Geladeira R$ 2.500");

    // Add new text to notes
    await textarea.fill("- 15/08: Geladeira R$ 2.500\n- 20/08: Reembolso +R$ 300");

    // Click the Save button that appears for unsaved changes
    const saveBtn = page.locator('button', { hasText: 'Salvar' });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify text status changes to "Salvo"
    await expect(page.locator('span', { hasText: 'Salvo' })).toBeVisible();

    // Verify localStorage has updated period notes
    const storedPeriods = await page.evaluate(() => {
      const data = window.localStorage.getItem('budgeter_periods');
      return data ? JSON.parse(data) : [];
    });

    expect(storedPeriods.length).toBe(1);
    expect(storedPeriods[0].notes).toBe("- 15/08: Geladeira R$ 2.500\n- 20/08: Reembolso +R$ 300");
  });
});
