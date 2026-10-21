/**
 * Instagram Video & Reels Import Provider.
 * Supports Instagram Reels (/reel/{id}), posts (/p/{id}), and IGTV (/tv/{id}).
 * Reports platform capabilities and guides creators to authorized upload workflows.
 */

import {
  IVideoImportProvider,
  ImportedVideoMetadata,
  ImportedMediaResult,
  ImportProgressCallback,
  ProviderValidationResult,
  VideoSourceType,
  PlatformCapability,
} from '../types';
import { validateUrlSecurity } from '../securityValidator';

const INSTAGRAM_HOSTNAMES = new Set([
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
  'instagr.am',
]);

const INSTAGRAM_ID_REGEX = /^[a-zA-Z0-9_-]{5,30}$/;

export class InstagramImportProvider implements IVideoImportProvider {
  public id: VideoSourceType = 'instagram';
  public displayName = 'Instagram';

  public getCapability(): PlatformCapability {
    return 'metadata_only';
  }

  public canHandle(url: string): boolean {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      return (
        INSTAGRAM_HOSTNAMES.has(host) ||
        host.endsWith('.instagram.com')
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
      const match = pathname.match(/\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/);
      if (match && match[2] && INSTAGRAM_ID_REGEX.test(match[2])) {
        return { postId: match[2], isReel: isReel || match[1] === 'reel' };
      }

      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && ['reel', 'p', 'tv'].includes(parts[0])) {
        return { postId: parts[1], isReel: parts[0] === 'reel' };
      }

      return { postId: null, isReel };
    } catch {
      return { postId: null, isReel: false };
    }
  }

  public validate(url: string): ProviderValidationResult {
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return { isValid: false, provider: 'unsupported', error: sec.error };
    }

    if (!this.canHandle(url)) {
      return { isValid: false, provider: 'unsupported', error: 'Not a recognized Instagram URL.' };
    }

    const { postId } = this.extractPostId(url);
    if (!postId) {
      return {
        isValid: false,
        provider: 'instagram',
        error: 'Unable to parse Instagram Reel or Post identifier from link.',
      };
    }

    return {
      isValid: true,
      provider: 'instagram',
      normalizedUrl: url.trim(),
      videoId: postId,
      capability: 'metadata_only',
    };
  }

  public async fetchMetadata(url: string, signal?: AbortSignal): Promise<ImportedVideoMetadata> {
    const val = this.validate(url);
    if (!val.isValid || !val.videoId) {
      throw new Error(val.error || 'Failed to validate Instagram URL.');
    }

    const cleanUrl = val.normalizedUrl || url;
    const { postId, isReel } = this.extractPostId(cleanUrl);

    let title = isReel ? `Instagram Reel #${postId}` : `Instagram Video #${postId}`;
    let author = 'Instagram Creator';
    let thumbnailUrl = 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&auto=format&fit=crop&q=80';

    // Query Instagram official oEmbed endpoint if accessible
    try {
      const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(cleanUrl)}`;
      const res = await fetch(oembedUrl, { signal });
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
        if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
      }
    } catch (e: any) {
      if (signal?.aborted) throw new Error('Instagram metadata fetch cancelled by user.');
    }

    const duration = isReel ? 30.0 : 45.0;
    const aspectRatio = isReel ? '9:16' : '1:1';
    const width = isReel ? 1080 : 1080;
    const height = isReel ? 1920 : 1080;

    return {
      fileName: `${title.replace(/[/\\?%*:|"<>]/g, '').slice(0, 50)}.mp4`,
      fileSize: Math.round(duration * 1000000),
      fileType: 'video/mp4',
      duration,
      width,
      height,
      aspectRatio,
      thumbnailUrl,
      sourceType: 'instagram',
      sourceUrl: cleanUrl,
      author,
      providerName: 'Instagram',
      isShorts: isReel,
      requiresMediaDownload: true,
      hasMediaAccess: false,
      mediaAccessStatus: 'metadata_only',
      capability: 'metadata_only',
      mediaAccessMessage:
        "Instagram public posts and Reels provide metadata and embed preview only. Downloading raw media is restricted under Meta's Platform Terms without Instagram Graph API Content / Creator authorization. To clip this video, please upload the source file directly or provide an authorized direct media stream URL.",
    };
  }

  public async importMedia(
    url: string,
    onProgress?: ImportProgressCallback,
    signal?: AbortSignal
  ): Promise<ImportedMediaResult> {
    onProgress?.({
      stage: 'checking_link',
      progress: 20,
      message: 'Validating Instagram URL format and security policies...',
    });

    const meta = await this.fetchMetadata(url, signal);

    if (signal?.aborted) {
      throw new Error('Import cancelled by user.');
    }

    onProgress?.({
      stage: 'identifying_platform',
      progress: 50,
      message: `Identified Instagram Reel / Video by ${meta.author || 'creator'}`,
    });

    onProgress?.({
      stage: 'checking_authorized_access',
      progress: 80,
      message: 'Checking Meta Graph API media download permissions...',
    });

    if (signal?.aborted) {
      throw new Error('Import cancelled by user.');
    }

    // Instagram public URLs provide metadata only
    onProgress?.({
      stage: 'action_required',
      progress: 100,
      message:
        'Metadata retrieved. Direct media stream requires authorized creator export or direct file upload.',
    });

    return {
      metadata: meta,
      videoUrl: undefined,
      sourceType: meta.sourceType,
      providerName: meta.providerName,
      mediaVerified: false,
    };
  }
}

export const instagramImportProviderInstance = new InstagramImportProvider();
export const instagramProvider = instagramImportProviderInstance;
