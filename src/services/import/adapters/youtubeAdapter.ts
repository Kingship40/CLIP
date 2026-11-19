/**
 * YouTube Platform Adapter.
 * Supports standard watch URLs, YouTube Shorts, youtu.be shortlinks, embeds, live URLs,
 * and mobile/attribution share formats.
 * Implements strict security, metadata retrieval with network timeout, and platform access compliance.
 */

import {
  PlatformAdapter,
  AdapterValidationResult,
  StandardizedPlatformMetadata,
  AccessibilityCheckResult,
  AuthorizedMediaResult,
  NormalizedProcessingMedia,
} from './types';
import { validateUrlSecurity } from '../securityValidator';

const YOUTUBE_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'gaming.youtube.com',
  'youtu.be',
  'www.youtu.be',
];

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export class YouTubeAdapter implements PlatformAdapter {
  public readonly id = 'youtube' as const;
  public readonly displayName = 'YouTube';
  public readonly supportedDomains = YOUTUBE_DOMAINS;

  public detectPlatform(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      return YOUTUBE_DOMAINS.some(
        (domain) => host === domain || host.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  public extractVideoId(url: string): { videoId: string | null; isShorts: boolean; isLive: boolean } {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      const pathname = parsed.pathname;

      // 1. YouTube Shorts: /shorts/{id}
      if (pathname.startsWith('/shorts/')) {
        const parts = pathname.split('/').filter(Boolean);
        const candidate = parts[1]?.split(/[?&#/]/)[0] || null;
        if (candidate && VIDEO_ID_REGEX.test(candidate)) {
          return { videoId: candidate, isShorts: true, isLive: false };
        }
      }

      // 2. YouTube Live: /live/{id}
      if (pathname.startsWith('/live/')) {
        const parts = pathname.split('/').filter(Boolean);
        const candidate = parts[1]?.split(/[?&#/]/)[0] || null;
        if (candidate && VIDEO_ID_REGEX.test(candidate)) {
          return { videoId: candidate, isShorts: false, isLive: true };
        }
      }

      // 3. Shortlink: youtu.be/{id}
      if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
        const candidate = pathname.slice(1).split(/[?&#/]/)[0] || null;
        if (candidate && VIDEO_ID_REGEX.test(candidate)) {
          return { videoId: candidate, isShorts: false, isLive: false };
        }
      }

      // 4. Standard Watch: /watch?v={id} or /watch/?v={id}
      if (pathname === '/watch' || pathname === '/watch/') {
        const candidate = parsed.searchParams.get('v');
        if (candidate && VIDEO_ID_REGEX.test(candidate)) {
          return { videoId: candidate, isShorts: false, isLive: false };
        }
      }

      // 5. Embed & Legacy v: /embed/{id} or /v/{id}
      if (pathname.startsWith('/embed/') || pathname.startsWith('/v/')) {
        const parts = pathname.split('/').filter(Boolean);
        const candidate = parts[1]?.split(/[?&#/]/)[0] || null;
        if (candidate && VIDEO_ID_REGEX.test(candidate)) {
          return { videoId: candidate, isShorts: false, isLive: false };
        }
      }

      // 6. Attribution link: /attribution_link?u=/watch?v={id}
      if (pathname.startsWith('/attribution_link')) {
        const u = parsed.searchParams.get('u');
        if (u) {
          const innerMatch = u.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
          if (innerMatch && innerMatch[1]) {
            return { videoId: innerMatch[1], isShorts: false, isLive: false };
          }
        }
      }

      return { videoId: null, isShorts: false, isLive: false };
    } catch {
      return { videoId: null, isShorts: false, isLive: false };
    }
  }

  public validateUrl(url: string): AdapterValidationResult {
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return { isValid: false, platform: 'unsupported', error: sec.error };
    }

    if (!this.detectPlatform(url)) {
      return { isValid: false, platform: 'unsupported', error: 'Not a recognized YouTube address.' };
    }

    const { videoId, isShorts } = this.extractVideoId(url);
    if (!videoId) {
      return {
        isValid: false,
        platform: isShorts ? 'youtube_shorts' : 'youtube',
        error: 'Invalid or missing YouTube video ID. Please check the URL format.',
      };
    }

    const normalizedUrl = isShorts
      ? `https://www.youtube.com/shorts/${videoId}`
      : `https://www.youtube.com/watch?v=${videoId}`;

    return {
      isValid: true,
      platform: isShorts ? 'youtube_shorts' : 'youtube',
      normalizedUrl,
      videoId,
    };
  }

  public async getMetadata(url: string, signal?: AbortSignal): Promise<StandardizedPlatformMetadata> {
    const val = this.validateUrl(url);
    if (!val.isValid || !val.videoId) {
      throw new Error(val.error || 'Failed to validate YouTube URL.');
    }

    const videoId = val.videoId;
    const isShorts = val.platform === 'youtube_shorts';
    const cleanUrl = val.normalizedUrl || url;

    let title = isShorts ? `YouTube Short #${videoId}` : `YouTube Video (${videoId})`;
    let author = 'YouTube Creator';
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // Timeout-protected network request to prevent hanging indefinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const onUserAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onUserAbort, { once: true });

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`;
      const response = await fetch(oembedUrl, { signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
        if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
      }
    } catch (e: any) {
      if (signal?.aborted) {
        throw new Error('Metadata extraction cancelled by user.');
      }
      // Non-fatal: default fallback values used
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onUserAbort);
    }

    const duration = isShorts ? 45.0 : 180.0;
    const aspectRatio = isShorts ? '9:16' : '16:9';
    const width = isShorts ? 1080 : 1920;
    const height = isShorts ? 1920 : 1080;

    return {
      platformName: isShorts ? 'YouTube Shorts' : 'YouTube',
      platformId: isShorts ? 'youtube_shorts' : 'youtube',
      videoId,
      title,
      author,
      thumbnailUrl,
      duration,
      width,
      height,
      aspectRatio,
      sourceUrl: cleanUrl,
      isShort: isShorts,
      hasMediaAccess: false,
      accessibilityStatus: 'metadata_only',
      processingEligibility: false,
      requiresCreatorUpload: true,
      capability: 'metadata_only',
      mediaAccessMessage:
        "YouTube links provide rich metadata and embed preview. Direct media extraction is restricted by YouTube's API Terms of Service. To clip this video, please upload the source video file directly or use an authorized direct media stream.",
    };
  }

  public async checkAccessibility(_url: string): Promise<AccessibilityCheckResult> {
    return {
      isAccessible: false,
      status: 'metadata_only',
      requiresAuth: true,
      authType: 'oauth',
      message:
        "Direct stream extraction without authorized creator export is prohibited by YouTube API policies. Local file upload is recommended.",
      supportsDirectClipping: false,
    };
  }

  public async retrieveAuthorizedMedia(
    _url: string,
    _options?: any
  ): Promise<AuthorizedMediaResult> {
    return {
      hasMediaBytes: false,
      format: 'mp4',
      isDirectDownloadAuthorized: false,
      requiresCreatorUpload: true,
      message:
        "YouTube stream requires authorized creator export or user video file upload.",
    };
  }

  public async prepareForProcessing(
    media: AuthorizedMediaResult,
    _options?: any
  ): Promise<NormalizedProcessingMedia> {
    if (!media.hasMediaBytes && !media.filePath) {
      throw new Error(
        "YouTube video cannot be processed without source media file. Please upload the creator's video file."
      );
    }

    return {
      readyForClipping: true,
      mediaPath: media.filePath,
      width: 1920,
      height: 1080,
      duration: media.duration || 60,
      hasAudio: true,
      videoCodec: 'h264',
      audioCodec: 'aac',
      normalizedFormat: 'mp4',
    };
  }
}

export const youtubeAdapterInstance = new YouTubeAdapter();
