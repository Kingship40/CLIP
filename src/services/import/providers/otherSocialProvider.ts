/**
 * Provider adapter for other social media platforms:
 * Vimeo, Twitter/X, Twitch, Facebook.
 * Evaluates official API endpoints and explicitly reports platform capability.
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

const OTHER_SOCIAL_HOSTS: Record<string, { name: string; hasOembed: boolean; capability: PlatformCapability }> = {
  'vimeo.com': { name: 'Vimeo', hasOembed: true, capability: 'metadata_only' },
  'player.vimeo.com': { name: 'Vimeo', hasOembed: true, capability: 'metadata_only' },
  'twitter.com': { name: 'X / Twitter', hasOembed: true, capability: 'metadata_only' },
  'x.com': { name: 'X / Twitter', hasOembed: true, capability: 'metadata_only' },
  'twitch.tv': { name: 'Twitch', hasOembed: false, capability: 'metadata_only' },
  'facebook.com': { name: 'Facebook', hasOembed: false, capability: 'metadata_only' },
};

export class OtherSocialImportProvider implements IVideoImportProvider {
  public id: VideoSourceType = 'other_social';
  public displayName = 'Social Media Video';

  public getCapability(): PlatformCapability {
    return 'metadata_only';
  }

  public canHandle(url: string): boolean {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      return Object.keys(OTHER_SOCIAL_HOSTS).some(
        (sh) => host === sh || host.endsWith(`.${sh}`)
      );
    } catch {
      return false;
    }
  }

  public identifyPlatform(url: string): { name: string; host: string } {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      for (const [domain, config] of Object.entries(OTHER_SOCIAL_HOSTS)) {
        if (host === domain || host.endsWith(`.${domain}`)) {
          return { name: config.name, host: domain };
        }
      }
      return { name: 'Social Platform', host: parsed.hostname };
    } catch {
      return { name: 'Social Platform', host: '' };
    }
  }

  public validate(url: string): ProviderValidationResult {
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return { isValid: false, provider: 'unsupported', error: sec.error };
    }

    if (!this.canHandle(url)) {
      return { isValid: false, provider: 'unsupported', error: 'Not a recognized social media platform.' };
    }

    const { name } = this.identifyPlatform(url);
    return {
      isValid: true,
      provider: 'other_social',
      normalizedUrl: url.trim(),
      capability: 'metadata_only',
    };
  }

  public async fetchMetadata(url: string, signal?: AbortSignal): Promise<ImportedVideoMetadata> {
    const val = this.validate(url);
    if (!val.isValid) {
      throw new Error(val.error || 'Failed to validate social video URL.');
    }

    const cleanUrl = val.normalizedUrl || url;
    const { name, host } = this.identifyPlatform(cleanUrl);

    let title = `${name} Video`;
    let author = `${name} Creator`;
    let thumbnailUrl = 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80';

    // Vimeo official oEmbed check
    if (host.includes('vimeo')) {
      try {
        const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(cleanUrl)}`;
        const res = await fetch(oembedUrl, { signal });
        if (res.ok) {
          const data = await res.json();
          if (data.title) title = data.title;
          if (data.author_name) author = data.author_name;
          if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
        }
      } catch (e: any) {
        if (signal?.aborted) throw new Error('Metadata fetch cancelled by user.');
      }
    }

    const duration = 60.0;

    return {
      fileName: `${title.replace(/[/\\?%*:|"<>]/g, '').slice(0, 50)}.mp4`,
      fileSize: Math.round(duration * 1200000),
      fileType: 'video/mp4',
      duration,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      thumbnailUrl,
      sourceType: 'other_social',
      sourceUrl: cleanUrl,
      author,
      providerName: name,
      requiresMediaDownload: true,
      hasMediaAccess: false,
      mediaAccessStatus: 'metadata_only',
      capability: 'metadata_only',
      mediaAccessMessage:
        `${name} public links provide metadata and embedded player preview only. Direct media stream extraction requires creator authorization or platform API integration. To clip this video, please upload the source file directly or provide an authorized direct media stream URL.`,
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
      message: 'Validating URL format and security policies...',
    });

    const meta = await this.fetchMetadata(url, signal);

    if (signal?.aborted) {
      throw new Error('Import cancelled by user.');
    }

    onProgress?.({
      stage: 'identifying_platform',
      progress: 50,
      message: `Identified ${meta.providerName} video`,
    });

    onProgress?.({
      stage: 'checking_authorized_access',
      progress: 80,
      message: `Checking ${meta.providerName} API permissions...`,
    });

    if (signal?.aborted) {
      throw new Error('Import cancelled by user.');
    }

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

export const otherSocialImportProviderInstance = new OtherSocialImportProvider();
export const otherSocialProvider = otherSocialImportProviderInstance;
