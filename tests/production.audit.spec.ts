import { test, expect } from '@playwright/test';
import { loginAsQaStudent } from './support/auth';

const protectedRoutes = ['/dashboard', '/career', '/roadmap', '/courses', '/opportunities', '/resume', '/interview', '/progress', '/settings', '/admin'];

test('audit authenticated CareerSetu routes and responsive layout', async ({ page }, testInfo) => {
  await loginAsQaStudent(page);
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));

  for (const route of protectedRoutes) {
    await page.goto(route);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/\/login|\/signup/);
    const summary = await page.evaluate(() => ({
      bodyLength: document.body.innerText.length,
      hasUndefined: document.body.innerText.includes('undefined'),
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      buttons: document.querySelectorAll('button').length,
      links: document.querySelectorAll('a').length,
    }));
    console.log(`QA_ROUTE ${route} body=${summary.bodyLength > 0} undefined=${summary.hasUndefined} overflow=${summary.hasHorizontalOverflow} buttons=${summary.buttons} links=${summary.links}`);
    await page.screenshot({ path: testInfo.outputPath(`route-${route.replaceAll('/', '_') || 'dashboard'}.png`), fullPage: true });
  }

  for (const size of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 390, height: 844 }]) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto('/dashboard');
    const responsive = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > window.innerWidth, bodyLength: document.body.innerText.length }));
    console.log(`QA_VIEWPORT ${size.name} overflow=${responsive.overflow} body=${responsive.bodyLength > 0}`);
    await page.screenshot({ path: testInfo.outputPath(`dashboard-${size.name}.png`), fullPage: true });
  }

  console.log(`QA_CONSOLE_ERRORS ${consoleErrors.length}`);
  console.log(`QA_FAILED_REQUESTS ${failedRequests.length}`);
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
});
