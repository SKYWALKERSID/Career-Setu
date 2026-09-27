import { test, expect } from '@playwright/test';
import { loginAsQaStudent } from './support/auth';

test('onboarding completion CTA navigates to the dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  const signOut = page.getByTitle('Sign Out');
  if (await signOut.count()) await signOut.click();
  await loginAsQaStudent(page);
  await page.goto('/onboarding');

  await page.getByPlaceholder('e.g. Ananya Sharma', { exact: true }).fill('CareerSetu QA Student');
  await page.getByPlaceholder('e.g. Jabalpur Engineering College (JEC)', { exact: true }).fill('Sage University Bhopal');
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /Save Profile & Enter Dashboard/i }).click();

  await expect(page.getByRole('button', { name: /Go to Dashboard/i })).toBeVisible();
  await page.getByRole('button', { name: /Go to Dashboard/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Welcome, CareerSetu QA Student/i })).toBeVisible();
});
