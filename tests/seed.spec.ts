import { test, expect } from '@playwright/test';

test.describe('Dashboard Seed & Visual Check', () => {
  test('inject data and capture chart', async ({ page }) => {
    // Inject budget data into localStorage before loading the page
    await page.addInitScript(() => {
      const mockPeriod = {
        id: "9DImpGbIsCAjM4tNhP48",
        name: "jun26",
        startDate: "2026-06-20",
        endDate: "2026-06-30",
        initialBudget: 1516,
        finalBudget: 0,
        currentBalance: 642,
        currentBalanceDate: "2026-06-29",
        balanceHistory: {
          "2026-06-20": 1516,
          "2026-06-21": 1350,
          "2026-06-22": 1300,
          "2026-06-23": 1160,
          "2026-06-24": 1118,
          "2026-06-25": 1118,
          "2026-06-26": 1026,
          "2026-06-27": 858,
          "2026-06-28": 682,
          "2026-06-29": 642
        },
        createdAt: "2026-06-20T20:39:10.285Z",
        userId: "teste"
      };

      window.localStorage.setItem('budgeter_periods', JSON.stringify([mockPeriod]));
      window.localStorage.setItem('budgeter_selected_period_id', '9DImpGbIsCAjM4tNhP48');
    });

    // Go to the dashboard
    await page.goto('/');

    // Verify period title is visible
    await expect(page.locator('h1')).toContainText('jun26');

    // Wait for the chart to render (Recharts is svg-based)
    await page.waitForSelector('.recharts-responsive-container');

    // Wait for chart animations to finish
    await page.waitForTimeout(2000);

    // Take screenshot of the page to check the gradient styling
    await page.screenshot({ path: 'chart-gradient-check.png', fullPage: true });
    console.log('Screenshot saved to chart-gradient-check.png');
  });

  test('inject negative-only data and capture chart', async ({ page }) => {
    // Inject budget data with negative margins into localStorage before loading the page
    await page.addInitScript(() => {
      const mockPeriod = {
        id: "neg-only-id",
        name: "jul26_neg",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        initialBudget: 1000,
        finalBudget: 0,
        currentBalance: 150,
        currentBalanceDate: "2026-07-11",
        balanceHistory: {
          "2026-07-01": 900,
          "2026-07-02": 800,
          "2026-07-03": 700,
          "2026-07-04": 500,
          "2026-07-05": 450,
          "2026-07-06": 400,
          "2026-07-07": 350,
          "2026-07-08": 300,
          "2026-07-09": 250,
          "2026-07-10": 200,
          "2026-07-11": 150
        },
        createdAt: "2026-07-01T12:00:00.000Z",
        userId: "teste"
      };

      window.localStorage.setItem('budgeter_periods', JSON.stringify([mockPeriod]));
      window.localStorage.setItem('budgeter_selected_period_id', 'neg-only-id');
    });

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
});
