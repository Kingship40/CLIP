/**
 * Instagram Platform Adapter.
 * Supports Instagram Reels (/reel/{id}), posts (/p/{id}), and IGTV (/tv/{id}).
 * Respects Meta Platform Terms and reports explicit platform capabilities.
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

const INSTAGRAM_DOMAINS = [
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
  'instagr.am',
];

const INSTAGRAM_ID_REGEX = /^[a-zA-Z0-9_-]{5,35}$/;

export class InstagramAdapter implements PlatformAdapter {
  public readonly id = 'instagram' as const;
  public readonly displayName = 'Instagram';
  public readonly supportedDomains = INSTAGRAM_DOMAINS;

  public detectPlatform(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      return INSTAGRAM_DOMAINS.some(
        (domain) => host === domain || host.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  public extractPostId(url: string): { postId: string | null; isReel: boolean } {
    try {
      const parsed = new URL(url.trim());
      const pathname = parsed.pathname;

      let isReel = pathname.includes('/reel/') || pathname.includes('/reels/');
      const match = pathname.match(/\/(reel|p|tv|reels)\/([a-zA-Z0-9_-]+)/);
      if (match && match[2] && INSTAGRAM_ID_REGEX.test(match[2])) {
        return { postId: match[2], isReel: isReel || match[1] === 'reel' || match[1] === 'reels' };
      }

      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && ['reel', 'p', 'tv', 'reels'].includes(parts[0])) {
        return { postId: parts[1], isReel: parts[0] === 'reel' || parts[0] === 'reels' };
      }

      return { postId: null, isReel };
    } catch {
      return { postId: null, isReel: false };
    }
  }

  public validateUrl(url: string): AdapterValidationResult {
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return { isValid: false, platform: 'unsupported', error: sec.error };
    }

    if (!this.detectPlatform(url)) {
      return { isValid: false, platform: 'unsupported', error: 'Not a recognized Instagram address.' };
    }

    const { postId, isReel } = this.extractPostId(url);
    if (!postId) {
      return {
        isValid: false,
        platform: 'instagram',
        error: 'Invalid or missing Instagram Reel/Post code. Please check the URL format.',
      };
    }

    const normalizedUrl = `https://www.instagram.com/${isReel ? 'reel' : 'p'}/${postId}/`;

    return {
      isValid: true,
      platform: 'instagram',
      normalizedUrl,
      videoId: postId,
    };
  }

  public async getMetadata(url: string, _signal?: AbortSignal): Promise<StandardizedPlatformMetadata> {
    const val = this.validateUrl(url);
    if (!val.isValid || !val.videoId) {
      throw new Error(val.error || 'Failed to validate Instagram URL.');
    }

    const { postId, isReel } = this.extractPostId(url);
    const cleanUrl = val.normalizedUrl || url;

    const title = isReel ? `Instagram Reel #${postId}` : `Instagram Post (${postId})`;
    const author = 'Instagram Creator';
    const thumbnailUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
    const duration = isReel ? 30.0 : 60.0;
    const aspectRatio = isReel ? '9:16' : '1:1';

    return {
      platformName: 'Instagram',
      platformId: 'instagram',
      videoId: postId,
      title,
      author,
      thumbnailUrl,
      duration,
      width: isReel ? 1080 : 1080,
      height: isReel ? 1920 : 1080,
      aspectRatio,
      sourceUrl: cleanUrl,
      isShort: isReel,
      hasMediaAccess: false,
      accessibilityStatus: 'metadata_only',
      processingEligibility: false,
      requiresCreatorUpload: true,
      capability: 'metadata_only',
      mediaAccessMessage:
        "Meta Platform Terms restrict automated media stream downloads without authorized Graph API credentials. To clip this Instagram Reel, please upload the original creator video file directly.",
    };
  }

  public async checkAccessibility(_url: string): Promise<AccessibilityCheckResult> {
    return {
      isAccessible: false,
      status: 'metadata_only',
      requiresAuth: true,
      authType: 'oauth',
      message:
        "Instagram Graph API authentication and Business Account verification are required to access media objects.",
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
        "Instagram stream requires creator video file upload or authorized Meta Developer access.",
    };
  }

  public async prepareForProcessing(
    media: AuthorizedMediaResult,
    _options?: any
  ): Promise<NormalizedProcessingMedia> {
    if (!media.hasMediaBytes && !media.filePath) {
      throw new Error(
        "Instagram video requires source media file. Please upload the video file directly."
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

export const instagramAdapterInstance = new InstagramAdapter();
