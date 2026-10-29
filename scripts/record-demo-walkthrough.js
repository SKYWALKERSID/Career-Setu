const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function smoothScroll(page, distance, durationMs = 1200) {
  await page.evaluate(
    async ({ distance, durationMs }) => {
      const start = window.scrollY;
      const startTime = performance.now();
      return new Promise((resolve) => {
        function step(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / durationMs, 1);
          // Ease in-out cubic
          const ease =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          window.scrollTo(0, start + distance * ease);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(step);
      });
    },
    { distance, durationMs }
  );
}

// Injects a visible glowing cursor and click indicator on each page
async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(6, 182, 212, 0.7);
      border: 2px solid #FFFFFF;
      box-shadow: 0 0 12px rgba(6, 182, 212, 0.9);
      pointer-events: none;
      z-index: 999999;
      transform: translate(-50%, -50%);
      transition: transform 0.08s ease-out, background 0.15s;
    `;
    document.body.appendChild(cursor);

    window.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });

    window.addEventListener('mousedown', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';
      cursor.style.background = 'rgba(20, 184, 166, 0.9)';
    });

    window.addEventListener('mouseup', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      cursor.style.background = 'rgba(6, 182, 212, 0.7)';
    });
  });
}

async function moveMouseSmoothly(page, targetX, targetY, steps = 15) {
  await page.mouse.move(targetX, targetY, { steps });
}

async function runWalkthrough() {
  const videoDir = path.resolve(__dirname, '..', 'demo-videos');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  // Clear previous recordings
  const existingFiles = fs.readdirSync(videoDir);
  for (const f of existingFiles) {
    if (f.endsWith('.webm')) {
      try {
        fs.unlinkSync(path.join(videoDir, f));
      } catch (_) {}
    }
  }

  console.log('🎬 Initializing browser for Full HD Walkthrough Recording...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const authState = path.resolve(__dirname, '..', 'playwright', '.auth', 'qa-student.json');
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    storageState: fs.existsSync(authState) ? authState : undefined,
    recordVideo: {
      dir: videoDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  const baseUrl = 'https://career-setu-hslc.vercel.app';

  console.log('▶ Scene 1: Landing Page Hero & Core Value Proposition');
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await injectCursor(page);
  await moveMouseSmoothly(page, 500, 350);
  await page.waitForTimeout(2500);

  // Smooth scroll down to explore features and metrics
  console.log('  - Scrolling through platform capabilities & catalog statistics');
  await smoothScroll(page, 600, 1500);
  await moveMouseSmoothly(page, 700, 450);
  await page.waitForTimeout(2000);

  await smoothScroll(page, 700, 1500);
  await moveMouseSmoothly(page, 900, 500);
  await page.waitForTimeout(2000);

  // Scroll back to top
  console.log('  - Returning to navigation bar');
  await smoothScroll(page, -1300, 1500);
  await page.waitForTimeout(1000);

  console.log('▶ Scene 2: Student Cockpit & Dashboard');
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
  await injectCursor(page);
  await moveMouseSmoothly(page, 450, 250);
  await page.waitForTimeout(2500);

  // Hover over readiness score and recommendations
  console.log('  - Reviewing Career Readiness Score & radar dimensions');
  await smoothScroll(page, 350, 1200);
  await moveMouseSmoothly(page, 750, 400);
  await page.waitForTimeout(2500);

  await smoothScroll(page, 450, 1200);
  await moveMouseSmoothly(page, 850, 480);
  await page.waitForTimeout(2000);

  await smoothScroll(page, -800, 1200);
  await page.waitForTimeout(1000);

  console.log('▶ Scene 3: Career Trajectories & Skill-Gap Analysis');
  await page.goto(`${baseUrl}/career`, { waitUntil: 'networkidle' });
  await injectCursor(page);
  await moveMouseSmoothly(page, 550, 300);
  await page.waitForTimeout(2500);

  await smoothScroll(page, 400, 1200);
  await moveMouseSmoothly(page, 700, 520);
  await page.waitForTimeout(2500);

  await smoothScroll(page, -400, 1000);
  await page.waitForTimeout(1000);

  console.log('▶ Scene 4: Interactive 90-Day Roadmap');
  await page.goto(`${baseUrl}/roadmap`, { waitUntil: 'networkidle' });
  await injectCursor(page);
  await moveMouseSmoothly(page, 600, 280);
  await page.waitForTimeout(2500);

  // Scroll through weekly milestones
  console.log('  - Inspecting Phase 1 & Phase 2 weekly milestones');
  await smoothScroll(page, 500, 1400);
  await moveMouseSmoothly(page, 650, 450);
  await page.waitForTimeout(2500);

  await smoothScroll(page, 500, 1400);
  await moveMouseSmoothly(page, 800, 480);
  await page.waitForTimeout(2500);

  await smoothScroll(page, -1000, 1200);
  await page.waitForTimeout(1000);

  console.log('▶ Scene 5: Opportunities & Public Initiatives Matching');
  await page.goto(`${baseUrl}/opportunities`, { waitUntil: 'networkidle' });
  await injectCursor(page);
  await moveMouseSmoothly(page, 450, 250);
  await page.waitForTimeout(2500);

  await smoothScroll(page, 450, 1200);
  await moveMouseSmoothly(page, 750, 450);
  await page.waitForTimeout(2500);

  await smoothScroll(page, -450, 1000);
  await page.waitForTimeout(1000);

  console.log('▶ Scene 6: Evidence-Grounded Resume Copilot');
  await page.goto(`${baseUrl}/resume`, { waitUntil: 'networkidle' });
  await injectCursor(page);
  await moveMouseSmoothly(page, 500, 320);
  await page.waitForTimeout(2500);

  await smoothScroll(page, 400, 1200);
  await moveMouseSmoothly(page, 700, 420);
  await page.waitForTimeout(2500);

  await smoothScroll(page, -400, 1000);
  await page.waitForTimeout(1000);

  console.log('▶ Scene 7: Role-Specific AI Mock Interview');
  await page.goto(`${baseUrl}/interview`, { waitUntil: 'networkidle' });
  await injectCursor(page);
  await moveMouseSmoothly(page, 550, 300);
  await page.waitForTimeout(2500);

  await smoothScroll(page, 350, 1200);
  await moveMouseSmoothly(page, 650, 420);
  await page.waitForTimeout(2500);

  await smoothScroll(page, -350, 1000);
  await page.waitForTimeout(1000);

  console.log('▶ Scene 8: Master Presentation Deck');
  const presentationPath = path.resolve(__dirname, '..', 'docs', 'presentation-deck.html');
  await page.goto('file:///' + presentationPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Step through key slides
  console.log('  - Presenting Hero & Problem slides');
  await page.keyboard.press('ArrowRight'); // Slide 2
  await page.waitForTimeout(2000);
  await page.keyboard.press('ArrowRight'); // Slide 3
  await page.waitForTimeout(2000);
  await page.keyboard.press('ArrowRight'); // Slide 4
  await page.waitForTimeout(2000);
  await page.keyboard.press('ArrowRight'); // Slide 5
  await page.waitForTimeout(2000);
  await page.keyboard.press('ArrowRight'); // Slide 6
  await page.waitForTimeout(2500);

  console.log('  - Concluding on Executive Summary Slide');
  for (let i = 7; i <= 18; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(3000);

  console.log('🏁 Closing session and encoding final walkthrough video...');
  await context.close();
  await browser.close();

  // Find generated webm and rename to clean output name
  const recordedFiles = fs.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
  if (recordedFiles.length > 0) {
    const rawFile = path.join(videoDir, recordedFiles[0]);
    const finalFile = path.join(videoDir, 'CareerSetu_Demo_Walkthrough.webm');
    if (rawFile !== finalFile) {
      if (fs.existsSync(finalFile)) fs.unlinkSync(finalFile);
      fs.renameSync(rawFile, finalFile);
    }
    const stat = fs.statSync(finalFile);
    console.log(`\n🎉 Success! Walkthrough video saved:`);
    console.log(`📁 ${finalFile} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  }
}

runWalkthrough().catch((err) => {
  console.error('Walkthrough recording error:', err);
  process.exit(1);
});

