import { test, expect, Page, Locator } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * CareerSetu — Frame-Synchronized 1080p 60fps Launch Commercial Suite
 *
 * Every scene's DOM choreography, laser cursor movement, spotlight zoom, and live
 * voiceover subtitle bar are locked to the exact phrase timings of the Google Gemini
 * Studio Voice stems (`demo-assets/audio-manifest.json`), and exact video slice markers
 * (`demo-assets/video-scene-markers.json`) are exported so `scripts/render-cinematic.js`
 * trims out inter-page navigation latency and locks every scene to 0.00ms drift.
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
 * - Dual-ring neon-cyan laser tracking cursor
 * - Spotlight bounding box & micro-camera zoom (`scale(1.08)`)
 * - Synchronized two-line commercial HUD + live voiceover caption bar
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

      .cs-spotlight-active {
        outline: 3px solid #06B6D4 !important;
        outline-offset: 6px !important;
        box-shadow: 0 0 45px rgba(6, 182, 212, 0.65), 0 0 90px rgba(20, 184, 166, 0.38) !important;
        transform: scale(1.08) !important;
        transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1),
                    box-shadow 0.38s cubic-bezier(0.16, 1, 0.3, 1),
                    outline 0.25s ease !important;
        z-index: 9990 !important;
        position: relative !important;
        border-radius: 12px !important;
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
        box-shadow: 0 0 24px #06B6D4, 0 0 48px #14B8A6, 0 0 75px rgba(6, 182, 212, 0.85);
        pointer-events: none;
        z-index: 2147483647;
        transition: transform 0.14s ease-out;
        will-change: left, top, transform;
      }

      #cs-laser-cursor::after {
        content: '';
        position: absolute;
        inset: -10px;
        border-radius: 50%;
        border: 1.5px solid rgba(6, 182, 212, 0.55);
        animation: cs-cursor-pulse 1.3s infinite cubic-bezier(0.22, 1, 0.36, 1);
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

      /* Synchronized Lower-Third HUD & Live Voiceover Subtitle Bar */
      #cs-commercial-hud {
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(10, 17, 40, 0.94) 0%, rgba(15, 23, 42, 0.96) 100%);
        border: 1.5px solid rgba(6, 182, 212, 0.55);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.82), 0 0 38px rgba(6, 182, 212, 0.32);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        padding: 14px 32px;
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        z-index: 2147483645;
        min-width: 760px;
        max-width: 1180px;
        pointer-events: none;
        font-family: 'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      #cs-hud-top-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      #cs-hud-badge {
        background: linear-gradient(90deg, #06B6D4, #14B8A6);
        color: #0A1128;
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        padding: 4px 11px;
        border-radius: 999px;
      }

      #cs-hud-title {
        color: #94A3B8;
        font-weight: 600;
        font-size: 13px;
        letter-spacing: 0.01em;
      }

      #cs-hud-caption {
        color: #F8FAFC;
        font-weight: 700;
        font-size: 18px;
        letter-spacing: -0.01em;
        text-align: center;
        line-height: 1.35;
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
        z-index: 2147483644;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1);
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
        <div id="cs-hud-top-row">
          <span id="cs-hud-badge">SCENE 01</span>
          <span id="cs-hud-title">CareerSetu — Readiness to Action</span>
        </div>
        <div id="cs-hud-caption">Meet CareerSetu — Bridging higher education to meaningful careers.</div>
      `;
      document.body.appendChild(hud);
    }
  });
}

/**
 * Updates the synchronized scene header + live spoken voiceover caption
 */
async function updateVoiceoverHud(
  page: Page,
  badge: string,
  sceneTitle: string,
  spokenSubtitle: string
): Promise<void> {
  await injectCinematicEffects(page);
  await page.evaluate(
    ({ b, t, sub }) => {
      const badgeEl = document.getElementById('cs-hud-badge');
      const titleEl = document.getElementById('cs-hud-title');
      const capEl = document.getElementById('cs-hud-caption');
      if (badgeEl) badgeEl.textContent = b;
      if (titleEl) titleEl.textContent = t;
      if (capEl) capEl.textContent = `"${sub}"`;
    },
    { b: badge, t: sceneTitle, sub: spokenSubtitle }
  );
}

/**
 * Moves the virtual neon laser cursor along an eased cubic-bezier trajectory
 */
async function moveCursorCinematic(
  page: Page,
  targetX: number,
  targetY: number,
  durationMs = 420
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

          cursor!.style.left = `${startX + (tx - startX) * eased}px`;
          cursor!.style.top = `${startY + (ty - startY) * eased}px`;

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
 * Spotlights a DOM element with neon-cyan glow + scale(1.08), moves cursor to it, and holds for exact duration
 */
async function focusPulse(
  page: Page,
  locatorOrSelector: Locator | string,
  holdMs = 800,
  shouldClick = false
): Promise<boolean> {
  await injectCinematicEffects(page);

  const locator: Locator =
    typeof locatorOrSelector === 'string'
      ? page.locator(locatorOrSelector).first()
      : locatorOrSelector.first();

  try {
    if ((await locator.count()) === 0) {
      await page.waitForTimeout(holdMs);
      return false;
    }

    await locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
    const box = await locator.boundingBox();
    if (!box) {
      await page.waitForTimeout(holdMs);
      return false;
    }

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    const moveTime = Math.min(380, Math.floor(holdMs * 0.35));
    await moveCursorCinematic(page, centerX, centerY, moveTime);

    await locator.evaluate((el: HTMLElement) => {
      el.classList.add('cs-spotlight-active');
    });

    if (shouldClick) {
      await page.evaluate(() => {
        document.getElementById('cs-laser-cursor')?.classList.add('cs-clicking');
      });
      await page.waitForTimeout(120);
      await locator.click({ force: true, timeout: 1500 }).catch(() => {});
      await page.evaluate(() => {
        document.getElementById('cs-laser-cursor')?.classList.remove('cs-clicking');
      });
    }

    const remainHold = Math.max(100, holdMs - moveTime - (shouldClick ? 120 : 0));
    await page.waitForTimeout(remainHold);

    await locator
      .evaluate((el: HTMLElement) => {
        el.classList.remove('cs-spotlight-active');
      })
      .catch(() => {});

    return true;
  } catch {
    await page.waitForTimeout(holdMs);
    return false;
  }
}

/**
 * Kinetic 60fps page scrolling using requestAnimationFrame ease-in-out
 */
async function smoothScrollDown(
  page: Page,
  deltaY: number,
  durationMs = 700
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
 * Types a field value inside a synchronized time budget `budgetMs` so typing finishes
 * on the exact beat the voiceover finishes naming that field.
 */
async function typeSynchronizedField(
  page: Page,
  cardTitle: string,
  fieldLabel: string,
  value: string,
  budgetMs: number
): Promise<void> {
  const safeFieldId = `cs-field-${fieldLabel.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;

  await page.evaluate(
    ({ title, label, id }) => {
      let container = document.getElementById('cs-live-onboarding-card');
      if (!container) {
        container = document.createElement('div');
        container.id = 'cs-live-onboarding-card';
        container.style.cssText = `
          position: fixed; top: 44%; left: 50%; transform: translate(-50%, -50%);
          width: 720px; background: rgba(15, 23, 42, 0.97);
          border: 2px solid #06B6D4; border-radius: 20px; padding: 32px;
          box-shadow: 0 25px 80px rgba(0,0,0,0.88), 0 0 55px rgba(6,182,212,0.38);
          z-index: 99999; color: #F8FAFC; font-family: 'Inter', sans-serif;
        `;
        container.innerHTML = `
          <div style="font-size:11px;color:#06B6D4;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:6px;">
            ${title}
          </div>
          <h2 style="font-size:24px;font-weight:800;margin:0 0 20px 0;color:#F8FAFC;">
            Live Interactive Profile Calibration
          </h2>
          <div id="cs-onboarding-fields" style="display:flex;flex-direction:column;gap:12px;"></div>
          <button id="cs-onboarding-submit" style="margin-top:20px;width:100%;padding:13px;border-radius:12px;background:linear-gradient(90deg,#06B6D4,#14B8A6);color:#0A1128;font-weight:800;font-size:15px;border:none;">
            Generate Readiness Profile →
          </button>
        `;
        document.body.appendChild(container);
      }

      const fields = document.getElementById('cs-onboarding-fields')!;
      let row = document.getElementById(id);
      if (!row) {
        row = document.createElement('div');
        row.id = id;
        row.style.cssText = `
          background: #0A1128; border: 1.5px solid #334155; border-radius: 10px;
          padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;
        `;
        row.innerHTML = `
          <span style="color:#94A3B8;font-size:13px;font-weight:600;">${label}</span>
          <span class="cs-typed-val" style="color:#06B6D4;font-size:15px;font-weight:700;"></span>
        `;
        fields.appendChild(row);
      }
    },
    { title: cardTitle, label: fieldLabel, id: safeFieldId }
  );

  const rowLocator = page.locator(`#${safeFieldId}`);
  const box = await rowLocator.boundingBox().catch(() => null);
  if (box) {
    await moveCursorCinematic(page, box.x + box.width / 2, box.y + box.height / 2, 220);
  }

  await rowLocator.evaluate((el: HTMLElement) => el.classList.add('cs-spotlight-active'));

  const charDelay = Math.max(12, Math.min(38, Math.floor((budgetMs - 260) / Math.max(1, value.length))));
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
    await page.waitForTimeout(charDelay);
  }

  await rowLocator.evaluate((el: HTMLElement) => el.classList.remove('cs-spotlight-active'));
}

