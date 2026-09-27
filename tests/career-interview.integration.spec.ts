import { test, expect } from '@playwright/test';
import { loginAsQaStudent } from './support/auth';

test('career target selection is available in interview setup', async ({ page }) => {
  await page.goto('/dashboard');
  const signOut = page.getByTitle('Sign Out');
  if (await signOut.count()) await signOut.click();
  await loginAsQaStudent(page);

  await page.goto('/career');
  const targetToggle = page.getByRole('button', { name: /Set target role|Remove target role/i }).first();
  await expect(targetToggle).toBeVisible();
  if ((await targetToggle.getAttribute('aria-label')) === 'Set target role') {
    await targetToggle.click();
  }

  await page.goto('/interview/setup');
  const roleSelect = page.locator('select').first();
  await expect(roleSelect).toBeVisible();
  await expect(roleSelect.locator('option')).not.toHaveCount(1);
  await expect(page.getByRole('button', { name: /Start Mock Interview/i })).toBeEnabled();
});
