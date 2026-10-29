#!/usr/bin/env node
/**
 * CareerSetu — Google TTS / Gemini Studio Voiceover & Procedural SFX Asset Generator
 *
 * Voice Configuration:
 * - Language Code: `en-US`
 * - Voice Model: `en-US-Journey-F` (fallback `en-US-Neural2-F` / Gemini Studio Voice `Kore` / `Aoede`)
 * - Speaking Rate: `1.04` (confident, punchy tech-commercial tempo)
 * - Pitch: `0.0`
 * - Script Delivery: Confident, crisp, executive tech-commercial cadence.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT_DIR = process.cwd();
const ASSETS_DIR = path.resolve(ROOT_DIR, 'demo-assets');
const VO_DIR = path.join(ASSETS_DIR, 'voiceovers');
const SFX_DIR = path.join(ASSETS_DIR, 'sfx');

[ASSETS_DIR, VO_DIR, SFX_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Load environment variables from `.env.local` and `.env` without external dependencies
 */
function loadDotEnv() {
  for (const envFile of ['.env.local', '.env']) {
    const fullPath = path.join(ROOT_DIR, envFile);
    if (!fs.existsSync(fullPath)) continue;
    const lines = fs.readFileSync(fullPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadDotEnv();

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

const VOICE_CONFIG = {
  languageCode: 'en-US',
  primaryModel: 'en-US-Journey-F',
  secondaryModel: 'en-US-Neural2-F',
  geminiStudioVoice: 'Kore', // Crisp female executive studio voice
  speakingRate: 1.04,
  pitch: 0.0,
};

/**
 * 9 Universal Student Career Commercial Voiceover Scenes
 * Written with punchy, executive tech-commercial cadence (Apple / Stripe / Linear style).
 */
const SCENE_SCRIPTS = [
  {
    id: 'scene-01-hook',
    durationSec: 8,
    text: 'Meet CareerSetu. Bridging higher education to meaningful careers. Moving students from passive chatbot answers to measurable readiness and action.',
  },
  {
    id: 'scene-02-onboarding',
    durationSec: 8,
    text: 'In seconds, Aarav calibrates his degree, verified Python, SQL, and FastAPI stack, and locks onto a Data Engineering trajectory.',
  },
  {
    id: 'scene-03-readiness',
    durationSec: 8,
    text: 'Zero black-box mystery. The explainable Readiness Engine scores six weighted dimensions across technical skills, practical projects, academics, and communication.',
  },
  {
    id: 'scene-04-skillgap',
    durationSec: 8,
    text: 'High-speed set intersections match Aarav to Data Systems Engineer, explaining the fit while pinpointing exact deficits like Apache Spark and Docker.',
  },
  {
    id: 'scene-05-roadmap',
    durationSec: 8,
    text: 'Missing skills become a ninety-day execution roadmap across three phases. Completing a weekly lab recalibrates his readiness score in real time.',
  },
  {
    id: 'scene-06-opportunities',
    durationSec: 7,
    text: 'Curated opportunity matching connects verified skills directly to industry internships and new-grad engineering roles with transparent qualification criteria.',
  },
  {
    id: 'scene-07-resume',
    durationSec: 8,
    text: 'The Evidence-Grounded Resume Copilot transforms weak bullets into metric-driven impact statements, strictly anchored to real achievements with zero hallucinated claims.',
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

/**
 * Normalizes any generated audio file to 48kHz stereo WAV with a 0.35s natural breathing tail
 * and optional speakingRate tempo adjustment (`atempo=1.04`).
 */
  function normalizeWavWithFfmpeg(inputPath, outputPath, applyTempo = false, rawPcmRate = null) {
    if (!FFMPEG_BIN) {
      if (inputPath !== outputPath) {
        fs.copyFileSync(inputPath, outputPath);
      }
      return;
    }

    const filterChain = [];
    if (applyTempo && VOICE_CONFIG.speakingRate !== 1.0) {
      filterChain.push(`atempo=${VOICE_CONFIG.speakingRate}`);
    }
    // High-pass at 75Hz + subtle studio presence EQ for crisp commercial voiceover clarity
    filterChain.push('highpass=f=75');
    filterChain.push('equalizer=f=3200:t=q:w=1.2:g=2.2');
    filterChain.push('apad=pad_dur=0.35');
    filterChain.push('aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo');

    const inputArgs = rawPcmRate
      ? ['-f', 's16le', '-ar', String(rawPcmRate), '-ac', '1', '-i', inputPath]
      : ['-i', inputPath];

    execFileSync(
      FFMPEG_BIN,
      ['-y', ...inputArgs, '-af', filterChain.join(','), '-c:a', 'pcm_s16le', outputPath],
      { stdio: 'ignore' }
    );
  }

  /**
   * Tier 1: Google Cloud Text-to-Speech API (`en-US-Journey-F` / `en-US-Neural2-F`)
   * Configuration: languageCode='en-US', speakingRate=1.04, pitch=0.0
   */
    async function tryGoogleCloudTts(text, rawWavOut, apiKey) {
      if (!apiKey) return false;

        for (const voiceName of [VOICE_CONFIG.primaryModel, VOICE_CONFIG.secondaryModel]) {
          try {
        const response = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text },
              voice: {
                languageCode: VOICE_CONFIG.languageCode,
                name: voiceName,
              },
              audioConfig: {
                audioEncoding: 'LINEAR16',
                speakingRate: VOICE_CONFIG.speakingRate,
                pitch: VOICE_CONFIG.pitch,
                sampleRateHertz: 48000,
              },
            }),
          }
        );

            if (!response.ok) continue;
            const data = await response.json();
            if (data && data.audioContent) {
              fs.writeFileSync(rawWavOut, Buffer.from(data.audioContent, 'base64'));
              return { engine: `Google Cloud TTS (${voiceName})`, needsTempo: false, rawPcmRate: null };
            }
          } catch {
            // try next model
          }
        }
        return false;
      }

            /**
             * Tier 2: Google Gemini Native Studio TTS API (`gemini-2.5-flash-preview-tts`)
             * Synthesizes 24kHz LINEAR16 studio voice with executive commercial cadence
             */
            async function tryGeminiStudioTts(text, rawPcmOut, apiKey) {
              if (!apiKey) return false;

              const models = ['gemini-2.5-flash-preview-tts'];
              for (const model of models) {
                for (let attempt = 1; attempt <= 3; attempt++) {
                  try {
                    const response = await fetch(
                      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contents: [
                            {
                              parts: [
                                {
                                  text: `Say in a confident, crisp, executive en-US tech-commercial cadence: ${text}`,
                                },
                              ],
                            },
                          ],
                          generationConfig: {
                            responseModalities: ['AUDIO'],
                            speechConfig: {
                              voiceConfig: {
                                prebuiltVoiceConfig: {
                                  voiceName: VOICE_CONFIG.geminiStudioVoice,
                                },
                              },
                            },
                          },
                        }),
                      }
                    );

                    if (!response.ok) {
                      await new Promise((r) => setTimeout(r, 1200 * attempt));
                      continue;
                    }
                    const data = await response.json();
                    const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
                    if (inlineData && inlineData.data) {
                      fs.writeFileSync(rawPcmOut, Buffer.from(inlineData.data, 'base64'));
                      const rateMatch = (inlineData.mimeType || '').match(/rate=(\d+)/);
                      const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
                      return {
                        engine: `Gemini Studio Voice (${model} / ${VOICE_CONFIG.geminiStudioVoice})`,
                        needsTempo: true,
                        rawPcmRate: sampleRate,
                      };
                    }
                  } catch {
                    await new Promise((r) => setTimeout(r, 1000 * attempt));
                  }
                }
              }
              return false;
            }

              /**
               * Tier 3: Google Neural TTS HTTPS Endpoint (`en-US`, speakingRate=1.04 via FFmpeg atempo)
               */
              async function tryGoogleNeuralHttpTts(text, rawMp3Out) {
                try {
                  const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${VOICE_CONFIG.languageCode}&q=${encodeURIComponent(text)}`;
                  const response = await fetch(url, {
                    headers: {
                      'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    },
                  });
                  if (!response.ok) return false;
                  const arrayBuffer = await response.arrayBuffer();
                  const buf = Buffer.from(arrayBuffer);
                  if (buf.length < 512) return false;
                  fs.writeFileSync(rawMp3Out, buf);
                  return {
                    engine: `Google Neural TTS (${VOICE_CONFIG.languageCode} @ ${VOICE_CONFIG.speakingRate}x)`,
                    needsTempo: true,
                    rawPcmRate: null,
                  };
                } catch {
                  return false;
                }
              }

                /**
                 * Synthesizes a single scene voiceover stem using Google Cloud TTS / Gemini Studio API
                 * with resilient fallbacks.
                 */
                async function synthesizeVoiceover(scene) {
                  const apiKey =
                    process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
                  const rawTemp = path.join(VO_DIR, `${scene.id}-raw.bin`);
                  const rawMp3 = path.join(VO_DIR, `${scene.id}-raw.mp3`);
                  const rawWav = path.join(VO_DIR, `${scene.id}-raw.wav`);
                  const finalWav = path.join(VO_DIR, `${scene.id}.wav`);

                  // 1. Try Google Cloud TTS (`en-US-Journey-F` / `en-US-Neural2-F`)
                  let res = await tryGoogleCloudTts(scene.text, rawWav, apiKey);
                  if (res) {
                    console.log(`🎙️  [${scene.id}] Synthesized via ${res.engine}`);
                    normalizeWavWithFfmpeg(rawWav, finalWav, res.needsTempo, res.rawPcmRate);
                    if (fs.existsSync(rawWav)) fs.unlinkSync(rawWav);
                    return finalWav;
                  }

                  // 2. Try Google Gemini Studio TTS (`gemini-2.5-flash-preview-tts`)
                  res = await tryGeminiStudioTts(scene.text, rawTemp, apiKey);
                  if (res) {
                    console.log(`🎙️  [${scene.id}] Synthesized via ${res.engine}`);
                    normalizeWavWithFfmpeg(rawTemp, finalWav, res.needsTempo, res.rawPcmRate);
                    if (fs.existsSync(rawTemp)) fs.unlinkSync(rawTemp);
                    return finalWav;
                  }

                  // 3. Try Google Neural TTS (`en-US` @ 1.04x)
                  res = await tryGoogleNeuralHttpTts(scene.text, rawMp3);
                  if (res) {
                    console.log(`🎙️  [${scene.id}] Synthesized via ${res.engine}`);
                    normalizeWavWithFfmpeg(rawMp3, finalWav, res.needsTempo, res.rawPcmRate);
                    if (fs.existsSync(rawMp3)) fs.unlinkSync(rawMp3);
                    return finalWav;
                  }

                  // 4. Local OS TTS Fallback
                  if (process.platform === 'win32') {
                    const escapedText = scene.text.replace(/'/g, "''");
                    const escapedOut = rawWav.replace(/'/g, "''");
                    const psScript = `
      Add-Type -AssemblyName System.Speech;
      $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
      $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female);
      $synth.Rate = 1;
      $synth.Volume = 100;
      $synth.SetOutputToWaveFile('${escapedOut}');
      $synth.Speak('${escapedText}');
      $synth.Dispose();
    `;
                    execFileSync('powershell', ['-NoProfile', '-Command', psScript], { stdio: 'ignore' });
                    normalizeWavWithFfmpeg(rawWav, finalWav, true, null);
                    if (fs.existsSync(rawWav)) fs.unlinkSync(rawWav);
                    console.log(`🎙️  [${scene.id}] Synthesized via Local Female SAPI Fallback`);
                    return finalWav;
                  }

                  throw new Error(`Unable to synthesize voiceover for ${scene.id}`);
                }

                /**
                 * Generates procedural cinematic SFX stems using FFmpeg lavfi filters
                 */
                function generateProceduralSfx(totalDurationSec) {
                  if (!FFMPEG_BIN) return {};

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
                      `aevalsrc=0.055*sin(2*PI*110*t)+0.038*sin(2*PI*164.81*t)+0.028*sin(2*PI*220*t)*(1+0.25*sin(2*PI*0.5*t)):s=48000:d=${totalDurationSec}`,
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

                  async function main() {
                    console.log('==============================================================');
                    console.log('🎬 CareerSetu — Google TTS / Gemini Commercial Voiceover Engine');
                    console.log(
                      `⚙️  Config: lang=${VOICE_CONFIG.languageCode} | model=${VOICE_CONFIG.primaryModel} | rate=${VOICE_CONFIG.speakingRate} | pitch=${VOICE_CONFIG.pitch}`
                    );
                    console.log('==============================================================');

                    const manifest = {
                      generatedAt: new Date().toISOString(),
                      voiceConfig: VOICE_CONFIG,
                      totalDurationSec: 0,
                      scenes: [],
                      sfx: {},
                    };

                    let runningOffset = 0;
                    for (const scene of SCENE_SCRIPTS) {
                      const wavPath = await synthesizeVoiceover(scene);
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
                    manifest.sfx = generateProceduralSfx(manifest.totalDurationSec);

                    const manifestPath = path.join(ASSETS_DIR, 'audio-manifest.json');
                    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

                    console.log('--------------------------------------------------------------');
                    console.log(
                      `✅ All 9 Google TTS voiceover stems + SFX generated (${manifest.totalDurationSec}s total)`
                    );
                    console.log(`📄 Manifest written to: ${manifestPath}`);
                  }

                  main().catch((err) => {
                    console.error('❌ Voiceover generation failed:', err);
                    process.exit(1);
                  });
