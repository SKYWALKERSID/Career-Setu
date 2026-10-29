#!/usr/bin/env node
/**
 * CareerSetu — Commercial Voiceover & Procedural SFX Asset Generator
 * Synthesizes 9 synchronized voiceover stems + sub-bass drops + whoosh risers
 * Supports macOS (`say`), Linux (`espeak`), Windows SAPI (`PowerShell`), and FFmpeg `lavfi` fallback.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ASSETS_DIR = path.resolve(process.cwd(), 'demo-assets');
const VO_DIR = path.join(ASSETS_DIR, 'voiceovers');
const SFX_DIR = path.join(ASSETS_DIR, 'sfx');

// Ensure output directories exist
[ASSETS_DIR, VO_DIR, SFX_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * 9 Universal Student Career Commercial Voiceover Scenes
 * Zero government or state-specific references — tailored for college students & industry pathways.
 */
const SCENE_SCRIPTS = [
  {
    id: 'scene-01-hook',
    durationSec: 8,
    text: 'Meet CareerSetu. Bridging higher education to meaningful industry careers. Moving students from passive chatbot answers to measurable readiness and action.',
  },
  {
    id: 'scene-02-onboarding',
    durationSec: 8,
    text: 'In seconds, Aarav calibrates his academic profile, verified technical stack in Python, SQL, and FastAPI, and locks onto a Data Engineering trajectory.',
  },
  {
    id: 'scene-03-readiness',
    durationSec: 8,
    text: 'No black-box mystery. The explainable zero-to-one-hundred Readiness Engine weighs six transparent dimensions across technical skills, projects, academics, and communication.',
  },
  {
    id: 'scene-04-skillgap',
    durationSec: 8,
    text: 'High-speed set intersections match Aarav to Data Systems Engineer, explaining why he fits while pinpointing exact skill deficits like Apache Spark and Docker.',
  },
  {
    id: 'scene-05-roadmap',
    durationSec: 8,
    text: 'Every missing skill becomes a ninety-day execution plan across three structured phases. Completing a weekly lab dynamically recalibrates his readiness score in real time.',
  },
  {
    id: 'scene-06-opportunities',
    durationSec: 7,
    text: 'Curated opportunity matching connects verified competencies directly to industry internships and new-grad engineering roles with transparent eligibility criteria.',
  },
  {
    id: 'scene-07-resume',
    durationSec: 8,
    text: 'The Evidence-Grounded Resume Copilot transforms weak descriptions into metric-driven impact bullets, strictly anchored to real achievements with zero hallucinated claims.',
  },
  {
    id: 'scene-08-interview',
    durationSec: 8,
    text: 'Adaptive multi-turn AI mock interviews test system depth and SQL optimization, delivering instant STAR rubric scorecards for accuracy and clarity.',
  },
  {
    id: 'scene-09-outro',
    durationSec: 8,
    text: 'With cohort-wide analytics for universities and placement teams, CareerSetu turns student aspiration into actionable readiness.',
  },
];

function getFfmpegBin() {
  try {
    const staticBin = require('ffmpeg-static');
    if (staticBin && fs.existsSync(staticBin)) return staticBin;
  } catch {
    // fallback to system PATH
  }
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(checkCmd, ['ffmpeg'], { stdio: 'ignore' });
  return result.status === 0 ? 'ffmpeg' : null;
}

const FFMPEG_BIN = getFfmpegBin();

function commandExists(cmd) {
  if (cmd === 'ffmpeg') return Boolean(FFMPEG_BIN);
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(checkCmd, [cmd], { stdio: 'ignore' });
  return result.status === 0;
}

/**
 * Normalizes any generated audio file to 48kHz stereo WAV with a 0.45s natural pause tail
 * so zero words are ever truncated.
 */
