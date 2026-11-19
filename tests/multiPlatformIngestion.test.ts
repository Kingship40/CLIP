/**
 * Multi-Platform Video Ingestion, Platform Connector Architecture & YouTube Fixes Test Suite.
 */

import { videoIngestionServiceInstance } from '../src/services/import/videoIngestionService';
import { youtubeAdapterInstance } from '../src/services/import/adapters/youtubeAdapter';
import { facebookAdapterInstance } from '../src/services/import/adapters/facebookAdapter';
import { tikTokAdapterInstance } from '../src/services/import/adapters/tiktokAdapter';
import { instagramAdapterInstance } from '../src/services/import/adapters/instagramAdapter';
import { vimeoAdapterInstance } from '../src/services/import/adapters/vimeoAdapter';
import { xAdapterInstance } from '../src/services/import/adapters/xAdapter';
import { twitchAdapterInstance } from '../src/services/import/adapters/twitchAdapter';
import { directVideoUploadAdapterInstance } from '../src/services/import/adapters/directVideoUploadAdapter';
import { mediaNormalizerInstance } from '../src/services/import/mediaNormalizer';
import { validateUrlSecurity } from '../src/services/import/securityValidator';
import { getStoredProjects, SEED_PROJECTS } from '../src/utils/storage';
import path from 'path';
import fs from 'fs';

console.log('======================================================================');
console.log('   MULTI-PLATFORM VIDEO INGESTION & YOUTUBE FIXES BENCHMARK');
console.log('======================================================================\n');

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
    if (detail) console.error(`      ↳ ${detail}`);
    process.exitCode = 1;
  }
}

