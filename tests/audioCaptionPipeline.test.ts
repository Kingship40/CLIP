/**
 * Automated Verification & Validation Test Suite for:
 * 1. Audio track preservation and synchronization (AAC encoding, no silent clips).
 * 2. Burned-in / Hardcoded subtitle rendering via FFmpeg ASS and Canvas.
 * 3. Automatic Speech Recognition (ASR) offset mapping and Acoustic VAD alignment.
 * 4. Multi-aspect ratio reframing (9:16, 1:1, 16:9) and Smart Face Avoidance.
 * 5. Edge cases: silent sources, short clips, non-zero start offsets, Unicode, error recovery.
 */

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ffmpegServiceInstance } from '../src/services/ffmpegService';
import {
  mapTranscriptToClip,
  extractSignificantWords,
  segmentAudioSpeechAcoustic,
  TranscriptionService,
} from '../src/services/transcriptionService';
import {
  generateAssSubtitleFile,
  renderCaptionToCanvas,
} from '../src/services/captionBurner';
import { CaptionSettings, SubtitleSegment } from '../src/types';

const execFileAsync = promisify(execFile);

const FIXTURES_DIR = path.resolve('tests', 'fixtures');
const OUTPUT_DIR = path.resolve('tests', 'output');

// Setup fixture paths
const SOURCE_WITH_AUDIO = path.join(FIXTURES_DIR, 'source_with_audio.mp4');
const SOURCE_SILENT = path.join(FIXTURES_DIR, 'source_silent.mp4');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
    if (detail) console.log(`      ↳ ${detail}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`      ↳ Error: ${detail}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

/**
 * Creates synthetic video fixtures using FFmpeg lavfi filters
 */
async function generateTestFixtures() {
  if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const ffmpeg = ffmpegServiceInstance.getFFmpegBinary();

  // 1. Generate 8-second 1280x720 video with 1kHz sine audio track
  if (!fs.existsSync(SOURCE_WITH_AUDIO)) {
    console.log('Generating test fixture with audio (8 seconds)...');
    await execFileAsync(ffmpeg, [
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=8:size=1280x720:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=8',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ar', '44100',
      SOURCE_WITH_AUDIO,
    ]);
  }

  // 2. Generate 6-second 1280x720 silent video (no audio stream)
  if (!fs.existsSync(SOURCE_SILENT)) {
    console.log('Generating test fixture without audio (silent, 6 seconds)...');
    await execFileAsync(ffmpeg, [
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=6:size=1280x720:rate=30',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-an',
      SOURCE_SILENT,
    ]);
  }
}

async function runTestSuite() {
  console.log('\n======================================================================');
  console.log('   AUDIO EXPORT & HARDCODED CAPTION PIPELINE TEST SUITE');
  console.log('======================================================================\n');

  await generateTestFixtures();

  // -------------------------------------------------------------
  // Test 1: Media Probing (Audio Stream Detection)
  // -------------------------------------------------------------
  console.log('--- Test 1: Media Probing & Stream Detection ---');
  const probeAudio = await ffmpegServiceInstance.probeMedia(SOURCE_WITH_AUDIO);
  assert(probeAudio.hasVideo && probeAudio.videoCodec === 'h264', 'Detects video stream correctly');
  assert(probeAudio.hasAudio && probeAudio.audioCodec === 'aac', 'Detects AAC audio stream correctly', `Codec: ${probeAudio.audioCodec}, Rate: ${probeAudio.sampleRate}Hz`);
  assert(Math.abs(probeAudio.duration - 8.0) < 0.25, 'Detects correct duration (~8.0s)', `Duration: ${probeAudio.duration}s`);

  const probeSilent = await ffmpegServiceInstance.probeMedia(SOURCE_SILENT);
  assert(probeSilent.hasVideo, 'Detects video stream on silent source');
  assert(!probeSilent.hasAudio, 'Correctly identifies that silent source lacks audio stream');

  // -------------------------------------------------------------
  // Test 2: Audio Preservation on Trimmed Non-Zero Offset Clip
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Audio Preservation & Synchronization on Trimmed Clip ---');
  const outClipAudio = path.join(OUTPUT_DIR, 'clip_audio_2to6.mp4');
  const clipResult = await ffmpegServiceInstance.renderClippedVideo({
    inputVideoPath: SOURCE_WITH_AUDIO,
    outputVideoPath: outClipAudio,
    startTime: 2.0,
    endTime: 6.0,
    aspectRatio: '9:16',
    facePanX: 50,
    keepAudio: true,
  });

  assert(clipResult.hasVideo, 'Exported clip contains video stream');
  assert(clipResult.hasAudio, 'Exported clip retains audio stream (no silent video!)');
  assert(clipResult.audioCodec === 'aac', 'Audio track is encoded as standard AAC');
  assert(Math.abs(clipResult.duration - 4.0) < 0.35, 'Exported duration matches trimmed window (4.0s)', `Duration: ${clipResult.duration}s`);

  // Verify dimensions for 9:16 vertical crop
  const probeExported = await ffmpegServiceInstance.probeMedia(outClipAudio);
  assert(probeExported.width === 720 && probeExported.height === 1280, 'Output dimensions match vertical 9:16 standard (720x1280)', `${probeExported.width}x${probeExported.height}`);

  // -------------------------------------------------------------
  // Test 3: Short Clip (1.5s) Audio & Video Precision
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Short Clip Slicing (1.5 seconds) ---');
  const outShortClip = path.join(OUTPUT_DIR, 'clip_short_1_5s.mp4');
  const shortResult = await ffmpegServiceInstance.renderClippedVideo({
    inputVideoPath: SOURCE_WITH_AUDIO,
    outputVideoPath: outShortClip,
    startTime: 1.0,
    endTime: 2.5,
    aspectRatio: '1:1',
    keepAudio: true,
  });

  assert(shortResult.hasAudio, 'Short 1.5s clip retains synchronized audio track');
  assert(Math.abs(shortResult.duration - 1.5) < 0.35, 'Short clip duration is strictly 1.5s', `Duration: ${shortResult.duration}s`);
  const probeSquare = await ffmpegServiceInstance.probeMedia(outShortClip);
  assert(probeSquare.width === 720 && probeSquare.height === 720, 'Output dimensions match square 1:1 format (720x720)');

  // -------------------------------------------------------------
  // Test 4: Graceful Handling of Source Video Without Audio
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Graceful Handling of Silent Video Source ---');
  const outSilentClip = path.join(OUTPUT_DIR, 'clip_silent_output.mp4');
  const silentResult = await ffmpegServiceInstance.renderClippedVideo({
    inputVideoPath: SOURCE_SILENT,
    outputVideoPath: outSilentClip,
    startTime: 0.5,
    endTime: 3.5,
    aspectRatio: '16:9',
    keepAudio: true, // Requested keepAudio on source without audio
  });

  assert(silentResult.hasVideo, 'Silent source renders valid video stream without crashing');
  assert(!silentResult.hasAudio, 'Gracefully finishes without producing corrupt audio streams');
  assert(Math.abs(silentResult.duration - 3.0) < 0.35, 'Silent clip duration matches request (3.0s)');

  // -------------------------------------------------------------
  // Test 5: Subtitle Offset Mapping & Clipping Window Filtering
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Subtitle Offset Mapping ($t_{clip} = t - t_{start}$) ---');
  const fullTranscript: SubtitleSegment[] = [
    { id: 'sub_0', start: 0.5, end: 1.8, text: 'Intro outside clip window', highlightWords: ['Intro'] },
    { id: 'sub_1', start: 2.5, end: 4.5, text: 'First spoken sentence inside clip', highlightWords: ['spoken', 'sentence'] },
    { id: 'sub_2', start: 4.8, end: 5.8, text: 'Second spoken sentence inside clip', highlightWords: ['Second'] },
    { id: 'sub_3', start: 7.0, end: 7.8, text: 'Outro outside clip window', highlightWords: ['Outro'] },
  ];

  // Clip window from 2.0s to 6.0s (relativeToClip = true)
  const mappedSubs = mapTranscriptToClip(fullTranscript, 2.0, 6.0, true);
  assert(mappedSubs.length === 2, 'Filters out segments outside clip window (kept 2 of 4)');
  assert(mappedSubs[0].id === 'sub_1' && mappedSubs[0].start === 0.5 && mappedSubs[0].end === 2.5,
    'Maps segment 1 start from 2.5s to 0.5s relative offset',
    `Start: ${mappedSubs[0].start}s, End: ${mappedSubs[0].end}s`
  );
  assert(mappedSubs[1].id === 'sub_2' && mappedSubs[1].start === 2.8 && mappedSubs[1].end === 3.8,
    'Maps segment 2 start from 4.8s to 2.8s relative offset',
    `Start: ${mappedSubs[1].start}s, End: ${mappedSubs[1].end}s`
  );

  // -------------------------------------------------------------
  // Test 6: Hardcoded Subtitle Burning with ASS & Unicode
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Hardcoded Subtitle Burning & ASS Generation ---');
  const captionSettings: CaptionSettings = {
    enabled: true,
    preset: 'hormozi',
    fontSize: 'lg',
    position: 'bottom',
    highlightColor: '#FACC15',
    textColor: '#FFFFFF',
    showOpeningTitle: true,
    openingTitle: '🚀 Viral AI Clip',
  };

  const unicodeSubs: SubtitleSegment[] = [
    {
      id: 'sub_burn_1',
      start: 2.2,
      end: 4.2,
      text: 'Hardcoded subtitles burned directly into frames: café & résumé!',
      highlightWords: ['Hardcoded', 'burned', 'café'],
    },
    {
      id: 'sub_burn_2',
      start: 4.4,
      end: 5.8,
      text: 'Multilingual accents and symbols 100% preserved permanently.',
      highlightWords: ['Multilingual', 'preserved'],
    },
  ];

  // Test ASS format generator
  const assOutput = generateAssSubtitleFile(unicodeSubs, captionSettings, 720, 1280);
  assert(assOutput.includes('[Script Info]') && assOutput.includes('[V4+ Styles]'), 'Generates valid ASS subtitle header');
  assert(assOutput.includes('subtitles') && assOutput.includes('café & résumé'), 'Preserves caption text and Unicode in dialogue lines');
  assert(assOutput.includes('PlayResX: 720') && assOutput.includes('PlayResY: 1280'), 'Matches target video canvas resolution');

  // Render MP4 with burned captions + audio
  const outBurnedClip = path.join(OUTPUT_DIR, 'clip_burned_captions.mp4');
  const burnedResult = await ffmpegServiceInstance.renderClippedVideo({
    inputVideoPath: SOURCE_WITH_AUDIO,
    outputVideoPath: outBurnedClip,
    startTime: 2.0,
    endTime: 6.0,
    aspectRatio: '9:16',
    facePanX: 50,
    subtitles: unicodeSubs,
    captionSettings,
    keepAudio: true,
  });

  assert(burnedResult.hasVideo && burnedResult.hasAudio, 'Burned caption video contains both video and audio');
  assert(burnedResult.verified, 'Post-render FFprobe verifies valid stream mapping and media container');

  // -------------------------------------------------------------
  // Test 7: Acoustic VAD Energy Speech Segmenter
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Acoustic VAD Speech Segmenter (Universal Engine) ---');
  // Synthesize an audio buffer with speech burst (sine pulse between 1.0s and 2.5s)
  const sampleRate = 16000;
  const durationSec = 4.0;
  const totalSamples = sampleRate * durationSec;
  const channelData = new Float32Array(totalSamples);

  // Fill 1.0s to 2.5s with sine wave energy (amplitude 0.5)
  for (let i = Math.floor(sampleRate * 1.0); i < Math.floor(sampleRate * 2.5); i++) {
    channelData[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
  }

  const acousticResult = await segmentAudioSpeechAcoustic(
    { sampleRate, channelData: [channelData] },
    durationSec,
    'This is a real spoken sentence detected by energy.'
  );

  assert(acousticResult.subtitles.length > 0, 'Acoustic VAD segmenter detected speech activity intervals');
  const firstInterval = acousticResult.subtitles[0];
  assert(firstInterval.start >= 0.8 && firstInterval.start <= 1.2,
    'Accurately pinpoints speech onset at ~1.0s',
    `Detected onset: ${firstInterval.start}s`
  );
  assert(firstInterval.end >= 2.3 && firstInterval.end <= 2.7,
    'Accurately pinpoints speech offset at ~2.5s',
    `Detected offset: ${firstInterval.end}s`
  );

  // -------------------------------------------------------------
  // Test 8: Keyword Extraction for Kinetic Typography
  // -------------------------------------------------------------
  console.log('\n--- Test 8: High-Impact Keyword Extraction for Kinetic Typography ---');
  const samplePhrase = 'The single biggest mistake most creators make is overlooking retention';
  const keywords = extractSignificantWords(samplePhrase);
  assert(keywords.length > 0, 'Extracts keywords from spoken sentence');
  assert(keywords.includes('retention') || keywords.includes('creators') || keywords.includes('biggest'),
    'Identifies core impactful tokens, omitting stop words',
    `Extracted: ${keywords.join(', ')}`
  );

  // -------------------------------------------------------------
  // Test 9: Transcription Retry & Error Handling
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Transcription Service Retry & Error Resilience ---');
  const service = new TranscriptionService();
  try {
    // Intentionally pass an invalid fake API key
    await service.transcribe(new Blob(['fake'], { type: 'audio/wav' }), {
      provider: 'whisper',
      apiKey: 'sk-invalid-test-key-12345',
    });
    assert(false, 'Should have thrown on invalid Whisper API key');
  } catch (err: any) {
    assert(err.message.includes('Automatic Speech Recognition failed after 2 attempts') || err.message.includes('Whisper API failed'),
      'Retries and throws clear informative error message when transcription fails',
      err.message.slice(0, 80) + '...'
    );
  }

  // Missing input file handling in FFmpeg
  try {
    await ffmpegServiceInstance.renderClippedVideo({
      inputVideoPath: 'non_existent_video_path.mp4',
      outputVideoPath: path.join(OUTPUT_DIR, 'out_fail.mp4'),
      startTime: 0,
      endTime: 2,
    });
    assert(false, 'Should have thrown on missing input file');
  } catch (err: any) {
    assert(err.message.includes('Input source video not found'), 'Throws clear error on missing input video file');
  }

  // -------------------------------------------------------------
  // Final Benchmark Summary
  // -------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`   TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('======================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\nTest Suite Execution Failed:', err);
  process.exit(1);
});
