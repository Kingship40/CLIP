/**
 * AUTOMATIC SUBTITLES ON VIDEO CLIPPING TEST SUITE
 * Tests the end-to-end automated subtitle pipeline ensuring:
 * 1. Automatic transcription and subtitle inclusion on clip creation
 * 2. Strict relative timestamp synchronization ($t_{clip} = t - t_{start}$)
 * 3. Short phrase chunking (3–7 words per segment)
 * 4. Multi-speaker detection and turn labeling
 * 5. Language detection and verbatim word preservation
 * 6. High-impact keyword extraction for kinetic typography
 * 7. ASS subtitle generation for FFmpeg hardcoding (karaoke \k tags, custom fonts, outlines)
 * 8. Clean export to SRT and WebVTT without timestamp drift
 * 9. Silent / non-speech video handling without errors
 */

import {
  syncTranscriptToClip,
  chunkSubtitleIntoShortPhrases,
  identifySpeakers,
  detectLanguageFromText,
  extractSignificantWords,
  segmentAudioSpeechAcoustic,
} from '../src/services/transcriptionService';
import { generateAssSubtitleFile, hexToAssColor } from '../src/services/captionBurner';
import { exportToSRT, exportToVTT } from '../src/utils/videoHelpers';
import { viralIntelligenceEngineInstance } from '../src/services/intelligence/viralIntelligenceEngine';
import { SubtitleSegment, CaptionSettings, VideoMoment } from '../src/types';

function assert(condition: boolean, testName: string, detail?: string) {
  if (!condition) {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`      ↳ Error: ${detail}`);
    throw new Error(`Assertion failed: ${testName}${detail ? ` (${detail})` : ''}`);
  }
  console.log(`  ✓ [PASS] ${testName}`);
  if (detail) console.log(`      ↳ ${detail}`);
}

