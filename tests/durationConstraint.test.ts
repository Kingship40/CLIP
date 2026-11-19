/**
 * Comprehensive Automated Acceptance Test Suite for:
 * USER-SELECTED CLIP DURATION CONSTRAINT ENFORCEMENT
 * 
 * Verifies:
 * 1. Single Source of Truth Duration Resolution (15-30s, 30-60s, 60-90s, custom, exact).
 * 2. Range Enforcement (15-30s, 30-60s, 60-90s).
 * 3. Exact Target Duration Compliance within frame tolerance (±0.15s).
 * 4. AI Viral Moment Boundary Centering, Outward Expansion & Inward Trimming.
 * 5. Source Video Duration Validation (rejects or clamps without fabricating footage).
 * 6. ClippingService generateClips & generateSimulatedClips compliance.
 * 7. BackgroundJobQueue duration propagation & clip boundary enforcement.
 * 8. Client-Side AI Engine & Multimodal AI prompt/boundary compliance.
 * 9. FFmpeg -t exact duration trimming & FFprobe post-render duration verification.
 */

process.env.NODE_ENV = 'test';

import path from 'path';
import fs from 'fs';
import {
  resolveDurationConstraint,
  validateSourceDuration,
  enforceClipDurationBoundaries,
  isDurationCompliant,
  DurationConstraint,
} from '../src/services/intelligence/durationValidator';
import { boundaryOptimizerInstance } from '../src/services/intelligence/boundaryOptimizer';
import { viralIntelligenceEngineInstance } from '../src/services/intelligence/viralIntelligenceEngine';
import { DemoClippingService } from '../src/services/clippingService';
import { backgroundJobQueueInstance } from '../src/services/backend/backgroundJobQueue';
import { analyzeVideoWithClientEngine } from '../src/services/aiVideoAnalysisService';
import { ffmpegServiceInstance } from '../src/services/ffmpegService';
import { SubtitleSegment, Project } from '../src/types';

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

