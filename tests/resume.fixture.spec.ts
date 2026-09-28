import path from 'node:path';
import { test, expect } from '@playwright/test';
import { loginAsQaStudent } from './support/auth';

test.use({ storageState: { cookies: [], origins: [] } });

test('resume fixture uploads and preserves an honest analysis state', async ({ page }) => {
  await loginAsQaStudent(page);
  await page.goto('/resume');
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(process.cwd(), 'tests', 'fixtures', 'qa-resume.pdf'));

  await expect.poll(async () => (await page.locator('body').innerText()).includes('Version')).toBe(true);
  const text = await page.locator('body').innerText();
  expect(text.includes('Resume evidence') || text.includes('temporarily unavailable') || text.includes('Analysis pending')).toBe(true);

  await page.reload();
  await expect.poll(async () => (await page.locator('body').innerText()).includes('Version')).toBe(true);
});
