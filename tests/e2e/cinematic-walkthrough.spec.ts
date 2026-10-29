import { test, expect, Page, Locator } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * CareerSetu — 1080p 60fps Cinematic Launch Commercial Automation
 * Aesthetic: Apple / Stripe / Linear High-Contrast SaaS Motion Engine
 * Palette: Deep Slate (#0A1128 / #0F172A), Electric Cyan (#06B6D4), Mint Teal (#14B8A6)
 */

const SYSTEM_CHROME_WIN = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test.use({
  viewport: { width: 1920, height: 1080 },
  video: {
    mode: 'on',
    size: { width: 1920, height: 1080 },
  },
  colorScheme: 'dark',
  deviceScaleFactor: 1,
  launchOptions: {
    ...(fs.existsSync(SYSTEM_CHROME_WIN) ? { executablePath: SYSTEM_CHROME_WIN } : {}),
    args: [
      '--window-size=1920,1080',
      '--force-device-scale-factor=1',
      '--high-dpi-support=1',
      '--enable-gpu-rasterization',
      '--enable-zero-copy',
      '--disable-smooth-scrolling=false',
    ],
  },
});

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://career-setu-hslc.vercel.app';

/**
 * Injects the Cinematic Overlay Engine:
 * - Animated dual-ring neon-cyan laser tracking cursor
 * - Spotlight bounding box & micro-camera zoom classes
 * - Lower-third kinetic typography HUD banner for commercial storytelling
 * - Dark-mode contrast polish
 */
async function injectCinematicEffects(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (document.getElementById('cs-cinematic-style')) return;

    const style = document.createElement('style');
    style.id = 'cs-cinematic-style';
    style.textContent = `
      :root {
        --cs-navy: #0A1128;
        --cs-slate: #0F172A;
        --cs-cyan: #06B6D4;
        --cs-teal: #14B8A6;
        --cs-white: #F8FAFC;
      }

      /* Smooth camera transitions on any spotlighted DOM node */
      .cs-spotlight-active {
        outline: 3px solid #06B6D4 !important;
        outline-offset: 6px !important;
        box-shadow: 0 0 45px rgba(6, 182, 212, 0.6), 0 0 90px rgba(20, 184, 166, 0.35) !important;
        transform: scale(1.08) !important;
        transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                    box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                    outline 0.3s ease !important;
        z-index: 9990 !important;
        position: relative !important;
        border-radius: 12px !important;
      }

      .cs-spotlight-subtle {
        outline: 2px solid #14B8A6 !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 32px rgba(20, 184, 166, 0.5) !important;
        transform: scale(1.04) !important;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        z-index: 9985 !important;
        position: relative !important;
      }

      /* Laser Tracking Cursor */
      #cs-laser-cursor {
        position: fixed;
        top: 540px;
        left: 960px;
        width: 26px;
        height: 26px;
        margin-left: -13px;
        margin-top: -13px;
        border-radius: 50%;
        background: radial-gradient(circle, #F8FAFC 15%, #06B6D4 55%, rgba(6, 182, 212, 0) 100%);
        border: 2px solid #14B8A6;
        box-shadow: 0 0 24px #06B6D4, 0 0 48px #14B8A6, 0 0 75px rgba(6, 182, 212, 0.8);
        pointer-events: none;
        z-index: 2147483647;
        transition: transform 0.15s ease-out;
        will-change: left, top, transform;
      }

      #cs-laser-cursor::after {
        content: '';
        position: absolute;
        inset: -10px;
        border-radius: 50%;
        border: 1.5px solid rgba(6, 182, 212, 0.55);
        animation: cs-cursor-pulse 1.4s infinite cubic-bezier(0.22, 1, 0.36, 1);
      }

      #cs-laser-cursor.cs-clicking {
        transform: scale(0.72);
        background: radial-gradient(circle, #FFFFFF 35%, #14B8A6 75%);
        box-shadow: 0 0 40px #14B8A6, 0 0 90px #06B6D4;
      }

      @keyframes cs-cursor-pulse {
        0% { transform: scale(0.85); opacity: 0.9; }
        70% { transform: scale(1.65); opacity: 0; }
        100% { transform: scale(1.65); opacity: 0; }
      }

      /* Commercial Lower-Third HUD Caption Bar */
      #cs-commercial-hud {
        position: fixed;
        bottom: 38px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: linear-gradient(135deg, rgba(10, 17, 40, 0.92) 0%, rgba(15, 23, 42, 0.95) 100%);
        border: 1px solid rgba(6, 182, 212, 0.5);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(6, 182, 212, 0.28);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        padding: 14px 32px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 2147483645;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      #cs-commercial-hud.cs-hud-visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      #cs-hud-badge {
        background: linear-gradient(90deg, #06B6D4, #14B8A6);
        color: #0A1128;
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        padding: 5px 12px;
        border-radius: 999px;
      }

      #cs-hud-title {
        color: #F8FAFC;
        font-weight: 600;
        font-size: 16px;
        letter-spacing: -0.01em;
        white-space: nowrap;
      }

      /* Fullscreen Outro / Kinetic Overlay Card */
      #cs-kinetic-modal {
        position: fixed;
        inset: 0;
        background: radial-gradient(circle at 50% 40%, #0F172A 0%, #0A1128 85%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 2147483646;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Inter', -apple-system, sans-serif;
        text-align: center;
        padding: 48px;
      }

      #cs-kinetic-modal.cs-modal-visible {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    if (!document.getElementById('cs-laser-cursor')) {
      const cursor = document.createElement('div');
      cursor.id = 'cs-laser-cursor';
      document.body.appendChild(cursor);
    }

    if (!document.getElementById('cs-commercial-hud')) {
      const hud = document.createElement('div');
      hud.id = 'cs-commercial-hud';
      hud.innerHTML = `
        <span id="cs-hud-badge">SCENE 01</span>
        <span id="cs-hud-title">CareerSetu — Readiness to Action</span>
      `;
      document.body.appendChild(hud);
    }
  });
}

/**
 * Updates the commercial lower-third HUD overlay banner
 */
async function showSceneHud(page: Page, badge: string, title: string): Promise<void> {
  await injectCinematicEffects(page);
  await page.evaluate(
    ({ b, t }) => {
      const hud = document.getElementById('cs-commercial-hud');
      const badgeEl = document.getElementById('cs-hud-badge');
      const titleEl = document.getElementById('cs-hud-title');
      if (hud && badgeEl && titleEl) {
        badgeEl.textContent = b;
        titleEl.textContent = t;
        hud.classList.add('cs-hud-visible');
      }
    },
    { b: badge, t: title }
  );
}

/**
 * Moves the virtual neon laser cursor along an eased cubic-bezier trajectory at 60fps
 */
async function moveCursorCinematic(
  page: Page,
  targetX: number,
  targetY: number,
  durationMs = 550
): Promise<void> {
  await injectCinematicEffects(page);
  await page.evaluate(
    async ({ tx, ty, dur }) => {
      const cursor = document.getElementById('cs-laser-cursor');
      if (!cursor) return;

      const startX = parseFloat(cursor.style.left || '960');
      const startY = parseFloat(cursor.style.top || '540');

      const easeInOutCubic = (t: number): number =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      await new Promise<void>((resolve) => {
        const startTime = performance.now();
        function frame(now: number) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / dur, 1);
          const eased = easeInOutCubic(progress);

          const curX = startX + (tx - startX) * eased;
          const curY = startY + (ty - startY) * eased;

          cursor!.style.left = `${curX}px`;
          cursor!.style.top = `${curY}px`;

          if (progress < 1) {
            requestAnimationFrame(frame);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(frame);
      });
    },
    { tx: targetX, ty: targetY, dur: durationMs }
  );
  await page.mouse.move(targetX, targetY);
}

/**
 * Applies neon-cyan spotlight + scale(1.08) camera micro-zoom to a target element,
 * glides the laser cursor to its center, and pulses a click animation.
 */
async function focusPulse(
  page: Page,
  locatorOrSelector: Locator | string,
  holdMs = 950,
  shouldClick = false
): Promise<boolean> {
  await injectCinematicEffects(page);

  const locator: Locator =
    typeof locatorOrSelector === 'string'
      ? page.locator(locatorOrSelector).first()
      : locatorOrSelector.first();

  try {
    const count = await locator.count();
    if (count === 0) return false;

    await locator.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => { });
    const box = await locator.boundingBox();
    if (!box) return false;

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await moveCursorCinematic(page, centerX, centerY, 480);

    await locator.evaluate((el: HTMLElement) => {
      el.classList.add('cs-spotlight-active');
    });

    if (shouldClick) {
      await page.evaluate(() => {
        const c = document.getElementById('cs-laser-cursor');
        if (c) c.classList.add('cs-clicking');
      });
      await page.waitForTimeout(160);
      await locator.click({ force: true, timeout: 2500 }).catch(() => { });
      await page.evaluate(() => {
        const c = document.getElementById('cs-laser-cursor');
        if (c) c.classList.remove('cs-clicking');
      });
    }

    await page.waitForTimeout(holdMs);

    await locator
      .evaluate((el: HTMLElement) => {
        el.classList.remove('cs-spotlight-active');
      })
      .catch(() => { });

    return true;
  } catch {
    return false;
  }
}

/**
 * Kinetic 60fps page scrolling using requestAnimationFrame ease-in-out
 */
async function smoothScrollDown(
  page: Page,
  deltaY: number,
  durationMs = 850
): Promise<void> {
  await page.evaluate(
    async ({ dy, dur }) => {
      const startY = window.scrollY;
      const easeInOutQuad = (t: number): number =>
        t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      await new Promise<void>((resolve) => {
        const startTime = performance.now();
        function step(now: number) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / dur, 1);
          window.scrollTo(0, startY + dy * easeInOutQuad(progress));
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(step);
      });
    },
    { dy: deltaY, dur: durationMs }
  );
}

/**
 * Resilient human-cadenced typing helper (35-55ms per character) with fallback showcase card
 */
async function typeHumanCadence(
  page: Page,
  selectors: string[],
  value: string,
  fieldLabel: string
): Promise<void> {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if ((await loc.count()) > 0 && (await loc.isVisible().catch(() => false))) {
      await focusPulse(page, loc, 250, true);
      await loc.fill('').catch(() => { });
      for (const char of value) {
        await page.keyboard.type(char, { delay: Math.floor(35 + Math.random() * 20) });
      }
      return;
    }
  }

  // Resilient Fallback: Synthesize live interactive input card if DOM selector differs
  await page.evaluate(
    ({ label, val }) => {
      let container = document.getElementById('cs-live-onboarding-card');
      if (!container) {
        container = document.createElement('div');
        container.id = 'cs-live-onboarding-card';
        container.style.cssText = `
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 680px; background: rgba(15, 23, 42, 0.96);
          border: 2px solid #06B6D4; border-radius: 20px; padding: 36px;
          box-shadow: 0 25px 80px rgba(0,0,0,0.85), 0 0 50px rgba(6,182,212,0.35);
          z-index: 99999; color: #F8FAFC; font-family: 'Inter', sans-serif;
        `;
        container.innerHTML = `
          <div style="font-size:12px;color:#06B6D4;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">
            CareerSetu • Rapid Persona Onboarding
          </div>
          <h2 style="font-size:26px;font-weight:800;margin:0 0 24px 0;color:#F8FAFC;">
            Configure Student Readiness Profile
          </h2>
          <div id="cs-onboarding-fields" style="display:flex;flex-direction:column;gap:14px;"></div>
          <button id="cs-onboarding-submit" style="margin-top:24px;width:100%;padding:14px;border-radius:12px;background:linear-gradient(90deg,#06B6D4,#14B8A6);color:#0A1128;font-weight:800;font-size:15px;border:none;">
            Generate Readiness Profile →
          </button>
        `;
        document.body.appendChild(container);
      }

      const safeId = `cs-field-${label.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
      const fields = document.getElementById('cs-onboarding-fields')!;
      const row = document.createElement('div');
      row.id = safeId;
      row.style.cssText = `
        background: #0A1128; border: 1px solid #334155; border-radius: 10px;
        padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;
      `;
      row.innerHTML = `
        <span style="color:#94A3B8;font-size:13px;font-weight:600;">${label}</span>
        <span class="cs-typed-val" style="color:#06B6D4;font-size:15px;font-weight:700;"></span>
      `;
      fields.appendChild(row);
    },
    { label: fieldLabel, val: value }
  );

  const safeFieldId = `cs-field-${fieldLabel.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
  const rowLocator = page.locator(`#${safeFieldId}`);
  await focusPulse(page, rowLocator, 220, false);

  let current = '';
  for (const ch of value) {
    current += ch;
    await page.evaluate(
      ({ id, txt }) => {
        const el = document.querySelector(`#${id} .cs-typed-val`);
        if (el) el.textContent = txt;
      },
      { id: safeFieldId, txt: current }
    );
    await page.waitForTimeout(Math.floor(35 + Math.random() * 20));
  }
}

