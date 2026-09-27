import { test, expect } from '@playwright/test';
import { loginAsQaStudent } from './support/auth';

test.describe('QA student authentication smoke test', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('logs in, persists the session, and logs out', async ({ page }) => {
    await loginAsQaStudent(page);
    const authenticatedUrl = page.url();

    await page.reload();
    await expect(page).not.toHaveURL(/\/login|\/signup/);
    expect(page.url()).toBe(authenticatedUrl);

    const logout = page.getByTitle('Sign Out');
    await expect(logout.first()).toBeVisible();
    await logout.first().click();
    await expect(page).toHaveURL(/\/login|\/signup/);
  });
});