async function runAutomaticSubtitleTestSuite() {
  console.log('======================================================================');
  console.log('   AUTOMATIC SUBTITLES ON VIDEO CLIPPING TEST SUITE');
  console.log('======================================================================\n');

  // -------------------------------------------------------------
  // Test 1: Relative Timestamp Synchronization ($t_{clip} = t - t_{start}$)
  // -------------------------------------------------------------
  console.log('--- Test 1: Subtitle Timestamp Recalculation Relative to Extracted Clip ---');

  const sourceMasterTranscript: SubtitleSegment[] = [
    { id: 'master_1', start: 10.0, end: 12.5, text: 'Before our selected moment begins.' },
    {
      id: 'master_2',
      start: 25.0,
      end: 28.5,
      text: 'The secret to viral growth is curiosity-driven retention hooks.',
      words: [
        { word: 'The', start: 25.0, end: 25.3 },
        { word: 'secret', start: 25.3, end: 25.8 },
        { word: 'to', start: 25.8, end: 26.0 },
        { word: 'viral', start: 26.0, end: 26.5 },
        { word: 'growth', start: 26.5, end: 27.0 },
        { word: 'is', start: 27.0, end: 27.2 },
        { word: 'curiosity-driven', start: 27.2, end: 27.9 },
        { word: 'retention', start: 27.9, end: 28.2 },
        { word: 'hooks.', start: 28.2, end: 28.5 },
      ],
    },
    {
      id: 'master_3',
      start: 29.0,
      end: 32.0,
      text: 'When you front-load the unexpected revelation immediately.',
      words: [
        { word: 'When', start: 29.0, end: 29.3 },
        { word: 'you', start: 29.3, end: 29.5 },
        { word: 'front-load', start: 29.5, end: 30.1 },
        { word: 'the', start: 30.1, end: 30.3 },
        { word: 'unexpected', start: 30.3, end: 31.0 },
        { word: 'revelation', start: 31.0, end: 31.6 },
        { word: 'immediately.', start: 31.6, end: 32.0 },
      ],
    },
    { id: 'master_4', start: 50.0, end: 55.0, text: 'Way after the clip finishes.' },
  ];

  // Clip window: 24.0s to 34.0s (Duration: 10.0s)
  const clipStart = 24.0;
  const clipEnd = 34.0;
  const syncedClipSubs = syncTranscriptToClip(sourceMasterTranscript, clipStart, clipEnd);

  assert(syncedClipSubs.length >= 2, 'Extracts all spoken segments within the clipping window');
  assert(!syncedClipSubs.some((s) => s.text.includes('Before our selected')), 'Filters out speech occurring before clip start');
  assert(!syncedClipSubs.some((s) => s.text.includes('Way after')), 'Filters out speech occurring after clip end');

  // Verify first segment relative timing: original 25.0s - 24.0s = 1.0s
  const firstSeg = syncedClipSubs[0];
  assert(
    Math.abs(firstSeg.start - 1.0) < 0.1,
    'Recalculates first segment start to exactly 1.0s relative to clip start',
    `Start: ${firstSeg.start}s`
  );
  assert(
    firstSeg.end <= 10.0,
    'Clamps segment end within clip boundary (<= 10.0s)',
    `End: ${firstSeg.end}s`
  );

  // Verify word-level timing offset: word 'viral' originally 26.0s - 24.0s = 2.0s
  if (firstSeg.words && firstSeg.words.length > 0) {
    const viralWord = firstSeg.words.find((w) => w.word.toLowerCase().includes('viral'));
    if (viralWord) {
      assert(
        Math.abs(viralWord.start - 2.0) < 0.15,
        'Recalculates word-level timestamps relative to clip start ($26.0 - 24.0 = 2.0s$)',
        `Word start: ${viralWord.start}s`
      );
    }
  }

  // -------------------------------------------------------------
  // Test 2: Natural Short Phrase Chunking (3–7 Words per Segment)
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Short Phrase Chunking (3–7 Words for Social Media Readability) ---');

  const longSentence: SubtitleSegment = {
    id: 'long_1',
    start: 0.0,
    end: 8.0,
    text: 'Most people fail at content marketing because they never deliver a compelling conclusion or solve the problem they set up in the title.',
  };

  const chunks = chunkSubtitleIntoShortPhrases(longSentence, 3, 6);
  assert(chunks.length >= 3, 'Splits a long 22-word sentence into multiple concise phrases', `Created ${chunks.length} chunks`);

  chunks.forEach((chunk, idx) => {
    const wordCount = chunk.text.trim().split(/\s+/).length;
    assert(
      wordCount >= 2 && wordCount <= 7,
      `Chunk #${idx + 1} contains 2–7 words (${wordCount} words): "${chunk.text}"`
    );
    assert(chunk.start < chunk.end, `Chunk #${idx + 1} has valid progressive timing: ${chunk.start}s – ${chunk.end}s`);
  });

  // Verify chronological chaining
  assert(chunks[0].start === 0.0, 'First chunk starts at sentence onset (0.0s)');
  assert(chunks[chunks.length - 1].end === 8.0, 'Final chunk ends at sentence offset (8.0s)');

  // -------------------------------------------------------------
  // Test 3: Multi-Speaker Diarization and Speaker Labeling
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Multi-Speaker Turn Diarization & Labeling ---');

  const conversationalSubs: SubtitleSegment[] = [
    { id: 'c1', start: 1.0, end: 3.5, text: 'Alex: How did you scale the channel to one million subscribers?' },
    { id: 'c2', start: 4.8, end: 7.2, text: 'We focused 100% on average view duration and click-through rates.' },
    { id: 'c3', start: 8.6, end: 10.0, text: 'Was that really the only metric that mattered?' },
    { id: 'c4', start: 10.8, end: 13.0, text: 'Yes, because YouTube only promotes videos that keep viewers on the platform.' },
  ];

  const speakerIdentified = identifySpeakers(conversationalSubs);
  assert(speakerIdentified[0].speaker === 'Alex', 'Detects explicit speaker tag "Alex"');
  assert(speakerIdentified[0].text === 'How did you scale the channel to one million subscribers?', 'Cleans explicit speaker tag from spoken text');
  assert(speakerIdentified[1].speaker !== undefined, 'Assigns speaker label to respondent');
  assert(speakerIdentified[2].speaker === 'Alex' || speakerIdentified[2].speaker === 'Speaker 1', 'Recognizes conversational question turn-taking');

  // -------------------------------------------------------------
  // Test 4: Language Detection & Original Word Preservation
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Language Detection & Word Preservation ---');

  const englishSample = 'We built an automated pipeline for video editing and distribution.';
  const spanishSample = 'Construimos una plataforma automatizada para recortar y editar videos virales.';
  const frenchSample = 'Nous avons développé un système intelligent de montage vidéo pour les créateurs.';

  assert(detectLanguageFromText(englishSample) === 'en', 'Detects English language correctly (en)');
  assert(detectLanguageFromText(spanishSample) === 'es', 'Detects Spanish language correctly (es)');
  assert(detectLanguageFromText(frenchSample) === 'fr', 'Detects French language correctly (fr)');

  // -------------------------------------------------------------
  // Test 5: Automatic Subtitle Inclusion During AI Moment Conversion
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Automatic Subtitles Generated on Clip Creation (No User Action) ---');

  const testMoments = [
    {
      id: 'moment_alpha',
      title: 'The Breakthrough Revelation',
      rationale: 'Peak viral disclosure moment with high retention potential',
      startTime: 15.0,
      endTime: 35.0,
      duration: 20.0,
      overallScore: 92,
      hookSummary: 'Here is the exact growth hack we used to get 10M views',
      scoreBreakdown: {
        hookStrength: 95,
        emotionalIntellectual: 90,
        clarityContext: 90,
        payoffValue: 92,
        narrativeCompleteness: 91,
        shareability: 93,
        avQuality: 92,
        boundaryQuality: 90,
      },
      category: 'explanations',
      subtitles: [
        { id: 'm_s1', start: 16.0, end: 20.0, text: 'Here is the exact growth hack we used to get 10M views.' },
        { id: 'm_s2', start: 21.0, end: 26.0, text: 'Notice how the first three seconds hook the curiosity gap.' },
        { id: 'm_s3', start: 27.0, end: 33.0, text: 'Without this payoff, your retention graph drops by forty percent.' },
      ],
    } as any,
  ];

  const generatedClips = viralIntelligenceEngineInstance.convertMomentsToClips(testMoments, 'proj_test_subtitles');
  assert(generatedClips.length === 1, 'Converted AI viral moment into project clip');

  const generatedClip = generatedClips[0];
  assert(generatedClip.captionSettings.enabled === true, 'Captions are enabled automatically by default (captionSettings.enabled = true)');
  assert(generatedClip.subtitles.length > 0, 'Clip automatically includes populated subtitles array');

  // Verify timestamps inside clip are strictly clip-relative [0, 20.0]
  assert(
    generatedClip.subtitles[0].start >= 0.0 && generatedClip.subtitles[0].start < 20.0,
    'Subtitles are strictly relative to clip timeline ($0.0s \\dots 20.0s$)',
    `First subtitle start: ${generatedClip.subtitles[0].start}s`
  );
  assert(
    generatedClip.subtitles[generatedClip.subtitles.length - 1].end <= 20.0,
    'Last subtitle ends before clip boundary (<= 20.0s)',
    `Last subtitle end: ${generatedClip.subtitles[generatedClip.subtitles.length - 1].end}s`
  );

  // -------------------------------------------------------------
  // Test 6: ASS Subtitle Generator for FFmpeg (Fonts, Outlines, Karaoke \k)
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Advanced SubStation Alpha (.ass) Generation for FFmpeg Burning ---');

  const customSettings: CaptionSettings = {
    enabled: true,
    preset: 'karaoke',
    fontSize: 'lg',
    position: 'bottom',
    fontFamily: 'Montserrat',
    highlightColor: '#00F5FF',
    textColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 'thick',
    displayMode: 'word-highlight',
    speakerLabels: true,
    showOpeningTitle: false,
  };

  const assSubtitles: SubtitleSegment[] = [
    {
      id: 'sub_karaoke_1',
      start: 0.5,
      end: 3.0,
      text: 'Stop wasting hours editing video manually.',
      speaker: 'Alex',
      words: [
        { word: 'Stop', start: 0.5, end: 0.9 },
        { word: 'wasting', start: 0.9, end: 1.4 },
        { word: 'hours', start: 1.4, end: 1.8 },
        { word: 'editing', start: 1.8, end: 2.3 },
        { word: 'video', start: 2.3, end: 2.6 },
        { word: 'manually.', start: 2.6, end: 3.0 },
      ],
      highlightWords: ['wasting', 'manually'],
    },
  ];

  const assContent = generateAssSubtitleFile(assSubtitles, customSettings, 720, 1280);
  assert(assContent.includes('[Script Info]'), 'Generates valid ASS Script Info block');
  assert(assContent.includes('[V4+ Styles]'), 'Generates valid ASS V4+ Styles section');
  assert(assContent.includes('Montserrat'), 'Applies custom font family "Montserrat" in ASS style');
  assert(assContent.includes('Outline, Shadow'), 'Configures ASS outline and shadow');
  assert(assContent.includes('{\\k'), 'Generates kinetic karaoke timing tags {\\k...} for word-by-word highlight');
  assert(assContent.includes('[Alex]'), 'Includes speaker label badge [Alex]');

  // -------------------------------------------------------------
  // Test 7: Clean SubRip (.SRT) & WebVTT (.VTT) Export
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Export to Standalone .SRT and .VTT Files ---');

  const srtExport = exportToSRT(assSubtitles, 0);
  assert(srtExport.includes('1'), 'SRT includes sequence counter');
  assert(srtExport.includes('00:00:00,500 --> 00:00:03,000'), 'SRT formats standard comma timestamps (00:00:00,500)');
  assert(srtExport.includes('Stop wasting hours editing video manually.'), 'SRT preserves exact subtitle dialogue');

  const vttExport = exportToVTT(assSubtitles, 0);
  assert(vttExport.startsWith('WEBVTT'), 'VTT begins with WEBVTT specification header');
  assert(vttExport.includes('00:00:00.500 --> 00:00:03.000'), 'VTT formats standard dot timestamps (00:00:00.500)');
  assert(vttExport.includes('<v Alex>'), 'VTT embeds standard WebVTT speaker voice tags <v Alex>');

  // -------------------------------------------------------------
  // Test 8: Non-Speech & Silent Video Handling
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Non-Speech / Silent Audio Handling ---');

  const sampleRate = 16000;
  const silentChannel = new Float32Array(sampleRate * 3.0); // 3.0 seconds of absolute zero silence

  const silentResult = await segmentAudioSpeechAcoustic(
    { sampleRate, channelData: [silentChannel] },
    3.0
  );

  assert(silentResult.hasSpeech === false, 'Correctly flags video as non-speech (hasSpeech: false)');
  assert(silentResult.subtitles.length === 0, 'Produces 0 false-positive subtitles for silent source');

  console.log('\n======================================================================');
  console.log('   BENCHMARK COMPLETE: ALL AUTOMATIC SUBTITLE TESTS PASSED (100%)');
  console.log('======================================================================\n');
}

runAutomaticSubtitleTestSuite().catch((err) => {
  console.error('\n❌ Automatic Subtitles Test Suite Failed:', err);
  process.exit(1);
});