test.describe('CareerSetu — Full 1080p 60fps Launch Commercial Suite', () => {
  test.setTimeout(240000);

  test('Execute 9-Scene Cinematic Commercial Walkthrough', async ({ page, context }) => {
    const recordingStartMs = Date.now();
    const manifestPath = path.resolve(process.cwd(), 'demo-assets/audio-manifest.json');
    let sceneTimings: Array<{ startSec: number; durationSec: number }> = [];
    if (fs.existsSync(manifestPath)) {
      try {
        const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        sceneTimings = m.scenes || [];
      } catch {
        sceneTimings = [];
      }
    }

    async function syncToSceneEnd(sceneIdxZeroBased: number) {
      const timing = sceneTimings[sceneIdxZeroBased];
      if (!timing) return;
      const targetEndMs = (timing.startSec + timing.durationSec) * 1000;
      const elapsedMs = Date.now() - recordingStartMs;
      const remainingMs = targetEndMs - elapsedMs;
      if (remainingMs > 50) {
        await page.waitForTimeout(remainingMs);
      }
    }

    // Load existing QA Student Auth State if available so protected routes render rich data
    const authPath = path.resolve(process.cwd(), 'playwright/.auth/qa-student.json');
    if (fs.existsSync(authPath)) {
      try {
        const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
        if (Array.isArray(authData.cookies) && authData.cookies.length > 0) {
          await context.addCookies(authData.cookies);
        }
      } catch {
        // Proceed with standard navigation and synthetic fallback resilience
      }
    }

    // =========================================================================
    // SCENE 1: THE HOOK (Landing Page `/`)
    // =========================================================================
    console.log('🎬 Scene 1: The Hook (Landing Page)');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await injectCinematicEffects(page);
    await showSceneHud(
      page,
      'SCENE 01 • THE HOOK',
      'CareerSetu — Bridging Higher Education to Meaningful Careers'
    );

    // High-contrast sweep across hero title
    const heroHeading = page.locator('h1').first();
    await focusPulse(page, heroHeading, 1200, false);

    // Highlight central philosophy: Readiness -> Action
    const philosophyTarget = page
      .locator('p, span, h2')
      .filter({ hasText: /Readiness|Action|Career|Roadmaps/i })
      .first();
    await focusPulse(page, philosophyTarget, 1000, false);

    // Sweep cursor to primary CTA with neon pulse
    const primaryCta = page
      .locator('a, button')
      .filter({ hasText: /Explore|Get Started|Launch|Dashboard|Sign/i })
      .first();
    await focusPulse(page, primaryCta, 1100, false);
    await smoothScrollDown(page, 480, 750);
    await smoothScrollDown(page, -480, 650);
    await syncToSceneEnd(0);

    // =========================================================================
    // SCENE 2: RAPID PERSONA ONBOARDING (`/onboarding`)
    // =========================================================================
    console.log('🎬 Scene 2: Rapid Persona Onboarding');
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => { });
    await injectCinematicEffects(page);
    await showSceneHud(
      page,
      'SCENE 02 • ONBOARDING',
      'Rapid Persona Calibration — Degree, Stack & Target Trajectory'
    );

    await typeHumanCadence(
      page,
      ['input[name*="name" i]', 'input[placeholder*="name" i]'],
      'Aarav Sharma',
      'Full Name'
    );
    await typeHumanCadence(
      page,
      ['input[name*="degree" i]', 'select[name*="degree" i]'],
      'B.Tech Computer Science & Engineering',
      'Academic Degree'
    );
    await typeHumanCadence(
      page,
      ['input[name*="skill" i]', 'textarea[name*="skill" i]'],
      'Python, SQL, FastAPI, Git',
      'Verified Skills'
    );
    await typeHumanCadence(
      page,
      ['input[name*="career" i]', 'input[name*="role" i]'],
      'Data Engineer / Systems Architect',
      'Target Career'
    );

    const submitBtn = page
      .locator('#cs-onboarding-submit, button[type="submit"], button:has-text("Generate"), button:has-text("Save")')
      .first();
    await focusPulse(page, submitBtn, 650, true);
    await syncToSceneEnd(1);

    // =========================================================================
    // SCENE 3: THE 0–100 EXPLAINABLE READINESS ENGINE (`/dashboard`)
    // =========================================================================
    console.log('🎬 Scene 3: 0-100 Explainable Readiness Engine');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => { });
    await injectCinematicEffects(page);
    await showSceneHud(
      page,
      'SCENE 03 • READINESS ENGINE',
      '0–100 Explainable Career Readiness Score Across 6 Dimensions'
    );

    // Ensure the 6 weighted dimensions are visibly spotlighted
    await page.evaluate(() => {
      if (document.getElementById('cs-readiness-hud-panel')) return;
      const panel = document.createElement('div');
      panel.id = 'cs-readiness-hud-panel';
      panel.style.cssText = `
        position: fixed; top: 96px; right: 42px; width: 460px;
        background: rgba(10, 17, 40, 0.94); border: 1.5px solid rgba(6, 182, 212, 0.6);
        border-radius: 18px; padding: 24px; z-index: 9998;
        box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(6, 182, 212, 0.25);
        font-family: 'Inter', sans-serif; color: #F8FAFC;
      `;
      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <div style="font-size:11px;color:#06B6D4;font-weight:800;letter-spacing:0.12em;">EXPLAINABLE SCORE</div>
            <div style="font-size:20px;font-weight:800;">Readiness Breakdown</div>
          </div>
          <div id="cs-score-gauge" style="font-size:34px;font-weight:900;color:#14B8A6;background:rgba(20,184,166,0.12);padding:8px 16px;border-radius:12px;border:1px solid #14B8A6;">
            65<span style="font-size:16px;color:#94A3B8;">/100</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="cs-dim-card" id="cs-dim-1" style="background:#0F172A;border:1px solid #334155;padding:10px 12px;border-radius:10px;">
            <div style="font-size:12px;color:#94A3B8;">Technical & Domain</div>
            <div style="font-size:16px;font-weight:800;color:#06B6D4;">25% Weight</div>
          </div>
          <div class="cs-dim-card" id="cs-dim-2" style="background:#0F172A;border:1px solid #334155;padding:10px 12px;border-radius:10px;">
            <div style="font-size:12px;color:#94A3B8;">Projects & Evidence</div>
            <div style="font-size:16px;font-weight:800;color:#14B8A6;">20% Weight</div>
          </div>
          <div class="cs-dim-card" id="cs-dim-3" style="background:#0F172A;border:1px solid #334155;padding:10px 12px;border-radius:10px;">
            <div style="font-size:12px;color:#94A3B8;">Academic Foundation</div>
            <div style="font-size:16px;font-weight:800;color:#06B6D4;">15% Weight</div>
          </div>
          <div class="cs-dim-card" id="cs-dim-4" style="background:#0F172A;border:1px solid #334155;padding:10px 12px;border-radius:10px;">
            <div style="font-size:12px;color:#94A3B8;">Resume Quality</div>
            <div style="font-size:16px;font-weight:800;color:#14B8A6;">15% Weight</div>
          </div>
          <div class="cs-dim-card" id="cs-dim-5" style="background:#0F172A;border:1px solid #334155;padding:10px 12px;border-radius:10px;">
            <div style="font-size:12px;color:#94A3B8;">Interview Readiness</div>
            <div style="font-size:16px;font-weight:800;color:#06B6D4;">15% Weight</div>
          </div>
          <div class="cs-dim-card" id="cs-dim-6" style="background:#0F172A;border:1px solid #334155;padding:10px 12px;border-radius:10px;">
            <div style="font-size:12px;color:#94A3B8;">Career Alignment</div>
            <div style="font-size:16px;font-weight:800;color:#14B8A6;">10% Weight</div>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
    });

    await focusPulse(page, '#cs-score-gauge', 700, false);
    for (let i = 1; i <= 6; i++) {
      await focusPulse(page, `#cs-dim-${i}`, 360, false);
    }
    await syncToSceneEnd(2);

    // =========================================================================
    // SCENE 4: AI CAREER RECOMMENDATIONS & SKILL-GAP ENGINE (`/career`)
    // =========================================================================
    console.log('🎬 Scene 4: AI Career Recommendations & Skill-Gap Engine');
    await page.goto(`${BASE_URL}/career`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => { });
    await injectCinematicEffects(page);
    await showSceneHud(
      page,
      'SCENE 04 • SKILL-GAP ENGINE',
      'AI Career Recommendations • Deficit Diagnosis & Rationale'
    );

    await page.evaluate(() => {
      if (document.getElementById('cs-career-spotlight-card')) return;
      const card = document.createElement('div');
      card.id = 'cs-career-spotlight-card';
      card.style.cssText = `
        position: fixed; top: 120px; right: 48px; width: 520px;
        background: rgba(15, 23, 42, 0.96); border: 2px solid #06B6D4;
        border-radius: 18px; padding: 26px; z-index: 9998;
        box-shadow: 0 25px 70px rgba(0,0,0,0.85); color: #F8FAFC; font-family: 'Inter', sans-serif;
      `;
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="background:rgba(6,182,212,0.18);color:#06B6D4;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:800;">TOP MATCH • 88% FIT</span>
          <span style="color:#14B8A6;font-size:13px;font-weight:700;">High Demand Pathway</span>
        </div>
        <h3 id="cs-role-title" style="font-size:24px;font-weight:800;margin:12px 0 8px 0;">Data Systems Engineer</h3>
        <div id="cs-role-rationale" style="background:#0A1128;border-left:3px solid #14B8A6;padding:10px 14px;border-radius:6px;font-size:13px;color:#CBD5E1;margin-bottom:16px;">
          <strong style="color:#F8FAFC;">Why am I seeing this?</strong> Strong overlap with your verified Python, SQL, and FastAPI foundation.
        </div>
        <div id="cs-deficit-badges" style="background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.4);padding:12px 14px;border-radius:10px;">
          <div style="font-size:11px;font-weight:800;color:#FB7185;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">
            Priority Skill Deficits Detected
          </div>
          <div style="font-size:14px;font-weight:700;color:#F8FAFC;">
            Missing: Apache Spark • Docker • Cloud Warehouses
          </div>
        </div>
      `;
      document.body.appendChild(card);
    });

    await focusPulse(page, '#cs-role-title', 800, false);
    await focusPulse(page, '#cs-role-rationale', 900, false);
    await focusPulse(page, '#cs-deficit-badges', 1100, false);
    await syncToSceneEnd(3);

    // =========================================================================
    // SCENE 5: 90-DAY EXECUTION ROADMAP (`/progress` & `/roadmap`)
    // =========================================================================
    console.log('🎬 Scene 5: 90-Day Execution Roadmap');
    await page.goto(`${BASE_URL}/roadmap`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => { });
    await injectCinematicEffects(page);
    await showSceneHud(
      page,
      'SCENE 05 • 90-DAY ROADMAP',
      'Phased Weekly Execution & Real-Time Score Recalibration'
    );

    await page.evaluate(() => {
      if (document.getElementById('cs-roadmap-hud')) return;
      const modal = document.createElement('div');
      modal.id = 'cs-roadmap-hud';
      modal.style.cssText = `
        position: fixed; top: 110px; right: 48px; width: 560px;
        background: rgba(10, 17, 40, 0.96); border: 2px solid #14B8A6;
        border-radius: 18px; padding: 24px; z-index: 9998;
        box-shadow: 0 25px 70px rgba(0,0,0,0.85); color: #F8FAFC; font-family: 'Inter', sans-serif;
      `;
      modal.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div style="display:flex;gap:8px;">
            <span id="cs-phase-1" style="background:#06B6D4;color:#0A1128;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;">Phase 1: Foundations</span>
            <span id="cs-phase-2" style="background:#1E293B;color:#CBD5E1;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;">Phase 2: Capstone</span>
            <span id="cs-phase-3" style="background:#1E293B;color:#CBD5E1;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;">Phase 3: Interview Sprints</span>
          </div>
          <div id="cs-live-score-pill" style="font-size:15px;font-weight:900;color:#06B6D4;">Readiness: 65 → 69 (+4)</div>
        </div>
        <div id="cs-milestone-task" style="background:#0F172A;border:1.5px solid #06B6D4;padding:14px 16px;border-radius:12px;display:flex;align-items:center;gap:14px;cursor:pointer;">
          <div id="cs-task-check" style="width:22px;height:22px;border-radius:6px;border:2px solid #06B6D4;display:flex;align-items:center;justify-content:center;font-weight:900;color:#0A1128;"></div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#F8FAFC;">Complete SQL Window Functions & Partitioning Lab</div>
            <div style="font-size:12px;color:#94A3B8;">Week 2 Deliverable • Verifiable GitHub Artifact</div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    });

    await focusPulse(page, '#cs-phase-1', 450, false);
    await focusPulse(page, '#cs-phase-2', 450, false);
    await focusPulse(page, '#cs-phase-3', 450, false);

    await focusPulse(page, '#cs-milestone-task', 750, true);
    await page.evaluate(() => {
      const chk = document.getElementById('cs-task-check');
      const pill = document.getElementById('cs-live-score-pill');
      if (chk) {
        chk.style.background = '#14B8A6';
        chk.textContent = '✓';
      }
      if (pill) {
        pill.style.color = '#14B8A6';
        pill.textContent = 'Readiness Resynced: 69/100 ▲';
      }
    });
    await focusPulse(page, '#cs-live-score-pill', 950, false);
    await syncToSceneEnd(4);

    // =========================================================================
    // SCENE 6: CURATED OPPORTUNITY MATCHING (`/opportunities`)
    // =========================================================================
    console.log('🎬 Scene 6: Curated Opportunity Matching');
    await page.goto(`${BASE_URL}/opportunities`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => { });
    await injectCinematicEffects(page);
    await showSceneHud(
      page,
      'SCENE 06 • OPPORTUNITY MATCHING',
      'Verified Skill-Overlap Filtering for Internships & New-Grad Roles'
    );

    const oppCard = page.locator('article, [class*="card" i], main div').first();
    await focusPulse(page, oppCard, 1100, false);
    await smoothScrollDown(page, 420, 750);
    await syncToSceneEnd(5);

    // =========================================================================
    // SCENE 7: EVIDENCE-GROUNDED RESUME COPILOT (`/resume`)
    // =========================================================================
    console.log('🎬 Scene 7: Evidence-Grounded Resume Copilot');
    await page.goto(`${BASE_URL}/resume`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => { });
    await injectCinematicEffects(page);
    await showSceneHud(
      page,
      'SCENE 07 • RESUME COPILOT',
      'Zero-Hallucination Bullet Optimization (Accomplished X, Measured by Y, By Doing Z)'
    );

    await page.evaluate(() => {
      if (document.getElementById('cs-resume-diff-hud')) return;
      const diff = document.createElement('div');
      diff.id = 'cs-resume-diff-hud';
      diff.style.cssText = `
        position: fixed; top: 115px; right: 48px; width: 580px;
        background: rgba(15, 23, 42, 0.97); border: 2px solid #06B6D4;
        border-radius: 18px; padding: 24px; z-index: 9998;
        box-shadow: 0 25px 75px rgba(0,0,0,0.85); color: #F8FAFC; font-family: 'Inter', sans-serif;
      `;
      diff.innerHTML = `
        <div style="font-size:11px;font-weight:800;color:#06B6D4;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">
          Evidence-Grounded Live Diff • Zero Hallucinated Claims
        </div>
        <div id="cs-bullet-before" style="background:rgba(244,63,94,0.12);border-left:3px solid #F43F5E;padding:10px 14px;border-radius:8px;margin-bottom:12px;font-size:13px;color:#FDA4AF;">
          <strong>Before:</strong> Worked on backend API queries and database tables for student portal.
        </div>
        <div id="cs-bullet-after" style="background:rgba(20,184,166,0.14);border-left:3px solid #14B8A6;padding:12px 14px;border-radius:8px;font-size:13.5px;color:#F8FAFC;">
          <strong style="color:#14B8A6;">After (Google/Harvard XYZ):</strong> Accomplished <strong>42% faster API response times</strong> [X], as measured by <strong>p95 FastAPI telemetry</strong> [Y], by <strong>refactoring SQL indexing and query batching</strong> [Z].
        </div>
      `;
      document.body.appendChild(diff);
    });

    await focusPulse(page, '#cs-bullet-before', 850, false);
    await focusPulse(page, '#cs-bullet-after', 1350, false);
    await syncToSceneEnd(6);

    // =========================================================================
    // SCENE 8: ROLE-SPECIFIC AI MOCK INTERVIEW (`/interview`)
    // =========================================================================
    console.log('🎬 Scene 8: Role-Specific AI Mock Interview');
    await page.goto(`${BASE_URL}/interview`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => { });
    await injectCinematicEffects(page);
    await showSceneHud(
      page,
      'SCENE 08 • AI MOCK INTERVIEW',
      'Adaptive Multi-Turn Technical Simulation & Real-Time STAR Rubric'
    );

    await typeHumanCadence(
      page,
      ['textarea', 'input[type="text"]'],
      'I optimized PostgreSQL partition keys and composite indexes, cutting query latency by 45%.',
      'Candidate Technical Response (Junior Data Engineer)'
    );

    await page.evaluate(() => {
      if (document.getElementById('cs-star-scorecard')) return;
      const card = document.createElement('div');
      card.id = 'cs-star-scorecard';
      card.style.cssText = `
        position: fixed; top: 110px; right: 48px; width: 480px;
        background: rgba(10, 17, 40, 0.96); border: 2px solid #14B8A6;
        border-radius: 18px; padding: 22px; z-index: 99999;
        box-shadow: 0 25px 70px rgba(0,0,0,0.85); color: #F8FAFC; font-family: 'Inter', sans-serif;
      `;
      card.innerHTML = `
        <div style="font-size:11px;font-weight:800;color:#14B8A6;letter-spacing:0.12em;text-transform:uppercase;">
          POST-TURN STAR RUBRIC EVALUATION
        </div>
        <h4 style="font-size:18px;font-weight:800;margin:6px 0 14px 0;">Junior Data Engineer • Turn #1</h4>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
          <div style="background:#0F172A;padding:10px;border-radius:10px;text-align:center;border:1px solid #06B6D4;">
            <div style="font-size:11px;color:#94A3B8;">Tech Accuracy</div>
            <div style="font-size:20px;font-weight:900;color:#06B6D4;">9.2/10</div>
          </div>
          <div style="background:#0F172A;padding:10px;border-radius:10px;text-align:center;border:1px solid #14B8A6;">
            <div style="font-size:11px;color:#94A3B8;">STAR Clarity</div>
            <div style="font-size:20px;font-weight:900;color:#14B8A6;">8.8/10</div>
          </div>
          <div style="background:#0F172A;padding:10px;border-radius:10px;text-align:center;border:1px solid #06B6D4;">
            <div style="font-size:11px;color:#94A3B8;">System Depth</div>
            <div style="font-size:20px;font-weight:900;color:#06B6D4;">9.0/10</div>
          </div>
        </div>
      `;
      document.body.appendChild(card);
    });

    await focusPulse(page, '#cs-star-scorecard', 1400, false);
    await syncToSceneEnd(7);

    // =========================================================================
    // SCENE 9: INSTITUTIONAL ANALYTICS & OUTRO (`/admin`)
    // =========================================================================
    console.log('🎬 Scene 9: Institutional Analytics & Commercial Outro');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => { });
    await injectCinematicEffects(page);
    await showSceneHud(
      page,
      'SCENE 09 • COHORT INTELLIGENCE & OUTRO',
      'CareerSetu: From Aspiration to Actionable Readiness'
    );

    await smoothScrollDown(page, 320, 650);

    // Trigger High-Impact Closing Commercial End-Card
    await page.evaluate(() => {
      const modal = document.createElement('div');
      modal.id = 'cs-kinetic-modal';
      modal.innerHTML = `
        <div style="background:rgba(6,182,212,0.14);border:1px solid #06B6D4;color:#06B6D4;font-weight:800;font-size:13px;letter-spacing:0.18em;padding:8px 20px;border-radius:999px;text-transform:uppercase;margin-bottom:24px;">
          NEXT.JS 15 • SUPABASE • HYBRID AI GATEWAY
        </div>
        <h1 style="font-size:64px;font-weight:900;color:#F8FAFC;letter-spacing:-0.03em;margin:0 0 18px 0;line-height:1.08;">
          CareerSetu: From Aspiration to<br/>
          <span style="background:linear-gradient(90deg,#06B6D4,#14B8A6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
            Actionable Readiness.
          </span>
        </h1>
        <p style="font-size:22px;color:#94A3B8;max-width:760px;margin:0 0 36px 0;">
          Explainable Scoring • 90-Day Execution Roadmaps • Evidence-Grounded Resume & Interview AI
        </p>
        <div id="cs-outro-repo" style="background:#0F172A;border:2px solid #14B8A6;padding:16px 36px;border-radius:14px;font-size:20px;font-weight:700;color:#F8FAFC;box-shadow:0 0 50px rgba(20,184,166,0.4);">
          github.com/SKYWALKERSID/Career-Setu
        </div>
      `;
      document.body.appendChild(modal);
      requestAnimationFrame(() => modal.classList.add('cs-modal-visible'));
    });

    await focusPulse(page, '#cs-outro-repo', 2200, false);
    await expect(page.locator('#cs-outro-repo')).toBeVisible();
    await syncToSceneEnd(8);
  });
});

