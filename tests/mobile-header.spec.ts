import { test, expect } from '@playwright/test';

test.describe('Mobile Header Layout', () => {
  test('header logo should not wrap vertically', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to be ready
    await page.waitForSelector('.app-header');

    // Get the Budgeter logo span
    const logo = page.locator('span.font-display', { hasText: 'Budgeter' });
    await expect(logo).toBeVisible();

    // Verify it's displayed on a single line by checking its bounding box
    const box = await logo.boundingBox();
    expect(box).not.toBeNull();
    
    // A single line of text with 1.25rem font size shouldn't be much taller than ~30-40px.
    // If it wraps vertically to "B u d g e t e r", the height would be way over 100px.
    expect(box!.height).toBeLessThan(50);
  });

  test('header buttons hide their text on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app-header');

    // Take screenshot to replicate the issue
    await page.locator('.app-header').screenshot({ path: 'header-screenshot.png' });

    // Wait for buttons to load
    const helpButtonSpan = page.locator('button[title="Ajuda / Glossário"] span').last();
    // In our implementation, we moved the hide-mobile-text class to the button,
    // and the CSS is `.hide-mobile-text span { display: none; }`.
    // So the span inside the button should NOT be visible.
    await expect(helpButtonSpan).toBeHidden();
  });

  test('user button skeleton text is hidden on mobile during loading', async ({ page }) => {
    await page.goto('/');
    const userBtnSkeleton = page.locator('.hide-mobile-text .skeleton-pulse');
    if (await userBtnSkeleton.count() > 0) {
      await expect(userBtnSkeleton.first()).toBeHidden();
    }
  });

  test('period header displays total budget', async ({ page }) => {
    const mockPeriod = {
      id: 'test-period-header',
      name: 'ago26',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      initialBudget: 2500,
      finalBudget: 0,
      currentBalance: 2000,
      currentBalanceDate: '2026-08-10',
      balanceHistory: { '2026-08-10': 2000 },
      createdAt: new Date().toISOString(),
      userId: 'test-user'
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem('budgeter_periods', JSON.stringify([data]));
      window.localStorage.setItem('budgeter_selected_period_id', data.id);
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    }, mockPeriod);

    await page.goto('/');
    const header = page.locator('h1').locator('..');
    await expect(header.locator('h1')).toContainText('ago26');
    await expect(header.getByText('31 dias')).toBeVisible();
    await expect(header.getByText('R$ 2.500,00')).toBeVisible();
  });

  test('canonical theme-color meta tag matches app theme and has no media query interference', async ({ page }) => {
    // Test dark mode
    await page.addInitScript(() => {
      window.localStorage.setItem('theme', 'dark');
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    });
    await page.goto('/');

    const metaTags = page.locator('meta[name="theme-color"]');
    await expect(metaTags).toHaveCount(1);
    await expect(metaTags.first()).toHaveAttribute('content', '#09090b');
    // Ensure no media query on the tag to prevent Android Chrome bugs
    const mediaAttr = await metaTags.first().getAttribute('media');
    expect(mediaAttr).toBeNull();

    // Test light mode
    await page.addInitScript(() => {
      window.localStorage.setItem('theme', 'light');
    });
    await page.goto('/');
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#fafafa');
  });
});

