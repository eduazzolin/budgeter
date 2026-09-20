import { test, expect } from '@playwright/test';

// Helper to generate dynamic period data aligned with today
function generateDynamicPeriod(opts: { 
  id: string; 
  name: string; 
  startOffset: number; 
  endOffset: number; 
  initialBudget: number;
  marginProfile: number[];
}) {
  const today = new Date();
  
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const start = new Date(today);
  start.setDate(today.getDate() + opts.startOffset);
  
  const end = new Date(today);
  end.setDate(today.getDate() + opts.endOffset);
  
  const history: Record<string, number> = {};
  const totalDays = opts.endOffset - opts.startOffset + 1;
  const dailyBudget = opts.initialBudget / (totalDays - 1);
  
  let currentBalance = opts.initialBudget;
  const elapsedDays = Math.min(totalDays, Math.max(0, -opts.startOffset + 1));

  for (let i = 0; i < elapsedDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const expected = opts.initialBudget - i * dailyBudget;
    const margin = opts.marginProfile[i] ?? 0;
    currentBalance = Math.round(expected + margin);
    history[formatDate(d)] = currentBalance;
  }
  
  return {
    id: opts.id,
    name: opts.name,
    startDate: formatDate(start),
    endDate: formatDate(end),
    initialBudget: opts.initialBudget,
    finalBudget: 0,
    currentBalance,
    currentBalanceDate: formatDate(today),
    balanceHistory: history,
    createdAt: new Date().toISOString(),
    userId: "teste"
  };
}