function normalizeWavWithFfmpeg(inputPath, outputPath, durationSec) {
  if (!FFMPEG_BIN) {
    if (inputPath !== outputPath) {
      fs.copyFileSync(inputPath, outputPath);
    }
    return;
  }

  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-i',
      inputPath,
      '-af',
      `apad=pad_dur=0.45,aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo`,
      '-c:a',
      'pcm_s16le',
      outputPath,
    ],
    { stdio: 'ignore' }
  );
}

/**
 * Generates a single voiceover stem using platform TTS or FFmpeg harmonic synth fallback
 */
function synthesizeVoiceover(scene) {
  const rawWav = path.join(VO_DIR, `${scene.id}-raw.wav`);
  const finalWav = path.join(VO_DIR, `${scene.id}.wav`);
  const aiffTemp = path.join(VO_DIR, `${scene.id}.aiff`);

  console.log(`🎙️  Synthesizing VO [${scene.id}] (${scene.durationSec}s)...`);

  let synthesized = false;

  // 1. macOS `say`
  if (process.platform === 'darwin' && commandExists('say')) {
    try {
      execFileSync('say', ['-v', 'Samantha', '-r', '185', '-o', aiffTemp, scene.text], {
        stdio: 'ignore',
      });
      normalizeWavWithFfmpeg(aiffTemp, finalWav, scene.durationSec);
      if (fs.existsSync(aiffTemp)) fs.unlinkSync(aiffTemp);
      synthesized = true;
    } catch {
      synthesized = false;
    }
  }

  // 2. Linux `espeak` / `espeak-ng`
  if (!synthesized && (commandExists('espeak-ng') || commandExists('espeak'))) {
    const ttsBin = commandExists('espeak-ng') ? 'espeak-ng' : 'espeak';
    try {
      execFileSync(ttsBin, ['-s', '175', '-v', 'en-us', '-w', rawWav, scene.text], {
        stdio: 'ignore',
      });
      normalizeWavWithFfmpeg(rawWav, finalWav, scene.durationSec);
      if (fs.existsSync(rawWav)) fs.unlinkSync(rawWav);
      synthesized = true;
    } catch {
      synthesized = false;
    }
  }

  // 3. Windows PowerShell System.Speech.Synthesis
  if (!synthesized && process.platform === 'win32') {
    try {
      const escapedText = scene.text.replace(/'/g, "''");
      const escapedOut = rawWav.replace(/'/g, "''");
      const psScript = `
        Add-Type -AssemblyName System.Speech;
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $synth.Rate = 2;
        $synth.Volume = 100;
        $synth.SetOutputToWaveFile('${escapedOut}');
        $synth.Speak('${escapedText}');
        $synth.Dispose();
      `;
      execFileSync('powershell', ['-NoProfile', '-Command', psScript], { stdio: 'ignore' });
      if (fs.existsSync(rawWav)) {
        normalizeWavWithFfmpeg(rawWav, finalWav, scene.durationSec);
        if (fs.existsSync(rawWav)) fs.unlinkSync(rawWav);
        synthesized = true;
      }
    } catch {
      synthesized = false;
    }
  }

  // 4. Universal FFmpeg Lavfi Harmonic Ambient Pulse Fallback
  if (!synthesized && FFMPEG_BIN) {
    execFileSync(
      FFMPEG_BIN,
      [
        '-y',
        '-f',
        'lavfi',
        '-i',
        `sine=frequency=220:sample_rate=48000:duration=${scene.durationSec}`,
        '-af',
        `volume=0.12,afade=t=in:st=0:d=0.4,afade=t=out:st=${scene.durationSec - 0.6}:d=0.6,aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo`,
        '-c:a',
        'pcm_s16le',
        finalWav,
      ],
      { stdio: 'ignore' }
    );
    synthesized = true;
  }

  if (!synthesized) {
    throw new Error(
      `Unable to synthesize audio for ${scene.id}. Ensure ffmpeg or a system TTS engine is installed.`
    );
  }

  return finalWav;
}

/**
 * Generates procedural cinematic SFX stems using FFmpeg lavfi filters:
 * 1. Sub-Bass Impact Drop (65Hz -> 32Hz exponential pitch sweep)
 * 2. Cinematic Whoosh Riser (bandpass-swept pink noise)
 * 3. Ambient Tech Pad Bed (warm harmonic chord pulse for the full commercial)
 */
function generateProceduralSfx(totalDurationSec) {
  if (!FFMPEG_BIN) {
    console.warn('⚠️  FFmpeg not found on PATH; skipping procedural lavfi SFX generation.');
    return {};
  }

  const subBassPath = path.join(SFX_DIR, 'sub-bass-drop.wav');
  const whooshPath = path.join(SFX_DIR, 'cinematic-whoosh.wav');
  const ambientBedPath = path.join(SFX_DIR, 'ambient-tech-bed.wav');

  console.log('🔊 Generating procedural Sub-Bass Drop via FFmpeg lavfi...');
  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'aevalsrc=0.75*sin(2*PI*(68-22*t)*t)*exp(-1.6*t):s=48000:d=2.2',
      '-af',
      'lowpass=f=120,afade=t=out:st=1.5:d=0.7,aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo',
      '-c:a',
      'pcm_s16le',
      subBassPath,
    ],
    { stdio: 'ignore' }
  );

  console.log('🌪️  Generating procedural Cinematic Whoosh Riser via FFmpeg lavfi...');
  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'anoisesrc=color=pink:sample_rate=48000:duration=1.6:amplitude=0.45',
      '-af',
      'highpass=f=180,lowpass=f=2400,afade=t=in:st=0:d=0.9,afade=t=out:st=0.9:d=0.7,aecho=0.8:0.88:45:0.35,aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo',
      '-c:a',
      'pcm_s16le',
      whooshPath,
    ],
    { stdio: 'ignore' }
  );

  console.log('🎹 Generating Warm Futuristic Synth Bed via FFmpeg lavfi...');
  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-f',
      'lavfi',
      '-i',
      `aevalsrc=0.06*sin(2*PI*110*t)+0.04*sin(2*PI*164.81*t)+0.03*sin(2*PI*220*t)*(1+0.25*sin(2*PI*0.5*t)):s=48000:d=${totalDurationSec}`,
      '-af',
      `lowpass=f=900,afade=t=in:st=0:d=2.0,afade=t=out:st=${Math.max(1, totalDurationSec - 3)}:d=3.0,aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo`,
      '-c:a',
      'pcm_s16le',
      ambientBedPath,
    ],
    { stdio: 'ignore' }
  );

  return { subBassPath, whooshPath, ambientBedPath };
}

function main() {
  console.log('==============================================================');
  console.log('🎬 CareerSetu — Commercial Audio & SFX Synthesis Pipeline');
  console.log('==============================================================');

  const manifest = {
    generatedAt: new Date().toISOString(),
    totalDurationSec: 0,
    scenes: [],
    sfx: {},
  };

  let runningOffset = 0;
  for (const scene of SCENE_SCRIPTS) {
    const wavPath = synthesizeVoiceover(scene);
    const stat = fs.statSync(wavPath);
    const actualDurationSec = Number(((stat.size - 78) / 192000).toFixed(2));
    manifest.scenes.push({
      id: scene.id,
      text: scene.text,
      startSec: Number(runningOffset.toFixed(2)),
      durationSec: actualDurationSec,
      wavPath,
    });
    runningOffset += actualDurationSec;
  }

  manifest.totalDurationSec = Number(runningOffset.toFixed(2));
  manifest.sfx = generateProceduralSfx(runningOffset);

  const manifestPath = path.join(ASSETS_DIR, 'audio-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('--------------------------------------------------------------');
  console.log(`✅ All 9 voiceover stems + procedural SFX generated (${runningOffset}s total)`);
  console.log(`📄 Manifest written to: ${manifestPath}`);
}

main();

