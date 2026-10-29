#!/usr/bin/env node
/**
 * CareerSetu — Master Commercial Video Compositor & FFmpeg Grading Pipeline
 * 1. Locates the latest Playwright 1080p `.webm` recording
 * 2. Concatenates 9 scene voiceover stems & mixes procedural sub-bass / whoosh SFX
 * 3. Applies Apple/Stripe/Linear tech-commercial color grade (`eq=contrast=1.12:saturation=1.22,unsharp=5:5:0.6`)
 * 4. Renders final 1080p 60fps H.264 / AAC deliverable (`careersetu-cinematic-ad.mp4`)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT_DIR = process.cwd();
const ASSETS_DIR = path.join(ROOT_DIR, 'demo-assets');
const MANIFEST_PATH = path.join(ASSETS_DIR, 'audio-manifest.json');
const OUTPUT_MP4 = path.join(ROOT_DIR, 'careersetu-cinematic-ad.mp4');

function getFfmpegBin() {
  try {
    const staticBin = require('ffmpeg-static');
    if (staticBin && fs.existsSync(staticBin)) return staticBin;
  } catch {
    // fallback to system PATH
  }
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const res = spawnSync(checkCmd, ['ffmpeg'], { stdio: 'ignore' });
  if (res.status === 0) return 'ffmpeg';
  throw new Error(
    'FFmpeg binary not found on system PATH or ffmpeg-static. Please install FFmpeg to mux careersetu-cinematic-ad.mp4.'
  );
}

const FFMPEG_BIN = getFfmpegBin();

/**
 * Recursively searches candidate folders for the newest `.webm` video recording
 */
function findLatestWebmRecording() {
  const searchDirs = [
    path.join(ROOT_DIR, 'test-results'),
    path.join(ROOT_DIR, 'demo-videos'),
    path.join(ROOT_DIR, 'playwright-report'),
  ];

  const foundFiles = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.webm')) {
        const stats = fs.statSync(fullPath);
        if (stats.size > 1024) {
          foundFiles.push({ fullPath, mtimeMs: stats.mtimeMs, size: stats.size });
        }
      }
    }
  }

  searchDirs.forEach(walk);

  if (foundFiles.length === 0) {
    throw new Error(
      'No .webm recording found in test-results/ or demo-videos/. Run `npx playwright test tests/e2e/cinematic-walkthrough.spec.ts` first.'
    );
  }

  foundFiles.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return foundFiles[0].fullPath;
}

/**
 * Concatenates all 9 scene voiceovers and mixes with procedural SFX + synth pad bed
 */
function buildMasterAudioTrack(manifest) {
  const concatListPath = path.join(ASSETS_DIR, 'vo-concat-list.txt');
  const concatVoWav = path.join(ASSETS_DIR, 'vo-master-track.wav');
  const finalMixedAudio = path.join(ASSETS_DIR, 'commercial-master-mix.wav');

  // Write FFmpeg concat demuxer file list
  const concatLines = manifest.scenes.map((scene) => {
    const safePath = scene.wavPath.replace(/\\/g, '/').replace(/'/g, "'\\''");
    return `file '${safePath}'`;
  });
  fs.writeFileSync(concatListPath, concatLines.join('\n'), 'utf-8');

  console.log('🔗 Concatenating 9 voiceover stems...');
  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
      '-c:a',
      'pcm_s16le',
      concatVoWav,
    ],
    { stdio: 'ignore' }
  );

  const { subBassPath, whooshPath, ambientBedPath } = manifest.sfx || {};
  const hasSfx =
    subBassPath &&
    whooshPath &&
    ambientBedPath &&
    fs.existsSync(subBassPath) &&
    fs.existsSync(whooshPath) &&
    fs.existsSync(ambientBedPath);

  if (!hasSfx) {
    fs.copyFileSync(concatVoWav, finalMixedAudio);
    return finalMixedAudio;
  }

  console.log('🎚️  Mixing voiceover stems with procedural Sub-Bass Drops, Whooshes & Synth Bed...');
  // Place sub-bass drop at 0s & 64s (outro), whoosh risers at scene transitions (8s, 24s, 40s, 56s)
  const filterComplex = [
    '[0:a]volume=1.15[vo]',
    '[1:a]volume=0.85[bed]',
    '[2:a]adelay=100|100,volume=0.55[bass1]',
    '[3:a]adelay=8000|8000,volume=0.40[whoosh1]',
    '[3:a]adelay=24000|24000,volume=0.40[whoosh2]',
    '[3:a]adelay=40000|40000,volume=0.40[whoosh3]',
    '[2:a]adelay=63000|63000,volume=0.60[bassOutro]',
    '[vo][bed][bass1][whoosh1][whoosh2][whoosh3][bassOutro]amix=inputs=7:duration=first:dropout_transition=2,dynaudnorm=f=150:g=15[aout]',
  ].join(';');

  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-i',
      concatVoWav,
      '-i',
      ambientBedPath,
      '-i',
      subBassPath,
      '-i',
      whooshPath,
      '-filter_complex',
      filterComplex,
      '-map',
      '[aout]',
      '-c:a',
      'pcm_s16le',
      finalMixedAudio,
    ],
    { stdio: 'ignore' }
  );

  return finalMixedAudio;
}

function main() {
  console.log('==============================================================');
  console.log('🎞️  CareerSetu — 1080p 60fps Commercial Render Pipeline');
  console.log('==============================================================');

  // Auto-generate audio assets if manifest does not exist yet
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.log('ℹ️  Audio manifest not found; invoking scripts/generate-assets.js...');
    execFileSync(process.execPath, [path.join(ROOT_DIR, 'scripts/generate-assets.js')], {
      stdio: 'inherit',
    });
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const latestWebm = findLatestWebmRecording();
  console.log(`📹 Source Video Located: ${latestWebm}`);

  const masterAudioWav = buildMasterAudioTrack(manifest);
  console.log(`🎧 Master Audio Mix Ready: ${masterAudioWav}`);

  // Build Video Filtergraph:
  // - 1920x1080 Lanczos scaling & square pixel aspect ratio
  // - 60fps smooth frame rate target
  // - Tech-commercial color grade: eq=contrast=1.12:saturation=1.22
  // - Crisp edge sharpening: unsharp=5:5:0.6
  const videoFilter = [
    'scale=1920:1080:flags=lanczos',
    'setsar=1',
    'fps=60',
    'eq=contrast=1.12:saturation=1.22:brightness=0.01',
    'unsharp=5:5:0.6:5:5:0.0',
    'format=yuv420p',
  ].join(',');

  console.log('🚀 Encoding final H.264 / AAC 1080p 60fps commercial (`careersetu-cinematic-ad.mp4`)...');

  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-i',
      latestWebm,
      '-i',
      masterAudioWav,
      '-vf',
      videoFilter,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '18',
      '-profile:v',
      'high',
      '-level',
      '4.2',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-movflags',
      '+faststart',
      '-shortest',
      OUTPUT_MP4,
    ],
    { stdio: 'inherit' }
  );

  const stats = fs.statSync(OUTPUT_MP4);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('==============================================================');
  console.log(`🎉 Commercial Render Complete!`);
  console.log(`📦 Output File: ${OUTPUT_MP4} (${sizeMb} MB)`);
  console.log('==============================================================');
}

main();

