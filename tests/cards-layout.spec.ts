import { test, expect } from '@playwright/test';

function generateMockPeriod() {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const start = new Date(today);
  start.setDate(today.getDate() - 5);
  const end = new Date(today);
  end.setDate(today.getDate() + 5);

  const history: Record<string, number> = {};
  for (let i = 0; i <= 5; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    history[formatDate(d)] = 1000 - i * 100;
  }

  return {
    id: "layout-test-period",
    name: "Período Teste Layout",
    startDate: formatDate(start),
    endDate: formatDate(end),
    initialBudget: 1000,
    finalBudget: 0,
    currentBalance: 500,
    currentBalanceDate: formatDate(today),
    balanceHistory: history,
    createdAt: new Date().toISOString(),
    userId: "teste"
  };
}

test.describe('KPI Cards Layout', () => {
  test('verify 2-line layout where last card spans full width', async ({ browser }) => {
    // 750px width causes 2 rows of cards when sidebar is open or closed
    const context = await browser.newContext({
      viewport: { width: 750, height: 800 }
    });
    const page = await context.newPage();
    const mockData = generateMockPeriod();

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
    }, mockData);

    await page.goto('/');
    await page.waitForSelector('.kpi-cards-grid');

    // Take screenshot to visually verify card widths
    await page.screenshot({ path: 'cards-2lines-check.png' });
    
    // Check bounding boxes of the 3 cards
    const cards = page.locator('.kpi-cards-grid > div');
    await expect(cards).toHaveCount(3);

    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();
    const box3 = await cards.nth(2).boundingBox();

    if (box1 && box2 && box3) {
      console.log(`Card 1 width: ${box1.width}, Card 2 width: ${box2.width}, Card 3 width: ${box3.width}`);
      // Card 3 should be significantly wider than Card 1 and Card 2 because Card 3 spans the entire row
      expect(box3.width).toBeGreaterThan(box1.width);
      expect(box3.width).toBeGreaterThan(box2.width);
    }

    await context.close();
  });
});