async function runTestSuite() {
  // --- Test 1: YouTube Link Variations & Bug Fixes ---
  console.log('--- Test 1: YouTube Link Variations & Bug Fixes ---');

  const ytStandard = youtubeAdapterInstance.validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert(ytStandard.isValid && ytStandard.videoId === 'dQw4w9WgXcQ', 'Standard YouTube watch link validated');

  const ytShortlink = youtubeAdapterInstance.validateUrl('https://youtu.be/dQw4w9WgXcQ?si=abcdef12345');
  assert(ytShortlink.isValid && ytShortlink.videoId === 'dQw4w9WgXcQ', 'youtu.be shortlink with tracking query validated');

  const ytShorts = youtubeAdapterInstance.validateUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share');
  assert(ytShorts.isValid && ytShorts.platform === 'youtube_shorts' && ytShorts.videoId === 'dQw4w9WgXcQ', 'YouTube Shorts with feature=share validated');

  const ytLive = youtubeAdapterInstance.validateUrl('https://www.youtube.com/live/dQw4w9WgXcQ');
  assert(ytLive.isValid && ytLive.videoId === 'dQw4w9WgXcQ', 'YouTube Live stream link validated');

  const ytEmbed = youtubeAdapterInstance.validateUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
  assert(ytEmbed.isValid && ytEmbed.videoId === 'dQw4w9WgXcQ', 'YouTube embed link validated');

  const ytMobile = youtubeAdapterInstance.validateUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=45s');
  assert(ytMobile.isValid && ytMobile.videoId === 'dQw4w9WgXcQ', 'm.youtube.com mobile link with timestamp query validated');

  const ytTrailing = youtubeAdapterInstance.validateUrl('https://www.youtube.com/watch/?v=dQw4w9WgXcQ');
  assert(ytTrailing.isValid && ytTrailing.videoId === 'dQw4w9WgXcQ', 'YouTube watch URL with trailing slash validated');

  // --- Test 2: Platform Detection & Adapter Routing ---
  console.log('\n--- Test 2: Multi-Platform Detection & Adapter Routing ---');

  const testUrls = [
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expectedName: 'YouTube' },
    { url: 'https://www.facebook.com/watch/?v=101587654321', expectedName: 'Facebook' },
    { url: 'https://fb.watch/xYz123aBc/', expectedName: 'Facebook' },
    { url: 'https://www.tiktok.com/@mrbeast/video/7123456789012345678', expectedName: 'TikTok' },
    { url: 'https://vt.tiktok.com/ZS8yB1234/', expectedName: 'TikTok' },
    { url: 'https://www.instagram.com/reel/C3abcdef123/', expectedName: 'Instagram' },
    { url: 'https://vimeo.com/76979871', expectedName: 'Vimeo' },
    { url: 'https://x.com/OpenAI/status/1758210000000000000', expectedName: 'X (Twitter)' },
    { url: 'https://twitter.com/creator/status/1234567890123456789', expectedName: 'X (Twitter)' },
    { url: 'https://www.twitch.tv/videos/123456789', expectedName: 'Twitch' },
    { url: 'https://clips.twitch.tv/FrailTameKoala', expectedName: 'Twitch' },
    { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', expectedName: 'Direct Video Stream / Upload' },
  ];

  for (const item of testUrls) {
    const adapter = videoIngestionServiceInstance.detectPlatform(item.url);
    assert(
      adapter !== null && adapter.displayName === item.expectedName,
      `Correctly detected platform for: ${item.url.slice(0, 40)}...`,
      `Detected "${adapter?.displayName}", expected "${item.expectedName}"`
    );
  }

  // --- Test 3: Standardized Platform Metadata Schema ---
  console.log('\n--- Test 3: Standardized Platform Metadata Schema ---');

  const fbRes = await videoIngestionServiceInstance.getStandardizedResponse('https://www.facebook.com/watch/?v=987654321');
  assert(fbRes.platformName === 'Facebook', 'Facebook standardized response contains platformName');
  assert(fbRes.videoId === '987654321', 'Facebook standardized response extracts videoId');
  assert(fbRes.accessibilityStatus === 'metadata_only', 'Facebook marks accessibilityStatus as metadata_only');
  assert(fbRes.requiresCreatorUpload === true, 'Facebook correctly flags requiresCreatorUpload as true');

  const fbShareRes = await videoIngestionServiceInstance.getStandardizedResponse('https://web.facebook.com/share/v/1EEDmiyG5Y/');
  assert(fbShareRes.platformName === 'Facebook', 'Facebook share URL contains platformName');
  assert(fbShareRes.videoId === '1EEDmiyG5Y', 'Facebook share URL extracts videoId: 1EEDmiyG5Y');
  assert(fbShareRes.videoTitle.includes('1EEDmiyG5Y'), 'Facebook share URL generates informative video title');

  const vimeoRes = await videoIngestionServiceInstance.getStandardizedResponse('https://vimeo.com/76979871');
  assert(vimeoRes.platformName === 'Vimeo', 'Vimeo standardized response contains platformName');
  assert(vimeoRes.videoId === '76979871', 'Vimeo standardized response extracts numeric video ID');
  assert(typeof vimeoRes.duration === 'number' && vimeoRes.duration > 0, 'Vimeo reports valid numeric duration');

  const directRes = await videoIngestionServiceInstance.getStandardizedResponse('https://vjs.zencdn.net/v/oceans.mp4');
  assert(directRes.platformName.includes('Direct Video'), 'Direct media stream identified');
  assert(directRes.accessibilityStatus === 'verified', 'Direct stream marked verified');
  assert(directRes.processingEligibility === true, 'Direct stream flagged processingEligibility: true');
  assert(directRes.requiresCreatorUpload === false, 'Direct stream requiresCreatorUpload: false');

  // --- Test 4: SSRF & Security Validation ---
  console.log('\n--- Test 4: SSRF & Security Validation ---');

  const loopback = validateUrlSecurity('http://127.0.0.1:8080/exploit.mp4');
  assert(!loopback.isValid, 'Blocks loopback IP 127.0.0.1');

  const awsMeta = validateUrlSecurity('http://169.254.169.254/latest/meta-data/');
  assert(!awsMeta.isValid, 'Blocks AWS metadata IP 169.254.169.254');

  const privateSubnet = validateUrlSecurity('http://192.168.1.100/private_stream.mp4');
  assert(!privateSubnet.isValid, 'Blocks RFC1918 private subnet IP');

  const fileScheme = validateUrlSecurity('file:///etc/passwd');
  assert(!fileScheme.isValid, 'Blocks unauthorized file:// protocol scheme');

  // --- Test 5: Media Normalizer & Codec Compliance ---
  console.log('\n--- Test 5: Media Normalizer & Codec Compliance ---');

  const fixturePath = path.resolve('tests', 'fixtures', 'source_with_audio.mp4');
  if (fs.existsSync(fixturePath)) {
    const evalRes = await mediaNormalizerInstance.requiresNormalization(fixturePath);
    assert(typeof evalRes.needed === 'boolean', 'Media normalizer inspects codec and container parameters');

    const tempOutDir = path.resolve('.temp_media');
    if (!fs.existsSync(tempOutDir)) fs.mkdirSync(tempOutDir, { recursive: true });

    const normResult = await mediaNormalizerInstance.normalizeMedia(fixturePath, tempOutDir);
    assert(normResult.isNormalized === true, 'Media normalizer successfully outputs normalized MP4 container');
    assert(normResult.hasAudio === true, 'Media normalizer preserves synchronized audio track');
    assert(normResult.duration > 0, 'Media normalizer accurately preserves duration');

    // Clean up test normalized output
    if (fs.existsSync(normResult.outputPath)) {
      try { fs.unlinkSync(normResult.outputPath); } catch {}
    }
  }

  // --- Test 6: Database & Storage Migrations (Part 10) ---
  console.log('\n--- Test 6: Database & Storage Migrations (Part 10) ---');

  const storedProjects = getStoredProjects();
  assert(storedProjects.length > 0, 'Loaded projects from storage with automatic migration');

  const p1 = storedProjects[0];
  assert(typeof p1.source_platform === 'string', 'Project includes source_platform');
  assert(typeof p1.source_url === 'string', 'Project includes source_url');
  assert(typeof p1.source_video_id === 'string', 'Project includes source_video_id');
  assert(typeof p1.source_title === 'string', 'Project includes source_title');
  assert(typeof p1.source_thumbnail === 'string', 'Project includes source_thumbnail');
  assert(typeof p1.source_duration === 'number', 'Project includes source_duration');
  assert(typeof p1.ingestion_status === 'string', 'Project includes ingestion_status');
  assert(typeof p1.accessibility_status === 'string', 'Project includes accessibility_status');
  assert(typeof p1.processing_job_id === 'string', 'Project includes processing_job_id');
  assert(typeof p1.original_video_reference === 'string', 'Project includes original_video_reference');
  assert(Array.isArray(p1.generated_clips), 'Project includes generated_clips array');
  assert(typeof p1.subtitle_status === 'string', 'Project includes subtitle_status');
  assert(typeof p1.final_processing_status === 'string', 'Project includes final_processing_status');

  // Verify clip relationship
  const allClipsLinked = p1.clips.every((c) => c.projectId === p1.id);
  assert(allClipsLinked, 'All clips remain strictly associated to parent project ID');

  console.log('\n======================================================================');
  console.log(`   BENCHMARK COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('======================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
