import { test as setup, expect } from '@playwright/test';
import { completeOnboardingIfRequired, loginAsQaStudent } from './support/auth';

setup('authenticate QA student through the public login flow', async ({ page }) => {
  await loginAsQaStudent(page);
  await completeOnboardingIfRequired(page);
  await expect(page).not.toHaveURL(/\/login|\/signup/);
  await page.context().storageState({ path: 'playwright/.auth/qa-student.json' });
});
