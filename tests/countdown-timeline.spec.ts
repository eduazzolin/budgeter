import { test, expect } from '@playwright/test';

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

test.describe('Countdown Positive/Negative Timeline Feature', () => {
  test('displays positive and negative percentages and segmented colored bar', async ({ page }) => {
    const mockPeriod = generateDynamicPeriod({ id: "timeline-test-id", name: "Período com Linha do Tempo" });

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, mockPeriod);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Check period title
    await expect(page.locator('h1')).toContainText('Período com Linha do Tempo');

    // Wait for the countdown card and segmented bar
    const countdownBar = page.locator('.kpi-cards-grid .segmented-progress-bar');
    await expect(countdownBar).toBeVisible();

    // Check that positive and negative stats are rendered in the countdown card
    await expect(page.getByText('83% Positivo')).toBeVisible();
    await expect(page.getByText('17% Negativo')).toBeVisible();

    // Check sidebar subtle bar representation
    const sidebarBar = page.locator('.segmented-progress-bar-subtle').first();
    await expect(sidebarBar).toBeVisible();

    // Verify segment counts in countdown card
    const positiveSegments = countdownBar.locator('.progress-segment.segment-positive');
    const negativeSegments = countdownBar.locator('.progress-segment.segment-negative');
    const futureSegments = countdownBar.locator('.progress-segment.segment-future');

    await expect(positiveSegments).toHaveCount(5);
    await expect(negativeSegments).toHaveCount(1);
    await expect(futureSegments).toHaveCount(5);

    // Capture visual screenshot
    await page.screenshot({ path: 'countdown-segmented-bar.png', fullPage: false });
  });

  test('displays 100% negative when all elapsed days have negative margin', async ({ page }) => {
    const mockPeriod = generateDynamicPeriod({ id: "neg-timeline-id", name: "Período Negativo", isNegativeOnly: true });

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, mockPeriod);

    await page.goto('/');

    const countdownBar = page.locator('.kpi-cards-grid .segmented-progress-bar');
    await expect(countdownBar).toBeVisible();

    await expect(page.getByText('0% Positivo')).toBeVisible();
    await expect(page.getByText('100% Negativo')).toBeVisible();

    const positiveSegments = countdownBar.locator('.progress-segment.segment-positive');
    const negativeSegments = countdownBar.locator('.progress-segment.segment-negative');

    await expect(positiveSegments).toHaveCount(0);
    await expect(negativeSegments).toHaveCount(6);
  });
});
