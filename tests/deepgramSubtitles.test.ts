import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  convertDeepgramToSubtitles,
  verifyDeepgramApiKey,
  DeepgramResponse,
  DeepgramService,
} from '../src/services/deepgramService';
import { transcriptionServiceInstance } from '../src/services/transcriptionService';
import { DEFAULT_SETTINGS } from '../src/utils/storage';
import { CaptionSettings } from '../src/types';

describe('Deepgram Subtitle Integration & Custom Subtitle Styles Benchmark', () => {
  // Test 1: Deepgram Response Conversion into Video Subtitle Segments
  it('converts Deepgram word tokens into rhythmic 3-5 word subtitle segments with word timestamps', () => {
    const mockDeepgramResponse: DeepgramResponse = {
      metadata: {
        duration: 12.5,
        channels: 1,
        models: ['nova-2'],
      },
      results: {
        channels: [
          {
            alternatives: [
              {
                transcript:
                  'The biggest secret to scaling organic video in 2026 is hook retention.',
                confidence: 0.98,
                words: [
                  { word: 'the', start: 0.1, end: 0.3, confidence: 0.99, punctuated_word: 'The' },
                  { word: 'biggest', start: 0.32, end: 0.75, confidence: 0.98, punctuated_word: 'biggest' },
                  { word: 'secret', start: 0.78, end: 1.15, confidence: 0.97, punctuated_word: 'secret' },
                  { word: 'to', start: 1.18, end: 1.3, confidence: 0.99, punctuated_word: 'to' },
                  { word: 'scaling', start: 1.32, end: 1.8, confidence: 0.96, punctuated_word: 'scaling' },
                  { word: 'organic', start: 1.85, end: 2.25, confidence: 0.95, punctuated_word: 'organic' },
                  { word: 'video', start: 2.28, end: 2.65, confidence: 0.98, punctuated_word: 'video' },
                  { word: 'in', start: 2.7, end: 2.85, confidence: 0.99, punctuated_word: 'in' },
                  { word: '2026', start: 2.88, end: 3.4, confidence: 0.97, punctuated_word: '2026' },
                  { word: 'is', start: 3.45, end: 3.65, confidence: 0.99, punctuated_word: 'is' },
                  { word: 'hook', start: 3.7, end: 4.1, confidence: 0.96, punctuated_word: 'hook' },
                  { word: 'retention', start: 4.15, end: 4.8, confidence: 0.98, punctuated_word: 'retention.' },
                ],
              },
            ],
          },
        ],
      },
    };

    const result = convertDeepgramToSubtitles(mockDeepgramResponse, {
      minWordsPerSegment: 3,
      maxWordsPerSegment: 5,
    });

    assert.ok(result.subtitles.length >= 2, 'Should partition words into multiple short subtitle segments');
    assert.strictEqual(result.fullText, 'The biggest secret to scaling organic video in 2026 is hook retention.');

    // Check first segment
    const first = result.subtitles[0];
    assert.ok(first.start >= 0.1, 'First segment start should match first word');
    assert.ok(first.end > first.start, 'Segment end must be greater than start');
    assert.ok(first.words && first.words.length >= 3, 'Segment must have word-level timings');
    assert.ok(first.highlightWords && first.highlightWords.length > 0, 'Must have auto-extracted highlight words');

    // Check word-level timing precision
    const word0 = first.words![0];
    assert.strictEqual(word0.word, 'The');
    assert.strictEqual(word0.start, 0.1);
    assert.strictEqual(word0.end, 0.3);
  });

  // Test 2: Multi-Speaker Diarization from Deepgram Utterances
  it('correctly maps Deepgram speaker diarization (Speaker 1, Speaker 2) to subtitle segments', () => {
    const mockDiarizedResponse: DeepgramResponse = {
      results: {
        utterances: [
          {
            start: 1.0,
            end: 4.5,
            confidence: 0.97,
            channel: 0,
            speaker: 0,
            transcript: 'What is the number one growth bottleneck you see?',
            words: [
              { word: 'what', start: 1.0, end: 1.25, confidence: 0.98, punctuated_word: 'What', speaker: 0 },
              { word: 'is', start: 1.28, end: 1.45, confidence: 0.99, punctuated_word: 'is', speaker: 0 },
              { word: 'the', start: 1.48, end: 1.6, confidence: 0.99, punctuated_word: 'the', speaker: 0 },
              { word: 'number', start: 1.62, end: 1.95, confidence: 0.97, punctuated_word: 'number', speaker: 0 },
              { word: 'one', start: 2.0, end: 2.3, confidence: 0.98, punctuated_word: 'one', speaker: 0 },
              { word: 'growth', start: 2.35, end: 2.75, confidence: 0.95, punctuated_word: 'growth', speaker: 0 },
              { word: 'bottleneck', start: 2.8, end: 3.4, confidence: 0.96, punctuated_word: 'bottleneck', speaker: 0 },
              { word: 'you', start: 3.45, end: 3.65, confidence: 0.99, punctuated_word: 'you', speaker: 0 },
              { word: 'see', start: 3.7, end: 4.4, confidence: 0.98, punctuated_word: 'see?', speaker: 0 },
            ],
          },
          {
            start: 5.0,
            end: 8.2,
            confidence: 0.96,
            channel: 0,
            speaker: 1,
            transcript: 'Founders focus on quantity instead of high impact hooks.',
            words: [
              { word: 'founders', start: 5.0, end: 5.5, confidence: 0.97, punctuated_word: 'Founders', speaker: 1 },
              { word: 'focus', start: 5.55, end: 5.9, confidence: 0.98, punctuated_word: 'focus', speaker: 1 },
              { word: 'on', start: 5.92, end: 6.1, confidence: 0.99, punctuated_word: 'on', speaker: 1 },
              { word: 'quantity', start: 6.15, end: 6.7, confidence: 0.96, punctuated_word: 'quantity', speaker: 1 },
              { word: 'instead', start: 6.75, end: 7.15, confidence: 0.98, punctuated_word: 'instead', speaker: 1 },
              { word: 'of', start: 7.18, end: 7.3, confidence: 0.99, punctuated_word: 'of', speaker: 1 },
              { word: 'high', start: 7.35, end: 7.55, confidence: 0.97, punctuated_word: 'high', speaker: 1 },
              { word: 'impact', start: 7.6, end: 7.9, confidence: 0.96, punctuated_word: 'impact', speaker: 1 },
              { word: 'hooks', start: 7.95, end: 8.2, confidence: 0.98, punctuated_word: 'hooks.', speaker: 1 },
            ],
          },
        ],
      },
    };

    const result = convertDeepgramToSubtitles(mockDiarizedResponse);
    assert.strictEqual(result.speakers.length, 2, 'Should identify exactly 2 speakers');
    assert.ok(result.speakers.includes('Speaker 1'));
    assert.ok(result.speakers.includes('Speaker 2'));

    // Verify first speaker assigned to first segment
    assert.strictEqual(result.subtitles[0].speaker, 'Speaker 1');
    // Verify second speaker assigned to later segment
    const lastSeg = result.subtitles[result.subtitles.length - 1];
    assert.strictEqual(lastSeg.speaker, 'Speaker 2');
  });

  // Test 3: API Key Verification & Format Validation
  it('validates Deepgram API key format and reports meaningful error for empty or invalid keys', async () => {
    const emptyResult = await verifyDeepgramApiKey('');
    assert.strictEqual(emptyResult.success, false);
    assert.ok(emptyResult.message.includes('valid Deepgram API Key'));

    const shortResult = await verifyDeepgramApiKey('too-short');
    assert.strictEqual(shortResult.success, false);
    assert.ok(shortResult.message.includes('too short'));

    const validFormatResult = await verifyDeepgramApiKey('48c0bf8244a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5');
    assert.strictEqual(typeof validFormatResult.success, 'boolean');
  });

  // Test 4: Deepgram Service Singleton Management
  it('manages Deepgram API key and model persistence via DeepgramService', () => {
    const service = DeepgramService.getInstance();
    service.setApiKey('test_deepgram_api_key_1234567890abcdef', 'nova-2-meeting');

    assert.strictEqual(service.getApiKey(), 'test_deepgram_api_key_1234567890abcdef');
    assert.strictEqual(service.getModel(), 'nova-2-meeting');
    assert.strictEqual(service.isConfigured(), true);

    service.setApiKey('');
    assert.strictEqual(service.isConfigured(), false);
  });

  // Test 5: Subtitle Style Customization Schema & Defaults
  it('supports comprehensive subtitle customization including fonts, text cases, and colors', () => {
    const customCaptionSettings: CaptionSettings = {
      enabled: true,
      preset: 'boxed',
      fontFamily: 'Impact',
      fontSize: 'lg',
      textCase: 'uppercase',
      highlightColor: '#06B6D4',
      textColor: '#FFFFFF',
      activeWordBgColor: '#06B6D4',
      activeWordTextColor: '#000000',
      outlineWidth: 'thick',
      outlineColor: '#000000',
      position: 'middle',
      displayMode: 'boxed-word',
      showOpeningTitle: true,
      openingTitle: 'Crucial Insight',
    };

    assert.strictEqual(customCaptionSettings.preset, 'boxed');
    assert.strictEqual(customCaptionSettings.fontFamily, 'Impact');
    assert.strictEqual(customCaptionSettings.highlightColor, '#06B6D4');
    assert.strictEqual(customCaptionSettings.outlineWidth, 'thick');
    assert.strictEqual(customCaptionSettings.textCase, 'uppercase');
    assert.strictEqual(customCaptionSettings.position, 'middle');
  });

  // Test 6: Default Settings Include Deepgram & Subtitle Defaults
  it('verifies DEFAULT_SETTINGS contains deepgramSettings and subtitleDefaults', () => {
    assert.ok(DEFAULT_SETTINGS.deepgramSettings, 'DEFAULT_SETTINGS must have deepgramSettings');
    assert.strictEqual(DEFAULT_SETTINGS.deepgramSettings.model, 'nova-2');
    assert.strictEqual(DEFAULT_SETTINGS.deepgramSettings.smartFormat, true);
    assert.strictEqual(DEFAULT_SETTINGS.deepgramSettings.punctuate, true);
    assert.strictEqual(DEFAULT_SETTINGS.deepgramSettings.diarize, true);

    assert.ok(DEFAULT_SETTINGS.subtitleDefaults, 'DEFAULT_SETTINGS must have subtitleDefaults');
    assert.strictEqual(DEFAULT_SETTINGS.subtitleDefaults.preset, 'hormozi');
    assert.strictEqual(DEFAULT_SETTINGS.subtitleDefaults.fontFamily, 'Montserrat');
  });
});
