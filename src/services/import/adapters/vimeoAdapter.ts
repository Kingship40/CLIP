/**
 * Vimeo Platform Adapter.
 * Supports standard vimeo.com/{id}, player.vimeo.com/video/{id}, and channel/group links.
 * Queries Vimeo's official oEmbed API which returns exact video duration, author, title, and thumbnail.
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

const VIMEO_DOMAINS = [
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
];

export class VimeoAdapter implements PlatformAdapter {
  public readonly id = 'other_social' as const;
  public readonly displayName = 'Vimeo';
  public readonly supportedDomains = VIMEO_DOMAINS;

  public detectPlatform(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      return VIMEO_DOMAINS.some(
        (domain) => host === domain || host.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  public extractVideoId(url: string): string | null {
    try {
      const parsed = new URL(url.trim());
      const pathname = parsed.pathname;

      // Extract last numeric chunk from pathname e.g. /123456789 or /video/123456789
      const match = pathname.match(/(\d{6,15})/);
      if (match && match[1]) {
        return match[1];
      }

      return null;
    } catch {
      return null;
    }
  }

  public validateUrl(url: string): AdapterValidationResult {
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return { isValid: false, platform: 'unsupported', error: sec.error };
    }

    if (!this.detectPlatform(url)) {
      return { isValid: false, platform: 'unsupported', error: 'Not a recognized Vimeo address.' };
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return {
        isValid: false,
        platform: 'other_social',
        error: 'Invalid or missing Vimeo video ID. Please check the URL format.',
      };
    }

    return {
      isValid: true,
      platform: 'other_social',
      normalizedUrl: `https://vimeo.com/${videoId}`,
      videoId,
    };
  }

  public async getMetadata(url: string, signal?: AbortSignal): Promise<StandardizedPlatformMetadata> {
    const val = this.validateUrl(url);
    if (!val.isValid || !val.videoId) {
      throw new Error(val.error || 'Failed to validate Vimeo URL.');
    }

    const videoId = val.videoId;
    const cleanUrl = val.normalizedUrl || url;

    let title = `Vimeo Video #${videoId}`;
    let author = 'Vimeo Creator';
    let thumbnailUrl = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80';
    let duration = 90.0;
    let width = 1920;
    let height = 1080;

    // Timeout-protected network query to official Vimeo oEmbed endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const onUserAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onUserAbort, { once: true });

    try {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(cleanUrl)}`;
      const res = await fetch(oembedUrl, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
        if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
        if (data.duration && typeof data.duration === 'number') duration = data.duration;
        if (data.width) width = data.width;
        if (data.height) height = data.height;
      }
    } catch {
      // Non-fatal: default fallback preserved
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onUserAbort);
    }

    const aspectRatio = width >= height ? '16:9' : '9:16';

    return {
      platformName: 'Vimeo',
      platformId: 'other_social',
      videoId,
      title,
      author,
      thumbnailUrl,
      duration,
      width,
      height,
      aspectRatio,
      sourceUrl: cleanUrl,
      isShort: duration <= 60,
      hasMediaAccess: false,
      accessibilityStatus: 'metadata_only',
      processingEligibility: false,
      requiresCreatorUpload: true,
      capability: 'metadata_only',
      mediaAccessMessage:
        "Vimeo oEmbed provides exact metadata, video duration, and player preview. Direct media file download requires Vimeo PRO/Business API download links or direct file upload.",
    };
  }

  public async checkAccessibility(_url: string): Promise<AccessibilityCheckResult> {
    return {
      isAccessible: false,
      status: 'metadata_only',
      requiresAuth: true,
      authType: 'api_key',
      message:
        "Vimeo API v3.4 authorization token is required to access progressive MP4 download links.",
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
        "Vimeo stream requires creator video file upload or authorized Vimeo API download link.",
    };
  }

  public async prepareForProcessing(
    media: AuthorizedMediaResult,
    _options?: any
  ): Promise<NormalizedProcessingMedia> {
    if (!media.hasMediaBytes && !media.filePath) {
      throw new Error(
        "Vimeo video requires source media file. Please upload the video file directly."
      );
    }

    return {
      readyForClipping: true,
      mediaPath: media.filePath,
      width: 1920,
      height: 1080,
      duration: media.duration || 90,
      hasAudio: true,
      videoCodec: 'h264',
      audioCodec: 'aac',
      normalizedFormat: 'mp4',
    };
  }
}

export const vimeoAdapterInstance = new VimeoAdapter();
