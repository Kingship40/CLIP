/**
 * Facebook Video Platform Adapter.
 * Supports standard watch URLs, Facebook Reels, user video posts, mobile watch links, and fb.watch shortlinks.
 * Complies with Meta Platform Terms regarding automated media extraction.
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

const FACEBOOK_DOMAINS = [
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'fb.watch',
  'www.fb.watch',
];

export class FacebookAdapter implements PlatformAdapter {
  public readonly id = 'other_social' as const;
  public readonly displayName = 'Facebook';
  public readonly supportedDomains = FACEBOOK_DOMAINS;

  public detectPlatform(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      return FACEBOOK_DOMAINS.some(
        (domain) => host === domain || host.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  public extractVideoId(url: string): { videoId: string | null; isReel: boolean } {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      const pathname = parsed.pathname;

      // 1. fb.watch/{id}
      if (host === 'fb.watch' || host.endsWith('.fb.watch')) {
        const parts = pathname.split('/').filter(Boolean);
        if (parts[0]) {
          return { videoId: parts[0], isReel: false };
        }
      }

      // 2. Facebook modern share shortlinks: /share/v/{id}/, /share/r/{id}/, /share/p/{id}/, /share/{id}/
      if (pathname.includes('/share/')) {
        const match = pathname.match(/\/share\/([vrp])\/([0-9a-zA-Z_-]+)/);
        if (match && match[2]) {
          return { videoId: match[2], isReel: match[1] === 'r' };
        }
        const parts = pathname.split('/').filter(Boolean);
        const shareIdx = parts.indexOf('share');
        if (shareIdx !== -1 && parts[shareIdx + 1]) {
          const sub = parts[shareIdx + 1];
          const id = parts[shareIdx + 2] || sub;
          return { videoId: id, isReel: sub === 'r' };
        }
      }

      // 3. /watch?v={id} or /watch/?v={id} or /watch/live/?v={id}
      if (pathname.includes('/watch')) {
        const v = parsed.searchParams.get('v');
        if (v) return { videoId: v, isReel: false };
      }

      // 4. Facebook Reels: /reel/{id} or /reels/{id}
      if (pathname.includes('/reel/') || pathname.includes('/reels/')) {
        const match = pathname.match(/\/reels?\/([0-9a-zA-Z_-]+)/);
        if (match && match[1]) {
          return { videoId: match[1], isReel: true };
        }
      }

      // 5. /videos/{id} or /{user}/videos/{id}
      if (pathname.includes('/videos/')) {
        const match = pathname.match(/\/videos\/([0-9a-zA-Z_-]+)/);
        if (match && match[1]) {
          return { videoId: match[1], isReel: false };
        }
      }

      // 6. Generic post /{user}/posts/{id}
      if (pathname.includes('/posts/')) {
        const match = pathname.match(/\/posts\/([0-9a-zA-Z_-]+)/);
        if (match && match[1]) {
          return { videoId: match[1], isReel: false };
        }
      }

      // 7. General fallback: extract last meaningful slug from pathname
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const candidate = segments[segments.length - 1];
        if (candidate && candidate.length >= 2) {
          return { videoId: candidate, isReel: pathname.includes('reel') };
        }
      }

      return { videoId: null, isReel: false };
    } catch {
      return { videoId: null, isReel: false };
    }
  }

  public validateUrl(url: string): AdapterValidationResult {
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return { isValid: false, platform: 'unsupported', error: sec.error };
    }

    if (!this.detectPlatform(url)) {
      return { isValid: false, platform: 'unsupported', error: 'Not a recognized Facebook video URL.' };
    }

    const { videoId } = this.extractVideoId(url);
    if (!videoId) {
      return {
        isValid: false,
        platform: 'other_social',
        error: 'Could not extract Facebook video identifier. Please check the URL format.',
      };
    }

    return {
      isValid: true,
      platform: 'other_social',
      normalizedUrl: url.trim(),
      videoId,
    };
  }

  public async getMetadata(url: string, _signal?: AbortSignal): Promise<StandardizedPlatformMetadata> {
    const val = this.validateUrl(url);
    if (!val.isValid || !val.videoId) {
      throw new Error(val.error || 'Failed to validate Facebook URL.');
    }

    const { videoId, isReel } = this.extractVideoId(url);
    const title = isReel ? `Facebook Reel #${videoId}` : `Facebook Video (${videoId})`;
    const author = 'Facebook Creator';
    const thumbnailUrl = 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80';
    const duration = isReel ? 45.0 : 120.0;
    const aspectRatio = isReel ? '9:16' : '16:9';

    return {
      platformName: 'Facebook',
      platformId: 'other_social',
      videoId,
      title,
      author,
      thumbnailUrl,
      duration,
      width: isReel ? 1080 : 1920,
      height: isReel ? 1920 : 1080,
      aspectRatio,
      sourceUrl: val.normalizedUrl || url,
      isShort: isReel,
      hasMediaAccess: false,
      accessibilityStatus: 'metadata_only',
      processingEligibility: false,
      requiresCreatorUpload: true,
      capability: 'metadata_only',
      mediaAccessMessage:
        "Meta Platform Terms require authenticated Graph API access or Page owner authorization to retrieve raw video streams. To process this Facebook video, please upload the creator video file directly.",
    };
  }

  public async checkAccessibility(_url: string): Promise<AccessibilityCheckResult> {
    return {
      isAccessible: false,
      status: 'metadata_only',
      requiresAuth: true,
      authType: 'oauth',
      message:
        "Meta Graph API authentication and Page Read permissions are required to download Facebook video assets directly.",
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
        "Facebook video stream requires creator file upload or Meta Graph API authorization.",
    };
  }

  public async prepareForProcessing(
    media: AuthorizedMediaResult,
    _options?: any
  ): Promise<NormalizedProcessingMedia> {
    if (!media.hasMediaBytes && !media.filePath) {
      throw new Error(
        "Facebook video requires source media file. Please upload the video file directly."
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

export const facebookAdapterInstance = new FacebookAdapter();
