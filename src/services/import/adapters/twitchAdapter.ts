/**
 * Twitch Platform Adapter.
 * Supports Twitch VODs (/videos/{id}) and Twitch Clips (clips.twitch.tv/{id} or /{user}/clip/{id}).
 * Integrates with Twitch Helix API specifications and reports capability.
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

const TWITCH_DOMAINS = [
  'twitch.tv',
  'www.twitch.tv',
  'm.twitch.tv',
  'clips.twitch.tv',
];

export class TwitchAdapter implements PlatformAdapter {
  public readonly id = 'other_social' as const;
  public readonly displayName = 'Twitch';
  public readonly supportedDomains = TWITCH_DOMAINS;

  public detectPlatform(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      return TWITCH_DOMAINS.some(
        (domain) => host === domain || host.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  public extractVideoOrClipId(url: string): { id: string | null; isClip: boolean; channel?: string } {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      const pathname = parsed.pathname;

      // 1. clips.twitch.tv/{id}
      if (host === 'clips.twitch.tv' || host.endsWith('.clips.twitch.tv')) {
        const parts = pathname.split('/').filter(Boolean);
        if (parts[0]) {
          return { id: parts[0], isClip: true };
        }
      }

      // 2. twitch.tv/{channel}/clip/{id}
      if (pathname.includes('/clip/')) {
        const match = pathname.match(/\/([a-zA-Z0-9_]+)\/clip\/([a-zA-Z0-9_-]+)/);
        if (match && match[2]) {
          return { id: match[2], isClip: true, channel: match[1] };
        }
      }

      // 3. twitch.tv/videos/{id}
      if (pathname.includes('/videos/')) {
        const match = pathname.match(/\/videos\/(\d+)/);
        if (match && match[1]) {
          return { id: match[1], isClip: false };
        }
      }

      return { id: null, isClip: false };
    } catch {
      return { id: null, isClip: false };
    }
  }

  public validateUrl(url: string): AdapterValidationResult {
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return { isValid: false, platform: 'unsupported', error: sec.error };
    }

    if (!this.detectPlatform(url)) {
      return { isValid: false, platform: 'unsupported', error: 'Not a recognized Twitch URL.' };
    }

    const { id } = this.extractVideoOrClipId(url);
    if (!id) {
      return {
        isValid: false,
        platform: 'other_social',
        error: 'Invalid or missing Twitch Video/Clip ID. Please check the URL format.',
      };
    }

    return {
      isValid: true,
      platform: 'other_social',
      normalizedUrl: url.trim(),
      videoId: id,
    };
  }

  public async getMetadata(url: string, _signal?: AbortSignal): Promise<StandardizedPlatformMetadata> {
    const val = this.validateUrl(url);
    if (!val.isValid || !val.videoId) {
      throw new Error(val.error || 'Failed to validate Twitch URL.');
    }

    const { id, isClip, channel } = this.extractVideoOrClipId(url);
    const title = isClip ? `Twitch Clip #${id}` : `Twitch Broadcast VOD #${id}`;
    const author = channel ? channel : 'Twitch Streamer';
    const thumbnailUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80';
    const duration = isClip ? 30.0 : 3600.0;

    return {
      platformName: 'Twitch',
      platformId: 'other_social',
      videoId: id,
      title,
      author,
      thumbnailUrl,
      duration,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      sourceUrl: val.normalizedUrl || url,
      isShort: isClip,
      hasMediaAccess: false,
      accessibilityStatus: 'metadata_only',
      processingEligibility: false,
      requiresCreatorUpload: true,
      capability: 'metadata_only',
      mediaAccessMessage:
        "Twitch Helix API requires an authorized Client ID and OAuth App Access Token to download stream VODs. To process this Twitch recording, please upload your video file directly.",
    };
  }

  public async checkAccessibility(_url: string): Promise<AccessibilityCheckResult> {
    return {
      isAccessible: false,
      status: 'metadata_only',
      requiresAuth: true,
      authType: 'oauth',
      message:
        "Twitch Helix Client-ID and App Access Token are required for stream extraction.",
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
        "Twitch broadcast stream requires streamer file upload or Twitch Helix API authorization.",
    };
  }

  public async prepareForProcessing(
    media: AuthorizedMediaResult,
    _options?: any
  ): Promise<NormalizedProcessingMedia> {
    if (!media.hasMediaBytes && !media.filePath) {
      throw new Error(
        "Twitch video requires source media file. Please upload the video file directly."
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

export const twitchAdapterInstance = new TwitchAdapter();
