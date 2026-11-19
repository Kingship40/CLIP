/**
 * X (Twitter) Platform Adapter.
 * Supports x.com/{user}/status/{id}, twitter.com/{user}/status/{id}, and mobile links.
 * Queries Twitter Publish oEmbed API and reports X platform capabilities.
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

const X_DOMAINS = [
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
];

export class XAdapter implements PlatformAdapter {
  public readonly id = 'other_social' as const;
  public readonly displayName = 'X (Twitter)';
  public readonly supportedDomains = X_DOMAINS;

  public detectPlatform(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      return X_DOMAINS.some(
        (domain) => host === domain || host.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  public extractStatusId(url: string): { statusId: string | null; username: string | null } {
    try {
      const parsed = new URL(url.trim());
      const pathname = parsed.pathname;

      const match = pathname.match(/\/(?:i|[a-zA-Z0-9_]+)\/status\/(\d+)/);
      if (match && match[1]) {
        const usernameMatch = pathname.match(/^\/([a-zA-Z0-9_]+)\/status/);
        return {
          statusId: match[1],
          username: usernameMatch ? usernameMatch[1] : null,
        };
      }

      return { statusId: null, username: null };
    } catch {
      return { statusId: null, username: null };
    }
  }

  public validateUrl(url: string): AdapterValidationResult {
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return { isValid: false, platform: 'unsupported', error: sec.error };
    }

    if (!this.detectPlatform(url)) {
      return { isValid: false, platform: 'unsupported', error: 'Not a recognized X (Twitter) address.' };
    }

    const { statusId } = this.extractStatusId(url);
    if (!statusId) {
      return {
        isValid: false,
        platform: 'other_social',
        error: 'Invalid or missing X / Twitter status ID. Please check the URL format.',
      };
    }

    return {
      isValid: true,
      platform: 'other_social',
      normalizedUrl: url.trim(),
      videoId: statusId,
    };
  }

  public async getMetadata(url: string, signal?: AbortSignal): Promise<StandardizedPlatformMetadata> {
    const val = this.validateUrl(url);
    if (!val.isValid || !val.videoId) {
      throw new Error(val.error || 'Failed to validate X / Twitter URL.');
    }

    const { statusId, username } = this.extractStatusId(url);
    const cleanUrl = val.normalizedUrl || url;

    let title = username ? `Post by @${username}` : `X Post #${statusId}`;
    let author = username ? `@${username}` : 'X User';
    const thumbnailUrl = 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=600&auto=format&fit=crop&q=80';

    // Query publish.twitter.com/oembed with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const onUserAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onUserAbort, { once: true });

    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
      const res = await fetch(oembedUrl, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        if (data.author_name) author = data.author_name;
        if (data.html) {
          const stripped = data.html.replace(/<[^>]*>?/gm, '').trim();
          if (stripped) title = stripped.slice(0, 60);
        }
      }
    } catch {
      // Non-fatal: default fallback preserved
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onUserAbort);
    }

    return {
      platformName: 'X (Twitter)',
      platformId: 'other_social',
      videoId: statusId,
      title,
      author,
      thumbnailUrl,
      duration: 45.0,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      sourceUrl: cleanUrl,
      isShort: false,
      hasMediaAccess: false,
      accessibilityStatus: 'metadata_only',
      processingEligibility: false,
      requiresCreatorUpload: true,
      capability: 'metadata_only',
      mediaAccessMessage:
        "X (Twitter) Developer API v2 Pro access is required to programmatically retrieve video streams. To process this video clip, please upload the source MP4 file directly.",
    };
  }

  public async checkAccessibility(_url: string): Promise<AccessibilityCheckResult> {
    return {
      isAccessible: false,
      status: 'metadata_only',
      requiresAuth: true,
      authType: 'api_key',
      message:
        "X Developer API v2 Bearer Token is required for media payload access.",
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
        "X video stream requires creator file upload or X API v2 authorization.",
    };
  }

  public async prepareForProcessing(
    media: AuthorizedMediaResult,
    _options?: any
  ): Promise<NormalizedProcessingMedia> {
    if (!media.hasMediaBytes && !media.filePath) {
      throw new Error(
        "X video requires source media file. Please upload the video file directly."
      );
    }

    return {
      readyForClipping: true,
      mediaPath: media.filePath,
      width: 1920,
      height: 1080,
      duration: media.duration || 45,
      hasAudio: true,
      videoCodec: 'h264',
      audioCodec: 'aac',
      normalizedFormat: 'mp4',
    };
  }
}

export const xAdapterInstance = new XAdapter();
