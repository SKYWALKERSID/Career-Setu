import { expect, type Page } from '@playwright/test';

export async function loginAsQaStudent(page: Page): Promise<Page> {
  const email = process.env.QA_EMAIL;
  const password = process.env.QA_PASSWORD;
  if (!email || !password) {
    throw new Error('QA_EMAIL and QA_PASSWORD must be configured before running end-to-end tests.');
  }

  await page.goto('/');
  await page.getByRole('link', { name: 'Sign In', exact: true }).first().click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Email address').fill(email);
  await page.getByPlaceholder('Enter your password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL((url) => !/\/login|\/signup/.test(url.pathname), { timeout: 30_000 });
  return page;
}

export async function completeOnboardingIfRequired(page: Page) {
  if (!/\/onboarding/.test(page.url())) return;

  await page.getByPlaceholder('e.g. Ananya Sharma', { exact: true }).fill('CareerSetu QA Student');
  await page.getByPlaceholder('e.g. Jabalpur Engineering College (JEC)', { exact: true }).fill('Sage University Bhopal');
  await page.getByRole('button', { name: /Continue/ }).click();

  for (const skill of ['Python', 'C', 'SQL', 'Git', 'HTML', 'CSS', 'JavaScript', 'Machine Learning']) {
    const option = page.getByRole('button', { name: new RegExp(`^${skill}`, 'i') }).first();
    if (await option.count()) await option.click();
  }
  await page.getByRole('button', { name: /Continue/ }).click();

  const role = page.getByRole('button', { name: /Software Developer|Software Engineer|Data Analyst/i }).first();
  if (await role.count()) await role.click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /Save Profile & Enter Dashboard/i }).click();
  await page.getByRole('button', { name: /Go to Dashboard/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}
