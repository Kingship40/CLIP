/**
 * TikTok Platform Adapter.
 * Supports standard @username/video/ID, shortlinks (vt.tiktok.com, vm.tiktok.com), and mobile share links.
 * Queries TikTok oEmbed API for verified author, title, and thumbnail.
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

const TIKTOK_DOMAINS = [
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vt.tiktok.com',
  'vm.tiktok.com',
];

export class TikTokAdapter implements PlatformAdapter {
  public readonly id = 'tiktok' as const;
  public readonly displayName = 'TikTok';
  public readonly supportedDomains = TIKTOK_DOMAINS;

  public detectPlatform(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      return TIKTOK_DOMAINS.some(
        (domain) => host === domain || host.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  public extractVideoInfo(url: string): { videoId: string | null; username: string | null } {
    try {
      const parsed = new URL(url.trim());
      const pathname = parsed.pathname;

      // Pattern 1: /@username/video/1234567890123456789
      const matchStandard = pathname.match(/\/@([a-zA-Z0-9_.-]+)\/video\/(\d+)/);
      if (matchStandard) {
        return { username: matchStandard[1], videoId: matchStandard[2] };
      }

      // Pattern 2: Shortlink /t/XYZ or vt.tiktok.com/XYZ
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        return { username: null, videoId: lastPart.split('?')[0] };
      }

      return { videoId: null, username: null };
    } catch {
      return { videoId: null, username: null };
    }
  }

  public validateUrl(url: string): AdapterValidationResult {
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return { isValid: false, platform: 'unsupported', error: sec.error };
    }

    if (!this.detectPlatform(url)) {
      return { isValid: false, platform: 'unsupported', error: 'Not a recognized TikTok address.' };
    }

    const { videoId } = this.extractVideoInfo(url);
    if (!videoId) {
      return {
        isValid: false,
        platform: 'tiktok',
        error: 'Invalid or missing TikTok video ID. Please check the URL format.',
      };
    }

    return {
      isValid: true,
      platform: 'tiktok',
      normalizedUrl: url.trim(),
      videoId,
    };
  }

  public async getMetadata(url: string, signal?: AbortSignal): Promise<StandardizedPlatformMetadata> {
    const val = this.validateUrl(url);
    if (!val.isValid || !val.videoId) {
      throw new Error(val.error || 'Failed to validate TikTok URL.');
    }

    const { videoId, username } = this.extractVideoInfo(url);
    const cleanUrl = val.normalizedUrl || url;

    let title = username ? `TikTok by @${username}` : `TikTok Video #${videoId}`;
    let author = username ? `@${username}` : 'TikTok Creator';
    let thumbnailUrl = 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=600&auto=format&fit=crop&q=80';

    // Query official TikTok oEmbed with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const onUserAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onUserAbort, { once: true });

    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
      const res = await fetch(oembedUrl, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
        if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
      }
    } catch {
      // Non-fatal: fallback metadata preserved
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onUserAbort);
    }

    return {
      platformName: 'TikTok',
      platformId: 'tiktok',
      videoId,
      title,
      author,
      thumbnailUrl,
      duration: 30.0,
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      sourceUrl: cleanUrl,
      isShort: true,
      hasMediaAccess: false,
      accessibilityStatus: 'metadata_only',
      processingEligibility: false,
      requiresCreatorUpload: true,
      capability: 'metadata_only',
      mediaAccessMessage:
        "TikTok public links deliver metadata and web embed preview only. Raw video stream extraction is restricted by TikTok API policies without authorized Login Kit / Video Kit OAuth. Please upload the creator's video file directly.",
    };
  }

  public async checkAccessibility(_url: string): Promise<AccessibilityCheckResult> {
    return {
      isAccessible: false,
      status: 'metadata_only',
      requiresAuth: true,
      authType: 'oauth',
      message:
        "TikTok terms prohibit scraping raw video bytes. Authorized creator file upload is required for AI clipping.",
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
        "TikTok video stream requires creator file upload or TikTok Developer Partner authorization.",
    };
  }

  public async prepareForProcessing(
    media: AuthorizedMediaResult,
    _options?: any
  ): Promise<NormalizedProcessingMedia> {
    if (!media.hasMediaBytes && !media.filePath) {
      throw new Error(
        "TikTok video requires source media file. Please upload the video file directly."
      );
    }

    return {
      readyForClipping: true,
      mediaPath: media.filePath,
      width: 1080,
      height: 1920,
      duration: media.duration || 30,
      hasAudio: true,
      videoCodec: 'h264',
      audioCodec: 'aac',
      normalizedFormat: 'mp4',
    };
  }
}

export const tikTokAdapterInstance = new TikTokAdapter();
