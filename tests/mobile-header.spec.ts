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
});