test.describe('Line Chart Comparison Feature', () => {
  test('should compare periods aligned by day of month on a unified Y-axis scale', async ({ page }) => {
    // Two calendar-month periods: Setembro 2026 (current) and Agosto 2026 (previous)
    const currentPeriod = {
      id: "setembro-2026-id",
      name: "Setembro 2026",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      initialBudget: 3000,
      finalBudget: 0,
      currentBalance: 2400,
      currentBalanceDate: "2026-09-06",
      balanceHistory: {
        "2026-09-01": 3000,
        "2026-09-02": 2880,
        "2026-09-03": 2750,
        "2026-09-04": 2600,
        "2026-09-05": 2520,
        "2026-09-06": 2400
      },
      createdAt: "2026-09-01T00:00:00.000Z",
      userId: "teste"
    };

    const previousPeriod = {
      id: "agosto-2026-id",
      name: "Agosto 2026",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      initialBudget: 3000,
      finalBudget: 0,
      currentBalance: 1800,
      currentBalanceDate: "2026-08-12",
      balanceHistory: {
        "2026-08-01": 3000,
        "2026-08-03": 2800,
        "2026-08-05": 2650,
        "2026-08-08": 2300,
        "2026-08-10": 2050,
        "2026-08-12": 1800
      },
      createdAt: "2026-08-01T00:00:00.000Z",
      userId: "teste"
    };

    // Inject periods into localStorage
    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify(data.periods));
      window.localStorage.setItem('budgeter_selected_period_id', data.currentId);
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, { periods: [currentPeriod, previousPeriod], currentId: currentPeriod.id });

    // Navigate to dashboard
    await page.goto('/');

    // Wait for the chart to load
    await page.waitForSelector('.recharts-responsive-container');

    // Verify metric toggle is NOT visible when not comparing
    const saldoRealBtn = page.getByRole('button', { name: 'Saldo Real' });
    await expect(saldoRealBtn).not.toBeVisible();

    // Verify Compare button is present
    const compareBtn = page.getByTestId('compare-chart-btn');
    await expect(compareBtn).toBeVisible();
    await expect(compareBtn).toContainText('Comparar');

    // Click compare button to open dropdown
    await compareBtn.click();
    const dropdownPanel = page.getByTestId('compare-dropdown-panel');
    await expect(dropdownPanel).toBeVisible();

    // Verify dropdown is centered horizontally within screen boundaries on mobile
    const panelBox = await dropdownPanel.boundingBox();
    const viewport = page.viewportSize();
    expect(panelBox).not.toBeNull();
    if (panelBox && viewport) {
      expect(panelBox.x).toBeGreaterThanOrEqual(0);
      expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(viewport.width + 1);
      const panelCenterX = panelBox.x + panelBox.width / 2;
      const viewportCenterX = viewport.width / 2;
      expect(Math.abs(panelCenterX - viewportCenterX)).toBeLessThan(10);
    }

    // Verify previous period (Agosto 2026) is listed
    const option = page.getByTestId(`compare-option-${previousPeriod.id}`);
    await expect(option).toBeVisible();
    await expect(option).toContainText('Agosto 2026');

    // Select Agosto 2026
    await option.click();

    // Verify dropdown closes and comparison banner is active
    await expect(dropdownPanel).not.toBeVisible();
    const banner = page.getByTestId('active-comparison-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Setembro 2026');
    await expect(banner).toContainText('Agosto 2026');

    // Verify textual analysis is NOT present
    await expect(banner).not.toContainText('No Dia');

    // Verify metric toggle IS visible when comparing
    await expect(saldoRealBtn).toBeVisible();

    // Verify comparison button shows active state
    await expect(compareBtn).toContainText('Comparando');

    // Verify chart renders day-of-the-month points (e.g. Dia 1, Dia 5, etc.)
    const chartApp = page.getByRole('application');
    await expect(chartApp).toContainText('Dia 1');
    await expect(chartApp).toContainText('Dia 5');

    // Verify there is strictly ONE single Y-axis element (unified scale, no dual axes)
    const yAxes = page.locator('.recharts-yAxis');
    await expect(yAxes).toHaveCount(1);

    // Verify in Margin Comparison mode, the blue comparison line has no static dots
    const marginBlueLine = page.locator('path[stroke="#3b82f6"]').locator('..');
    await expect(marginBlueLine.locator('circle')).toHaveCount(0);

    // Wait for chart animations
    await page.waitForTimeout(1000);

    const artifactDir = 'C:/Users/eduaz/.gemini/antigravity/brain/f1eb5945-8bc8-4b3b-97c1-8235e711c8c6';

    // Capture screenshot of Margin Comparison mode
    await page.screenshot({ path: `${artifactDir}/chart-compare-margin.png`, fullPage: true });

    // Switch to "Saldo Real" mode
    await saldoRealBtn.click();

    await page.waitForTimeout(1000);

    // Verify Y-axis remains single unified scale in Saldo Real mode
    await expect(page.locator('.recharts-yAxis')).toHaveCount(1);

    // Verify in Saldo Real mode, dashed lines are removed (only 2 real solid balance lines)
    const dashedCurves = page.locator('.recharts-line-curve[stroke-dasharray="4 4"]');
    await expect(dashedCurves).toHaveCount(0);
    const balanceLines = page.locator('.recharts-line-curve');
    await expect(balanceLines).toHaveCount(2);

    // Verify in Saldo Real mode, the blue comparison line has no static dots
    const balanceBlueLine = page.locator('.recharts-line path[stroke="#3b82f6"]').locator('..');
    await expect(balanceBlueLine.locator('circle')).toHaveCount(0);

    // Capture screenshot of Saldo Real Comparison mode
    await page.screenshot({ path: `${artifactDir}/chart-compare-balance.png`, fullPage: true });

    // Test clearing comparison
    const removeBtn = banner.getByRole('button', { name: 'Remover' });
    await removeBtn.click();

    // Verify banner disappears, button reverts to "Comparar", and toggle disappears
    await expect(banner).not.toBeVisible();
    await expect(compareBtn).toContainText('Comparar');
    await expect(saldoRealBtn).not.toBeVisible();
  });

  test('should render anchored dropdown on desktop screens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const currentPeriod = {
      id: "setembro-2026-id",
      name: "Setembro 2026",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      initialBudget: 3000,
      finalBudget: 0,
      currentBalance: 2400,
      currentBalanceDate: "2026-09-06",
      balanceHistory: {
        "2026-09-01": 3000,
        "2026-09-06": 2400
      },
      createdAt: "2026-09-01T00:00:00.000Z",
      userId: "teste"
    };

    const previousPeriod = {
      id: "agosto-2026-id",
      name: "Agosto 2026",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      initialBudget: 3000,
      finalBudget: 0,
      currentBalance: 1800,
      currentBalanceDate: "2026-08-12",
      balanceHistory: {
        "2026-08-01": 3000,
        "2026-08-12": 1800
      },
      createdAt: "2026-08-01T00:00:00.000Z",
      userId: "teste"
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify(data.periods));
      window.localStorage.setItem('budgeter_selected_period_id', data.currentId);
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, { periods: [currentPeriod, previousPeriod], currentId: currentPeriod.id });

    await page.goto('/');
    await page.waitForSelector('.recharts-responsive-container');

    const compareBtn = page.getByTestId('compare-chart-btn');
    await compareBtn.click();

    const dropdownPanel = page.getByTestId('compare-dropdown-panel');
    await expect(dropdownPanel).toBeVisible();

    // On desktop, modal-overlay should NOT exist
    const modalOverlay = page.locator('.modal-overlay');
    await expect(modalOverlay).toHaveCount(0);

    // Click option to compare
    const option = page.getByTestId(`compare-option-${previousPeriod.id}`);
    await option.click();
    await expect(dropdownPanel).not.toBeVisible();
  });
});
