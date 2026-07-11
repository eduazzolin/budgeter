import { test, expect } from '@playwright/test';

// Helper to generate dynamic period data that is always in progress
function generateDynamicPeriod(opts: { id: string; name: string; isNegativeOnly?: boolean }) {
  const today = new Date();
  
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const start = new Date(today);
  start.setDate(today.getDate() - 5); // starts 5 days ago
  
  const end = new Date(today);
  end.setDate(today.getDate() + 5); // ends 5 days from now
  
  const history: Record<string, number> = {};
  
  const initialBudget = 1000;
  const totalDays = 11; // -5 to +5 inclusive is 11 days
  const dailyBudget = initialBudget / (totalDays - 1); // 100 per day
  
  let currentBalance = initialBudget;
  for (let i = 0; i <= 5; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const expected = initialBudget - i * dailyBudget;
    
    let margin;
    if (opts.isNegativeOnly) {
      margin = -50 - i * 30; // always negative
    } else {
      // starts negative, then crosses to positive (similar to jun26)
      if (i === 0) margin = 0;
      else if (i === 1) margin = -20;
      else if (i === 2) margin = 30;
      else if (i === 3) margin = 80;
      else if (i === 4) margin = 120;
      else margin = 150;
    }
    
    currentBalance = Math.round(expected + margin);
    history[formatDate(d)] = currentBalance;
  }
  
  return {
    id: opts.id,
    name: opts.name,
    startDate: formatDate(start),
    endDate: formatDate(end),
    initialBudget,
    finalBudget: 0,
    currentBalance,
    currentBalanceDate: formatDate(today),
    balanceHistory: history,
    createdAt: new Date().toISOString(),
    userId: "teste"
  };
}

test.describe('Dashboard Seed & Visual Check', () => {
  test('inject data and capture chart', async ({ page }) => {
    const mockPeriod = generateDynamicPeriod({ id: "active-period-id", name: "Período Ativo" });

    // Inject budget data into localStorage before loading the page
    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
    }, mockPeriod);

    // Go to the dashboard
    await page.goto('/');

    // Verify period title is visible
    await expect(page.locator('h1')).toContainText('Período Ativo');

    // Wait for the chart to render (Recharts is svg-based)
    await page.waitForSelector('.recharts-responsive-container');

    // Wait for chart animations to finish
    await page.waitForTimeout(2000);

    // Take screenshot of the page to check the gradient styling
    await page.screenshot({ path: 'chart-gradient-check.png', fullPage: true });
    console.log('Screenshot saved to chart-gradient-check.png');
  });

  test('inject negative-only data and capture chart', async ({ page }) => {
    const mockPeriod = generateDynamicPeriod({ id: "neg-only-id", name: "jul26_neg", isNegativeOnly: true });

    // Inject budget data with negative margins into localStorage before loading the page
    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
    }, mockPeriod);

    // Go to the dashboard
    await page.goto('/');

    // Verify period title is visible
    await expect(page.locator('h1')).toContainText('jul26_neg');

    // Wait for the chart to render (Recharts is svg-based)
    await page.waitForSelector('.recharts-responsive-container');

    // Wait for chart animations to finish
    await page.waitForTimeout(2000);

    // Take screenshot of the page to check the gradient styling
    await page.screenshot({ path: 'chart-negative-only.png', fullPage: true });
    console.log('Screenshot saved to chart-negative-only.png');
  });

  test('capture desktop screenshot for readme', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    });
    const page = await context.newPage();

    const mockPeriod = generateDynamicPeriod({ id: "active-period-id", name: "Período Ativo" });

    // Inject budget data into localStorage before loading the page
    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
    }, mockPeriod);

    // Go to the dashboard
    await page.goto('/');

    // Verify period title is visible
    await expect(page.locator('h1')).toContainText('Período Ativo');

    // Wait for the chart to render (Recharts is svg-based)
    await page.waitForSelector('.recharts-responsive-container');

    // Wait for chart animations to finish
    await page.waitForTimeout(2000);

    // Take screenshot of the viewport
    await page.screenshot({ path: 'public/screenshot.png', fullPage: false });
    console.log('Screenshot saved to public/screenshot.png');
    
    await context.close();
  });
});
