import { test, expect } from '@playwright/test';

test.describe('Dynamic System Theme', () => {
  test('system theme dynamically follows device color scheme changes without reload', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
    });

    // Start with device in light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.waitForSelector('.app-header');

    // Default should be 'system' and render in light mode
    const savedTheme = await page.evaluate(() => window.localStorage.getItem('theme'));
    expect(savedTheme).toBe('system');
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#fafafa');

    // Device dynamically switches to dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#09090b');

    // Device dynamically switches back to light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#fafafa');
  });

  test('settings modal lets user switch between Claro, Escuro, and Sistema', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('lgpd_consent_accepted', 'true');
      if (!window.localStorage.getItem('theme')) {
        window.localStorage.setItem('theme', 'light');
      }
    });

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForSelector('.app-header');

    // Fixed light mode ignores dark device preference
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);

    // Open Minha Conta / Entrar modal (last button in app-header)
    await page.locator('.app-header button.header-btn').last().click();

    const lightBtn = page.getByRole('button', { name: 'Claro' });
    const darkBtn = page.getByRole('button', { name: 'Escuro' });
    const systemBtn = page.getByRole('button', { name: 'Sistema' });

    await expect(lightBtn).toBeVisible();
    await expect(darkBtn).toBeVisible();
    await expect(systemBtn).toBeVisible();
    await expect(lightBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch to Escuro
    await darkBtn.click();
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    expect(await page.evaluate(() => window.localStorage.getItem('theme'))).toBe('dark');

    // Fixed dark mode ignores light device preference
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);

    // Switch to Sistema -> immediately adapts to current light device preference
    await systemBtn.click();
    await expect(systemBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    await expect(page.getByText('Acompanha automaticamente o tema do seu dispositivo.')).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem('theme'))).toBe('system');

    // Reload while device is dark -> pre-hydration script & app apply dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await page.waitForSelector('.app-header');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#09090b');
  });
});