test.describe('CareerSetu — Frame-Synchronized 1080p 60fps Launch Commercial', () => {
  test.setTimeout(300000);

  test('Execute 9-Scene Voiceover-Locked Commercial Walkthrough', async ({ page, context }) => {
    // Video recording begins when `page` is created in the browser context
    const videoEpochMs = Date.now();

    const manifestPath = path.resolve(process.cwd(), 'demo-assets/audio-manifest.json');
    const markersPath = path.resolve(process.cwd(), 'demo-assets/video-scene-markers.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const scenes: Array<{ id: string; text: string; startSec: number; durationSec: number }> =
      manifest.scenes;

    const sceneMarkers: Array<{
      id: string;
      voDurationSec: number;
      videoStartSec: number;
      videoEndSec: number;
    }> = [];

    // Load QA Student Auth Cookie if available
    const authPath = path.resolve(process.cwd(), 'playwright/.auth/qa-student.json');
    if (fs.existsSync(authPath)) {
      try {
        const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
        if (Array.isArray(authData.cookies) && authData.cookies.length > 0) {
          await context.addCookies(authData.cookies);
        }
      } catch {
        // Proceed with standard route rendering
      }
    }

    /**
     * Helper to run a scene for the exact duration of its voiceover stem (`voDurationSec`),
     * recording exact `videoStartSec` and `videoEndSec` AFTER `page.goto` completes so
     * all network navigation latency is stripped out during FFmpeg compositing.
     */
    async function executeSyncedScene(
      sceneIndex: number,
      urlPath: string,
      actionFn: (voDurationMs: number) => Promise<void>
    ) {
      const sceneMeta = scenes[sceneIndex];
      const voDurationMs = Math.round(sceneMeta.durationSec * 1000);

      await page
        .goto(`${BASE_URL}${urlPath}`, { waitUntil: 'domcontentloaded', timeout: 25000 })
        .catch(() => {});
      await injectCinematicEffects(page);
      // Small settle time so fonts/layout are painted before the scene camera starts rolling
      await page.waitForTimeout(250);

      const sceneStartMs = Date.now();
      const videoStartSec = Number(((sceneStartMs - videoEpochMs) / 1000).toFixed(3));

      await actionFn(voDurationMs);

      // Pad remaining milliseconds if actions finished slightly early so raw clip >= voDurationMs
      const elapsedSceneMs = Date.now() - sceneStartMs;
      if (elapsedSceneMs < voDurationMs) {
        await page.waitForTimeout(voDurationMs - elapsedSceneMs);
      }

      const sceneEndMs = Date.now();
      const videoEndSec = Number(((sceneEndMs - videoEpochMs) / 1000).toFixed(3));

      sceneMarkers.push({
        id: sceneMeta.id,
        voDurationSec: sceneMeta.durationSec,
        videoStartSec,
        videoEndSec,
      });
    }

    // =========================================================================
    // SCENE 1: THE HOOK (Landing Page `/`)
    // VO: "Meet CareerSetu. Bridging higher education to meaningful careers.
    //      Moving students from passive chatbot answers to measurable readiness and action."
    // =========================================================================
    console.log('🎬 Scene 1: The Hook (Landing Page)');
    await executeSyncedScene(0, '/', async (durMs) => {
      await updateVoiceoverHud(
        page,
        'SCENE 01 • THE HOOK',
        'Landing Page • Universal Student Career Platform',
        'Meet CareerSetu. Bridging higher education to meaningful careers.'
      );
      await focusPulse(page, page.locator('h1').first(), Math.round(durMs * 0.42), false);

      await updateVoiceoverHud(
        page,
        'SCENE 01 • THE HOOK',
        'Core Philosophy • Readiness → Action',
        'Moving students from passive chatbot answers to measurable readiness and action.'
      );
      const philosophyLoc = page
        .locator('p, span, h2')
        .filter({ hasText: /Readiness|Action|Career|Roadmaps/i })
        .first();
      await focusPulse(page, philosophyLoc, Math.round(durMs * 0.30), false);

      const primaryCta = page
        .locator('a, button')
        .filter({ hasText: /Explore|Get Started|Launch|Dashboard/i })
        .first();
      await focusPulse(page, primaryCta, Math.round(durMs * 0.25), false);
    });

    // =========================================================================
    // SCENE 2: RAPID PERSONA ONBOARDING (`/onboarding`)
    // VO: "In seconds, Aarav calibrates his degree, verified Python, SQL, and FastAPI stack,
    //      and locks onto a Data Engineering trajectory."
    // =========================================================================
    console.log('🎬 Scene 2: Rapid Persona Onboarding');
    await executeSyncedScene(1, '/onboarding', async (durMs) => {
      await updateVoiceoverHud(
        page,
        'SCENE 02 • ONBOARDING',
        'Persona Calibration • Academic Profile',
        'In seconds, Aarav calibrates his degree...'
      );
      await typeSynchronizedField(
        page,
        'SCENE 02 • RAPID PERSONA ONBOARDING',
        'Student Name',
        'Aarav Sharma',
        Math.round(durMs * 0.16)
      );
      await typeSynchronizedField(
        page,
        'SCENE 02 • RAPID PERSONA ONBOARDING',
        'Academic Degree',
        'B.Tech Computer Science & Engineering',
        Math.round(durMs * 0.22)
      );

      await updateVoiceoverHud(
        page,
        'SCENE 02 • ONBOARDING',
        'Verified Technical Stack',
        '...verified Python, SQL, and FastAPI stack...'
      );
      await typeSynchronizedField(
        page,
        'SCENE 02 • RAPID PERSONA ONBOARDING',
        'Verified Skills',
        'Python, SQL, FastAPI, Git',
        Math.round(durMs * 0.26)
      );

      await updateVoiceoverHud(
        page,
        'SCENE 02 • ONBOARDING',
        'Target Career Pathway',
        '...and locks onto a Data Engineering trajectory.'
      );
      await typeSynchronizedField(
        page,
        'SCENE 02 • RAPID PERSONA ONBOARDING',
        'Target Career',
        'Data Engineer / Systems Architect',
        Math.round(durMs * 0.22)
      );

      await focusPulse(page, '#cs-onboarding-submit', Math.round(durMs * 0.12), true);
    });

    // =========================================================================
    // SCENE 3: THE 0–100 EXPLAINABLE READINESS ENGINE (`/dashboard`)
    // VO: "Zero black-box mystery. The explainable Readiness Engine scores six weighted
    //      dimensions across technical skills, practical projects, academics, and communication."
    // =========================================================================
    console.log('🎬 Scene 3: 0-100 Explainable Readiness Engine');
    await executeSyncedScene(2, '/dashboard', async (durMs) => {
      await page.evaluate(() => {
        if (document.getElementById('cs-readiness-hud-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'cs-readiness-hud-panel';
        panel.style.cssText = `
          position: fixed; top: 88px; right: 48px; width: 520px;
          background: rgba(10, 17, 40, 0.96); border: 2px solid #06B6D4;
          border-radius: 18px; padding: 24px; z-index: 9998;
          box-shadow: 0 25px 70px rgba(0,0,0,0.85), 0 0 45px rgba(6, 182, 212, 0.3);
          font-family: 'Inter', sans-serif; color: #F8FAFC;
        `;
        panel.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <div>
              <div style="font-size:11px;color:#06B6D4;font-weight:800;letter-spacing:0.12em;">0–100 EXPLAINABLE READINESS ENGINE</div>
              <div style="font-size:21px;font-weight:800;">6-Dimension Weighted Score</div>
            </div>
            <div id="cs-score-gauge" style="font-size:36px;font-weight:900;color:#14B8A6;background:rgba(20,184,166,0.14);padding:8px 18px;border-radius:12px;border:1.5px solid #14B8A6;">
              65<span style="font-size:16px;color:#94A3B8;">/100</span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div id="cs-dim-1" style="background:#0F172A;border:1px solid #334155;padding:11px 14px;border-radius:10px;">
              <div style="font-size:12px;color:#94A3B8;">1. Technical & Domain Skills</div>
              <div style="font-size:16px;font-weight:800;color:#06B6D4;">25% Weight</div>
            </div>
            <div id="cs-dim-2" style="background:#0F172A;border:1px solid #334155;padding:11px 14px;border-radius:10px;">
              <div style="font-size:12px;color:#94A3B8;">2. Practical Projects & Evidence</div>
              <div style="font-size:16px;font-weight:800;color:#14B8A6;">20% Weight</div>
            </div>
            <div id="cs-dim-3" style="background:#0F172A;border:1px solid #334155;padding:11px 14px;border-radius:10px;">
              <div style="font-size:12px;color:#94A3B8;">3. Academic Foundation</div>
              <div style="font-size:16px;font-weight:800;color:#06B6D4;">15% Weight</div>
            </div>
            <div id="cs-dim-4" style="background:#0F172A;border:1px solid #334155;padding:11px 14px;border-radius:10px;">
              <div style="font-size:12px;color:#94A3B8;">4. Resume Quality</div>
              <div style="font-size:16px;font-weight:800;color:#14B8A6;">15% Weight</div>
            </div>
            <div id="cs-dim-5" style="background:#0F172A;border:1px solid #334155;padding:11px 14px;border-radius:10px;">
              <div style="font-size:12px;color:#94A3B8;">5. Interview & Communication</div>
              <div style="font-size:16px;font-weight:800;color:#06B6D4;">15% Weight</div>
            </div>
            <div id="cs-dim-6" style="background:#0F172A;border:1px solid #334155;padding:11px 14px;border-radius:10px;">
              <div style="font-size:12px;color:#94A3B8;">6. Career Alignment</div>
              <div style="font-size:16px;font-weight:800;color:#14B8A6;">10% Weight</div>
            </div>
          </div>
        `;
        document.body.appendChild(panel);
      });

      await updateVoiceoverHud(
        page,
        'SCENE 03 • READINESS ENGINE',
        'Dashboard • 0–100 Explainable Score Gauge',
        'Zero black-box mystery. The explainable Readiness Engine scores six weighted dimensions...'
      );
      await focusPulse(page, '#cs-score-gauge', Math.round(durMs * 0.32), false);

      await updateVoiceoverHud(
        page,
        'SCENE 03 • READINESS ENGINE',
        '6 Weighted Dimensions • Transparent Evaluation',
        '...across technical skills, practical projects, academics, and communication.'
      );
      const eachDimMs = Math.round((durMs * 0.65) / 6);
      for (let i = 1; i <= 6; i++) {
        await focusPulse(page, `#cs-dim-${i}`, eachDimMs, false);
      }
    });

    // =========================================================================
    // SCENE 4: AI CAREER RECOMMENDATIONS & SKILL-GAP ENGINE (`/career`)
    // VO: "High-speed set intersections match Aarav to Data Systems Engineer,
    //      explaining the fit while pinpointing exact deficits like Apache Spark and Docker."
    // =========================================================================
    console.log('🎬 Scene 4: AI Career Recommendations & Skill-Gap Engine');
    await executeSyncedScene(3, '/career', async (durMs) => {
      await page.evaluate(() => {
        if (document.getElementById('cs-career-spotlight-card')) return;
        const card = document.createElement('div');
        card.id = 'cs-career-spotlight-card';
        card.style.cssText = `
          position: fixed; top: 96px; right: 48px; width: 540px;
          background: rgba(15, 23, 42, 0.97); border: 2px solid #06B6D4;
          border-radius: 18px; padding: 26px; z-index: 9998;
          box-shadow: 0 25px 70px rgba(0,0,0,0.85); color: #F8FAFC; font-family: 'Inter', sans-serif;
        `;
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="background:rgba(6,182,212,0.18);color:#06B6D4;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:800;">TOP MATCH • 88% FIT</span>
            <span style="color:#14B8A6;font-size:13px;font-weight:700;">Server-Side Set Intersection</span>
          </div>
          <h3 id="cs-role-title" style="font-size:25px;font-weight:800;margin:12px 0 10px 0;">Data Systems Engineer</h3>
          <div id="cs-role-rationale" style="background:#0A1128;border-left:3px solid #14B8A6;padding:12px 14px;border-radius:6px;font-size:13.5px;color:#CBD5E1;margin-bottom:16px;">
            <strong style="color:#F8FAFC;">Why am I seeing this?</strong> Direct overlap with your verified Python, SQL, and FastAPI stack.
          </div>
          <div id="cs-deficit-badges" style="background:rgba(244,63,94,0.12);border:1.5px solid rgba(244,63,94,0.5);padding:12px 16px;border-radius:10px;">
            <div style="font-size:11px;font-weight:800;color:#FB7185;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">
              Exact Skill Deficits Pinpointed
            </div>
            <div style="font-size:15px;font-weight:800;color:#F8FAFC;">
              Missing: Apache Spark • Docker • Cloud Warehouses
            </div>
          </div>
        `;
        document.body.appendChild(card);
      });

      await updateVoiceoverHud(
        page,
        'SCENE 04 • SKILL-GAP ENGINE',
        'Role Matching • Data Systems Engineer (88% Fit)',
        'High-speed set intersections match Aarav to Data Systems Engineer...'
      );
      await focusPulse(page, '#cs-role-title', Math.round(durMs * 0.36), false);

      await updateVoiceoverHud(
        page,
        'SCENE 04 • SKILL-GAP ENGINE',
        'Transparent Match Rationale',
        '...explaining the fit while pinpointing exact deficits like Apache Spark and Docker.'
      );
      await focusPulse(page, '#cs-role-rationale', Math.round(durMs * 0.28), false);
      await focusPulse(page, '#cs-deficit-badges', Math.round(durMs * 0.34), false);
    });

    // =========================================================================
    // SCENE 5: 90-DAY EXECUTION ROADMAP (`/roadmap`)
    // VO: "Missing skills become a ninety-day execution roadmap across three phases.
    //      Completing a weekly lab recalibrates his readiness score in real time."
    // =========================================================================
    console.log('🎬 Scene 5: 90-Day Execution Roadmap');
    await executeSyncedScene(4, '/roadmap', async (durMs) => {
      await page.evaluate(() => {
        if (document.getElementById('cs-roadmap-hud')) return;
        const modal = document.createElement('div');
        modal.id = 'cs-roadmap-hud';
        modal.style.cssText = `
          position: fixed; top: 96px; right: 48px; width: 580px;
          background: rgba(10, 17, 40, 0.97); border: 2px solid #14B8A6;
          border-radius: 18px; padding: 24px; z-index: 9998;
          box-shadow: 0 25px 70px rgba(0,0,0,0.85); color: #F8FAFC; font-family: 'Inter', sans-serif;
        `;
        modal.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <div style="display:flex;gap:8px;">
              <span id="cs-phase-1" style="background:#06B6D4;color:#0A1128;padding:5px 11px;border-radius:6px;font-size:11.5px;font-weight:800;">Phase 1: Foundations</span>
              <span id="cs-phase-2" style="background:#1E293B;color:#CBD5E1;padding:5px 11px;border-radius:6px;font-size:11.5px;font-weight:700;">Phase 2: Capstone</span>
              <span id="cs-phase-3" style="background:#1E293B;color:#CBD5E1;padding:5px 11px;border-radius:6px;font-size:11.5px;font-weight:700;">Phase 3: Interview Sprints</span>
            </div>
            <div id="cs-live-score-pill" style="font-size:15px;font-weight:900;color:#06B6D4;background:rgba(6,182,212,0.12);padding:6px 12px;border-radius:8px;">
              Score: 65/100
            </div>
          </div>
          <div id="cs-milestone-task" style="background:#0F172A;border:1.5px solid #06B6D4;padding:14px 16px;border-radius:12px;display:flex;align-items:center;gap:14px;cursor:pointer;">
            <div id="cs-task-check" style="width:24px;height:24px;border-radius:6px;border:2px solid #06B6D4;display:flex;align-items:center;justify-content:center;font-weight:900;color:#0A1128;"></div>
            <div>
              <div style="font-size:14.5px;font-weight:700;color:#F8FAFC;">Complete SQL Window Functions & Partitioning Lab</div>
              <div style="font-size:12px;color:#94A3B8;">Week 2 Milestone • Verifiable Repository Deliverable</div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      });

      await updateVoiceoverHud(
        page,
        'SCENE 05 • 90-DAY ROADMAP',
        '3 Structured Phases • Weeks 1–12',
        'Missing skills become a ninety-day execution roadmap across three phases.'
      );
      const phaseHold = Math.round((durMs * 0.46) / 3);
      await focusPulse(page, '#cs-phase-1', phaseHold, false);
      await focusPulse(page, '#cs-phase-2', phaseHold, false);
      await focusPulse(page, '#cs-phase-3', phaseHold, false);

      await updateVoiceoverHud(
        page,
        'SCENE 05 • 90-DAY ROADMAP',
        'Live Readiness Score Recalibration',
        'Completing a weekly lab recalibrates his readiness score in real time.'
      );
      await focusPulse(page, '#cs-milestone-task', Math.round(durMs * 0.25), true);
      await page.evaluate(() => {
        const chk = document.getElementById('cs-task-check');
        const pill = document.getElementById('cs-live-score-pill');
        if (chk) {
          chk.style.background = '#14B8A6';
          chk.textContent = '✓';
        }
        if (pill) {
          pill.style.color = '#14B8A6';
          pill.style.border = '1px solid #14B8A6';
          pill.textContent = 'Readiness Resynced: 65 → 69/100 ▲';
        }
      });
      await focusPulse(page, '#cs-live-score-pill', Math.round(durMs * 0.26), false);
    });

    // =========================================================================
    // SCENE 6: CURATED OPPORTUNITY MATCHING (`/opportunities`)
    // VO: "Curated opportunity matching connects verified skills directly to industry
    //      internships and new-grad engineering roles with transparent qualification criteria."
    // =========================================================================
    console.log('🎬 Scene 6: Curated Opportunity Matching');
    await executeSyncedScene(5, '/opportunities', async (durMs) => {
      await page.evaluate(() => {
        if (document.getElementById('cs-opp-spotlight-card')) return;
        const card = document.createElement('div');
        card.id = 'cs-opp-spotlight-card';
        card.style.cssText = `
          position: fixed; top: 96px; right: 48px; width: 550px;
          background: rgba(15, 23, 42, 0.97); border: 2px solid #06B6D4;
          border-radius: 18px; padding: 24px; z-index: 9998;
          box-shadow: 0 25px 70px rgba(0,0,0,0.85); color: #F8FAFC; font-family: 'Inter', sans-serif;
        `;
        card.innerHTML = `
          <div id="cs-opp-filters" style="display:flex;gap:8px;margin-bottom:14px;">
            <span style="background:#06B6D4;color:#0A1128;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;">Domain: Data Engineering</span>
            <span style="background:rgba(20,184,166,0.18);color:#14B8A6;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;">Internships & New-Grad</span>
          </div>
          <h3 id="cs-opp-role" style="font-size:22px;font-weight:800;margin:0 0 8px 0;">Data Systems Engineering Intern</h3>
          <div style="font-size:13px;color:#94A3B8;margin-bottom:14px;">CloudScale Systems • Remote / Hybrid • Stipend Verified</div>
          <div id="cs-opp-criteria" style="background:#0A1128;border:1px solid #14B8A6;padding:12px 14px;border-radius:10px;">
            <div style="font-size:11px;color:#14B8A6;font-weight:800;text-transform:uppercase;margin-bottom:6px;">
              Transparent Qualification & Skill-Overlap Match (92%)
            </div>
            <div style="font-size:13.5px;color:#F8FAFC;font-weight:600;">
              ✓ Python &nbsp; ✓ SQL Windowing &nbsp; ✓ FastAPI &nbsp; ✓ B.Tech CSE Eligible
            </div>
          </div>
        `;
        document.body.appendChild(card);
      });

      await updateVoiceoverHud(
        page,
        'SCENE 06 • OPPORTUNITY MATCHING',
        'Domain & Internship Filtering',
        'Curated opportunity matching connects verified skills directly to industry internships...'
      );
      await focusPulse(page, '#cs-opp-filters', Math.round(durMs * 0.44), false);

      await updateVoiceoverHud(
        page,
        'SCENE 06 • OPPORTUNITY MATCHING',
        'Transparent Qualification Criteria',
        '...and new-grad engineering roles with transparent qualification criteria.'
      );
      await focusPulse(page, '#cs-opp-criteria', Math.round(durMs * 0.52), false);
    });

    // =========================================================================
    // SCENE 7: EVIDENCE-GROUNDED RESUME COPILOT (`/resume`)
    // VO: "The Evidence-Grounded Resume Copilot transforms weak bullets into metric-driven
    //      impact statements, strictly anchored to real achievements with zero hallucinated claims."
    // =========================================================================
    console.log('🎬 Scene 7: Evidence-Grounded Resume Copilot');
    await executeSyncedScene(6, '/resume', async (durMs) => {
      await page.evaluate(() => {
        if (document.getElementById('cs-resume-diff-hud')) return;
        const diff = document.createElement('div');
        diff.id = 'cs-resume-diff-hud';
        diff.style.cssText = `
          position: fixed; top: 96px; right: 48px; width: 590px;
          background: rgba(15, 23, 42, 0.97); border: 2px solid #06B6D4;
          border-radius: 18px; padding: 24px; z-index: 9998;
          box-shadow: 0 25px 75px rgba(0,0,0,0.85); color: #F8FAFC; font-family: 'Inter', sans-serif;
        `;
        diff.innerHTML = `
          <div style="font-size:11px;font-weight:800;color:#06B6D4;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">
            ATS Resume Copilot • Google / Harvard XYZ Formula
          </div>
          <div id="cs-bullet-before" style="background:rgba(244,63,94,0.12);border-left:3px solid #F43F5E;padding:12px 14px;border-radius:8px;margin-bottom:12px;font-size:13.5px;color:#FDA4AF;">
            <strong>Weak Bullet (Before):</strong> Worked on backend API queries and database tables for student portal.
          </div>
          <div id="cs-bullet-after" style="background:rgba(20,184,166,0.14);border-left:3px solid #14B8A6;padding:12px 14px;border-radius:8px;font-size:13.5px;color:#F8FAFC;">
            <strong style="color:#14B8A6;">Metric-Driven Impact (After):</strong> Accomplished <strong>42% faster API response times</strong> [X], as measured by <strong>p95 FastAPI telemetry</strong> [Y], by <strong>refactoring SQL indexing and query batching</strong> [Z].
            <div style="margin-top:8px;font-size:11.5px;color:#06B6D4;font-weight:800;">✓ 100% Grounded in Parsed Resume Facts • Zero Hallucinated Claims</div>
          </div>
        `;
        document.body.appendChild(diff);
      });

      await updateVoiceoverHud(
        page,
        'SCENE 07 • RESUME COPILOT',
        'ATS Scan & Weak Bullet Detection',
        'The Evidence-Grounded Resume Copilot transforms weak bullets into metric-driven impact statements...'
      );
      await focusPulse(page, '#cs-bullet-before', Math.round(durMs * 0.45), false);

      await updateVoiceoverHud(
        page,
        'SCENE 07 • RESUME COPILOT',
        'Google/Harvard XYZ Transformation • Zero Hallucinations',
        '...strictly anchored to real achievements with zero hallucinated claims.'
      );
      await focusPulse(page, '#cs-bullet-after', Math.round(durMs * 0.52), false);
    });

    // =========================================================================
    // SCENE 8: ROLE-SPECIFIC AI MOCK INTERVIEW (`/interview`)
    // VO: "Adaptive multi-turn AI mock interviews test system depth and SQL optimization,
    //      delivering instant STAR rubric scorecards for accuracy and clarity."
    // =========================================================================
    console.log('🎬 Scene 8: Role-Specific AI Mock Interview');
    await executeSyncedScene(7, '/interview', async (durMs) => {
      await updateVoiceoverHud(
        page,
        'SCENE 08 • AI MOCK INTERVIEW',
        'Junior Data Engineer • Technical SQL Simulation',
        'Adaptive multi-turn AI mock interviews test system depth and SQL optimization...'
      );
      await typeSynchronizedField(
        page,
        'SCENE 08 • ROLE-SPECIFIC AI MOCK INTERVIEW',
        'Candidate Technical Response',
        'I optimized PostgreSQL partition keys and composite indexes, cutting query latency by 45%.',
        Math.round(durMs * 0.48)
      );

      await page.evaluate(() => {
        if (document.getElementById('cs-star-scorecard')) return;
        const card = document.createElement('div');
        card.id = 'cs-star-scorecard';
        card.style.cssText = `
          position: fixed; top: 96px; right: 48px; width: 490px;
          background: rgba(10, 17, 40, 0.97); border: 2px solid #14B8A6;
          border-radius: 18px; padding: 22px; z-index: 99999;
          box-shadow: 0 25px 70px rgba(0,0,0,0.88); color: #F8FAFC; font-family: 'Inter', sans-serif;
        `;
        card.innerHTML = `
          <div style="font-size:11px;font-weight:800;color:#14B8A6;letter-spacing:0.12em;text-transform:uppercase;">
            INSTANT STAR RUBRIC SCORECARD
          </div>
          <h4 style="font-size:19px;font-weight:800;margin:6px 0 14px 0;">Junior Data Engineer • Evaluation</h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            <div style="background:#0F172A;padding:12px;border-radius:10px;text-align:center;border:1.5px solid #06B6D4;">
              <div style="font-size:11px;color:#94A3B8;">Tech Accuracy</div>
              <div style="font-size:22px;font-weight:900;color:#06B6D4;">9.2/10</div>
            </div>
            <div style="background:#0F172A;padding:12px;border-radius:10px;text-align:center;border:1.5px solid #14B8A6;">
              <div style="font-size:11px;color:#94A3B8;">STAR Clarity</div>
              <div style="font-size:22px;font-weight:900;color:#14B8A6;">8.8/10</div>
            </div>
            <div style="background:#0F172A;padding:12px;border-radius:10px;text-align:center;border:1.5px solid #06B6D4;">
              <div style="font-size:11px;color:#94A3B8;">System Depth</div>
              <div style="font-size:22px;font-weight:900;color:#06B6D4;">9.0/10</div>
            </div>
          </div>
        `;
        document.body.appendChild(card);
      });

      await updateVoiceoverHud(
        page,
        'SCENE 08 • AI MOCK INTERVIEW',
        'Post-Turn STAR Evaluation',
        '...delivering instant STAR rubric scorecards for accuracy and clarity.'
      );
      await focusPulse(page, '#cs-star-scorecard', Math.round(durMs * 0.49), false);
    });

    // =========================================================================
    // SCENE 9: INSTITUTIONAL ANALYTICS & OUTRO (`/admin`)
    // VO: "With cohort-wide analytics for universities and placement teams,
    //      CareerSetu turns student aspiration into actionable readiness."
    // =========================================================================
    console.log('🎬 Scene 9: Institutional Analytics & Commercial Outro');
    await executeSyncedScene(8, '/admin', async (durMs) => {
      await updateVoiceoverHud(
        page,
        'SCENE 09 • COHORT ANALYTICS',
        'Institutional Readiness & Skill-Deficit Heatmaps',
        'With cohort-wide analytics for universities and placement teams...'
      );
      await smoothScrollDown(page, 280, Math.round(durMs * 0.42));

      await updateVoiceoverHud(
        page,
        'SCENE 09 • COMMERCIAL OUTRO',
        'github.com/SKYWALKERSID/Career-Setu',
        '...CareerSetu turns student aspiration into actionable readiness.'
      );

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

      await focusPulse(page, '#cs-outro-repo', Math.round(durMs * 0.55), false);
      await expect(page.locator('#cs-outro-repo')).toBeVisible();
    });

    // Save exact video scene slice markers for FFmpeg frame-accurate assembly
    fs.writeFileSync(markersPath, JSON.stringify({ scenes: sceneMarkers }, null, 2), 'utf-8');
    console.log(`✅ Exported 9 frame-accurate video scene markers to ${markersPath}`);
  });
});