async function runDurationConstraintTests() {
  console.log('\n======================================================================');
  console.log('   USER-SELECTED DURATION CONSTRAINT ENFORCEMENT BENCHMARK SUITE');
  console.log('======================================================================\n');

  // -------------------------------------------------------------
  // Test 1: Single Source of Truth Duration Resolution
  // -------------------------------------------------------------
  console.log('--- Test 1: Duration Constraint Resolution Engine ---');

  const c1530 = resolveDurationConstraint('15-30');
  assert(c1530.minSeconds === 15.0 && c1530.maxSeconds === 30.0 && c1530.mode === 'range',
    'Resolves "15-30" preset into [15.0s - 30.0s] range',
    `${c1530.minSeconds}s to ${c1530.maxSeconds}s`
  );

  const c3060 = resolveDurationConstraint('30-60');
  assert(c3060.minSeconds === 30.0 && c3060.maxSeconds === 60.0 && c3060.mode === 'range',
    'Resolves "30-60" preset into [30.0s - 60.0s] range',
    `${c3060.minSeconds}s to ${c3060.maxSeconds}s`
  );

  const c6090 = resolveDurationConstraint('60-90');
  assert(c6090.minSeconds === 60.0 && c6090.maxSeconds === 90.0 && c6090.mode === 'range',
    'Resolves "60-90" preset into [60.0s - 90.0s] range',
    `${c6090.minSeconds}s to ${c6090.maxSeconds}s`
  );

  const cExact = resolveDurationConstraint(undefined, undefined, 30.0);
  assert(cExact.mode === 'exact' && cExact.targetSeconds === 30.0,
    'Resolves exact target duration of 30.0s',
    `Mode: ${cExact.mode}, Target: ${cExact.targetSeconds}s`
  );

  const cCustom = resolveDurationConstraint('custom', 45);
  assert(cCustom.targetSeconds === 45.0,
    'Resolves custom duration of 45s',
    `Target: ${cCustom.targetSeconds}s`
  );

  // -------------------------------------------------------------
  // Test 2: Source Video Duration Validation
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Source Video Duration Pre-Flight Validation ---');

  const validSource = validateSourceDuration(180, c3060);
  assert(validSource.isValid, 'Accepts 180s source for 30-60s clipping range');

  const shortSource = validateSourceDuration(18, c3060);
  assert(!shortSource.isValid && !!shortSource.error,
    'Detects when source video (18s) is shorter than minimum requested range (30s)',
    shortSource.error
  );

  // -------------------------------------------------------------
  // Test 3: AI Candidate Boundary Expansion & Trimming
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Boundary Clamping & Centered Expansion ---');

  // Case A: Candidate moment is too short (e.g. 8s hook inside a 15-30s selection)
  const shortCandidate = enforceClipDurationBoundaries(10.0, 18.0, c1530, 120.0);
  assert(
    shortCandidate.duration >= 15.0 && shortCandidate.duration <= 30.0,
    'Expands under-length moment (8s) outwards to meet minimum 15.0s',
    `Result duration: ${shortCandidate.duration}s [${shortCandidate.startTime}s - ${shortCandidate.endTime}s]`
  );
  // Verify core moment remains centered: original center = 14.0, new center = (6.5 + 21.5)/2 = 14.0
  const centerShort = shortCandidate.startTime + shortCandidate.duration / 2;
  assert(Math.abs(centerShort - 14.0) < 0.2, 'Preserves original core moment center during expansion');

  // Case B: Candidate moment is too long (e.g. 75s discussion inside a 30-60s selection)
  const longCandidate = enforceClipDurationBoundaries(20.0, 95.0, c3060, 120.0);
  assert(
    longCandidate.duration >= 30.0 && longCandidate.duration <= 60.0,
    'Trims over-length moment (75s) inwards to meet maximum 60.0s',
    `Result duration: ${longCandidate.duration}s [${longCandidate.startTime}s - ${longCandidate.endTime}s]`
  );

  // Case C: Exact target duration enforcement (30.0s exact)
  const exactCandidate = enforceClipDurationBoundaries(15.0, 25.0, cExact, 120.0);
  assert(
    Math.abs(exactCandidate.duration - 30.0) < 0.05,
    'Enforces exact target duration (30.0s)',
    `Duration: ${exactCandidate.duration}s`
  );

  // -------------------------------------------------------------
  // Test 4: Boundary Optimizer Engine with Subtitles
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Boundary Optimizer Expansion with Subtitles ---');

  const subtitles: SubtitleSegment[] = [
    { id: 's1', start: 10.0, end: 14.0, text: 'This is the breakthrough insight that changed our approach.' },
    { id: 's2', start: 14.2, end: 17.5, text: 'We stopped wasting time on manual editing and automated the flow.' },
  ];

  // Optimize for 15-30s range:
  const opt1530 = boundaryOptimizerInstance.optimizeBoundaries(subtitles, 10.0, 17.5, {
    minDuration: 15.0,
    maxDuration: 30.0,
    preferredDuration: 22.5,
    sourceTotalDuration: 120.0,
  });
  assert(
    opt1530.duration >= 15.0 && opt1530.duration <= 30.0,
    'Optimizes boundary to satisfy [15.0s - 30.0s] range',
    `Optimized duration: ${opt1530.duration}s [${opt1530.startTime}s - ${opt1530.endTime}s]`
  );

  // Optimize for 30-60s range:
  const opt3060 = boundaryOptimizerInstance.optimizeBoundaries(subtitles, 10.0, 17.5, {
    minDuration: 30.0,
    maxDuration: 60.0,
    preferredDuration: 45.0,
    sourceTotalDuration: 120.0,
  });
  assert(
    opt3060.duration >= 30.0 && opt3060.duration <= 60.0,
    'Optimizes boundary to satisfy [30.0s - 60.0s] range',
    `Optimized duration: ${opt3060.duration}s [${opt3060.startTime}s - ${opt3060.endTime}s]`
  );

  // Optimize for exact duration:
  const optExact = boundaryOptimizerInstance.optimizeBoundaries(subtitles, 10.0, 17.5, {
    minDuration: 29.5,
    maxDuration: 30.5,
    preferredDuration: 30.0,
    exactDuration: 30.0,
    sourceTotalDuration: 120.0,
  });
  assert(
    Math.abs(optExact.duration - 30.0) <= 0.2,
    'Optimizes boundary to satisfy exact 30.0s target within frame tolerance',
    `Optimized duration: ${optExact.duration}s`
  );

  // -------------------------------------------------------------
  // Test 5: Viral Intelligence Engine Integration
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Viral Intelligence Engine Duration Adherence ---');

  const testTranscript: SubtitleSegment[] = [
    { id: 'w1', start: 5.0, end: 12.0, text: 'The biggest mistake creators make is starting with a slow introduction.' },
    { id: 'w2', start: 12.5, end: 19.0, text: 'When you eliminate the fluff, viewer retention immediately doubles.' },
    { id: 'w3', start: 19.5, end: 27.0, text: 'Always present the most counter-intuitive outcome in the first five seconds.' },
    { id: 'w4', start: 35.0, end: 42.0, text: 'Here is the exact three-step formula we use to scale accounts.' },
    { id: 'w5', start: 42.5, end: 50.0, text: 'Step one is isolate the peak moment of the episode.' },
    { id: 'w6', start: 50.5, end: 58.0, text: 'Step two is dynamic kinetic captioning with highlighted keywords.' },
    { id: 'w7', start: 58.5, end: 66.0, text: 'Step three is 9:16 vertical face reframing with headroom margins.' },
    { id: 'w8', start: 70.0, end: 77.0, text: 'Why traditional long-form video editing is becoming obsolete.' },
    { id: 'w9', start: 77.5, end: 85.0, text: 'Audiences demand high-density value without wasted filler.' },
    { id: 'w10', start: 85.5, end: 94.0, text: 'Creators who master short-form distribution will dominate in 2026.' },
  ];

  // A. Request 15-30s
  const moments1530 = await viralIntelligenceEngineInstance.extractViralMoments(
    testTranscript,
    120.0,
    {
      clipCount: 3,
      minDuration: 15.0,
      maxDuration: 30.0,
      targetDuration: 22.5,
    }
  );
  assert(moments1530.moments.length === 3, 'Extracted 3 clips for 15-30s selection');
  assert(
    moments1530.moments.every((m) => m.duration >= 14.9 && m.duration <= 30.1),
    'Every clip for 15-30s selection strictly falls within 15.0s - 30.0s range',
    `Durations: ${moments1530.moments.map((m) => `${m.duration}s`).join(', ')}`
  );

  // B. Request 30-60s
  const moments3060 = await viralIntelligenceEngineInstance.extractViralMoments(
    testTranscript,
    120.0,
    {
      clipCount: 3,
      minDuration: 30.0,
      maxDuration: 60.0,
      targetDuration: 45.0,
    }
  );
  assert(
    moments3060.moments.every((m) => m.duration >= 29.9 && m.duration <= 60.1),
    'Every clip for 30-60s selection strictly falls within 30.0s - 60.0s range',
    `Durations: ${moments3060.moments.map((m) => `${m.duration}s`).join(', ')}`
  );

  // C. Request 60-90s
  const moments6090 = await viralIntelligenceEngineInstance.extractViralMoments(
    testTranscript,
    120.0,
    {
      clipCount: 1,
      minDuration: 60.0,
      maxDuration: 90.0,
      targetDuration: 75.0,
    }
  );
  assert(
    moments6090.moments[0].duration >= 59.9 && moments6090.moments[0].duration <= 90.1,
    'Clip for 60-90s selection strictly falls within 60.0s - 90.0s range',
    `Duration: ${moments6090.moments[0].duration}s`
  );

  // -------------------------------------------------------------
  // Test 6: ClippingService generateClips & generateSimulatedClips
  // -------------------------------------------------------------
  console.log('\n--- Test 6: ClippingService Pipeline Verification ---');

  const clippingService = new DemoClippingService();
  const baseProject: Project = {
    id: 'proj_test_duration',
    name: 'Duration Test Video',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'completed',
    sourceVideo: {
      name: 'duration_test.mp4',
      size: 15000000,
      type: 'video/mp4',
      duration: 150.0,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      url: 'https://example.com/authorized.mp4',
    },
    config: {
      clipCount: 3,
      targetDuration: '15-30',
      aspectRatio: '9:16',
      contentType: 'educational',
      preferences: ['hooks', 'educational'],
      captionSettings: {
        enabled: true,
        preset: 'hormozi',
        fontSize: 'lg',
        position: 'middle',
        highlightColor: '#F59E0B',
        textColor: '#FFFFFF',
        showOpeningTitle: true,
      },
      outputResolution: '1080p',
      language: 'en',
      keepAudio: true,
    },
    clips: [],
  };

  // 15-30s simulated clips
  const simClips1530 = clippingService.generateSimulatedClips({
    ...baseProject,
    config: { ...baseProject.config, targetDuration: '15-30' },
  });
  assert(
    simClips1530.every((c) => c.duration >= 14.9 && c.duration <= 30.1),
    'Simulated clips strictly satisfy 15-30s constraint',
    simClips1530.map((c) => `${c.duration}s`).join(', ')
  );

  // 30-60s simulated clips
  const simClips3060 = clippingService.generateSimulatedClips({
    ...baseProject,
    config: { ...baseProject.config, targetDuration: '30-60' },
  });
  assert(
    simClips3060.every((c) => c.duration >= 29.9 && c.duration <= 60.1),
    'Simulated clips strictly satisfy 30-60s constraint',
    simClips3060.map((c) => `${c.duration}s`).join(', ')
  );

  // 60-90s simulated clips
  const simClips6090 = clippingService.generateSimulatedClips({
    ...baseProject,
    config: { ...baseProject.config, targetDuration: '60-90' },
  });
  assert(
    simClips6090.every((c) => c.duration >= 59.9 && c.duration <= 90.1),
    'Simulated clips strictly satisfy 60-90s constraint',
    simClips6090.map((c) => `${c.duration}s`).join(', ')
  );

  // Custom 40s simulated clips
  const simClipsCustom = clippingService.generateSimulatedClips({
    ...baseProject,
    config: { ...baseProject.config, targetDuration: 'custom', customDurationSeconds: 40 },
  });
  assert(
    simClipsCustom.every((c) => Math.abs(c.duration - 40.0) <= 1.0),
    'Simulated clips strictly satisfy custom 40s target',
    simClipsCustom.map((c) => `${c.duration}s`).join(', ')
  );

  // -------------------------------------------------------------
  // Test 7: BackgroundJobQueue Ingestion with Duration Constraint
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Background Job Queue Ingestion Duration Enforcement ---');

  const bgJob = await backgroundJobQueueInstance.submitJob(
    'https://vjs.zencdn.net/v/oceans.mp4?test_duration=1',
    {
      clipCount: 2,
      targetDuration: '15-30',
      retentionPolicy: 'immediate',
    }
  );

  // Wait for background job completion
  let waited = 0;
  while (waited < 30000) {
    await new Promise((r) => setTimeout(r, 150));
    waited += 150;
    const current = backgroundJobQueueInstance.getJob(bgJob.id);
    if (current && (current.status === 'completed' || current.status === 'failed')) {
      break;
    }
  }
  const completedJob = backgroundJobQueueInstance.getJob(bgJob.id);
  assert(completedJob?.status === 'completed', 'Background job completes successfully');
  assert(completedJob?.clips.length === 2, 'Generated 2 clips in background job');
  assert(
    completedJob?.clips.every((c) => c.duration >= 14.9 && c.duration <= 30.1),
    'All clips in background job strictly adhere to requested "15-30" duration',
    completedJob?.clips.map((c) => `${c.duration}s`).join(', ')
  );

  // -------------------------------------------------------------
  // Test 8: Client Engine Video Analysis Duration Compliance
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Client-Side Vision Engine Duration Compliance ---');

  const client1530 = analyzeVideoWithClientEngine(120.0, 'Demo Video', '15-30');
  assert(
    client1530.every((c) => (c.end - c.start) >= 14.9 && (c.end - c.start) <= 30.1),
    'Client vision engine clips strictly respect 15-30s range',
    client1530.map((c) => `${(c.end - c.start).toFixed(1)}s`).join(', ')
  );

  const client3060 = analyzeVideoWithClientEngine(120.0, 'Demo Video', '30-60');
  assert(
    client3060.every((c) => (c.end - c.start) >= 29.9 && (c.end - c.start) <= 60.1),
    'Client vision engine clips strictly respect 30-60s range',
    client3060.map((c) => `${(c.end - c.start).toFixed(1)}s`).join(', ')
  );

  const clientExact = analyzeVideoWithClientEngine(120.0, 'Demo Video', 25.0);
  assert(
    clientExact.every((c) => Math.abs((c.end - c.start) - 25.0) <= 0.5),
    'Client vision engine clips strictly respect exact 25.0s target',
    clientExact.map((c) => `${(c.end - c.start).toFixed(1)}s`).join(', ')
  );

  // -------------------------------------------------------------
  // Test 9: FFmpeg Trimming & FFprobe Duration Verification
  // -------------------------------------------------------------
  console.log('\n--- Test 9: FFmpeg Frame-Accurate -t Render & FFprobe Verification ---');

  const fixturePath = path.resolve('tests', 'fixtures', 'source_with_audio.mp4');
  if (fs.existsSync(fixturePath)) {
    const testOutPath = path.resolve('.temp_media', `test_exact_duration_${Date.now()}.mp4`);
    if (!fs.existsSync('.temp_media')) fs.mkdirSync('.temp_media', { recursive: true });

    // Render a clip with requested 2.50s duration
    const renderResult = await ffmpegServiceInstance.renderClippedVideo({
      inputVideoPath: fixturePath,
      outputVideoPath: testOutPath,
      startTime: 1.0,
      endTime: 3.5,
      exactDuration: 2.5,
      toleranceSeconds: 0.25,
      aspectRatio: '9:16',
      keepAudio: true,
    });

    assert(renderResult.verified, 'FFprobe verified exported MP4 clip');
    assert(
      Math.abs(renderResult.duration - 2.5) <= 0.25,
      'Exported MP4 duration matches requested 2.5s within frame tolerance',
      `Actual probed duration: ${renderResult.duration.toFixed(2)}s`
    );

    // Test rejection of non-compliant duration in verifyExportedMp4
    let rejected = false;
    try {
      await ffmpegServiceInstance.verifyExportedMp4(testOutPath, {
        minDuration: 5.0, // Expected minimum 5s on a 2.5s clip should fail!
        toleranceSeconds: 0.2,
      });
    } catch (e: any) {
      rejected = true;
      assert(true, 'verifyExportedMp4 correctly rejects clip outside requested duration range', e.message);
    }
    assert(rejected, 'Verification rejection threw expected descriptive error');

    // Clean up test file
    try { fs.unlinkSync(testOutPath); } catch {}
  } else {
    console.log('  [SKIP] Skipping live FFmpeg render (fixture not found)');
  }

  // -------------------------------------------------------------
  // Final Benchmark Summary
  // -------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`   DURATION CONSTRAINT BENCHMARK: ${passedTests}/${totalTests} PASSED (100%)`);
  console.log('======================================================================\n');
}

runDurationConstraintTests().catch((err) => {
  console.error('\nDuration Constraint Test Suite Failed:', err);
  process.exit(1);
});
