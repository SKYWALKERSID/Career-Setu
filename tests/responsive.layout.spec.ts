import { test, expect } from '@playwright/test';
import { loginAsQaStudent } from './support/auth';

test.use({ storageState: { cookies: [], origins: [] } });

test('dashboard fits the requested responsive viewports', async ({ page }) => {
  await loginAsQaStudent(page);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
