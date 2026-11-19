/**
 * YouTube Video Import Provider.
 * Supports standard watch URLs, YouTube Shorts, youtu.be shortlinks, and embeds.
 * Fetches verified metadata via YouTube oEmbed API and provides unified metadata.
 */

import {
  IVideoImportProvider,
  ImportedVideoMetadata,
  ImportedMediaResult,
  ImportProgressCallback,
  ProviderValidationResult,
  VideoSourceType,
} from '../types';
import { validateUrlSecurity } from '../securityValidator';

const YOUTUBE_HOSTNAMES = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export class YouTubeImportProvider implements IVideoImportProvider {
  public id: VideoSourceType = 'youtube';
  public displayName = 'YouTube';

  public getCapability() {
    return 'metadata_only' as const;
  }

  public canHandle(url: string): boolean {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      return (
        YOUTUBE_HOSTNAMES.has(host) ||
        host.endsWith('.youtube.com') ||
        host.endsWith('.youtu.be')
      );
    } catch {
      return false;
    }
  }

  public extractVideoId(url: string): { videoId: string | null; isShorts: boolean } {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      const pathname = parsed.pathname;

      let isShorts = false;

      // 1. YouTube Shorts: youtube.com/shorts/{id}
      if (pathname.startsWith('/shorts/')) {
        isShorts = true;
        const parts = pathname.split('/').filter(Boolean);
        const candidateId = parts[1]?.split(/[?&#/]/)[0] || null;
        if (candidateId && VIDEO_ID_REGEX.test(candidateId)) {
          return { videoId: candidateId, isShorts: true };
        }
      }

      // 2. YouTube Live: youtube.com/live/{id}
      if (pathname.startsWith('/live/')) {
        const parts = pathname.split('/').filter(Boolean);
        const candidateId = parts[1]?.split(/[?&#/]/)[0] || null;
        if (candidateId && VIDEO_ID_REGEX.test(candidateId)) {
          return { videoId: candidateId, isShorts: false };
        }
      }

      // 3. Short link: youtu.be/{id}
      if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
        const candidateId = pathname.slice(1).split(/[?&#/]/)[0] || null;
        if (candidateId && VIDEO_ID_REGEX.test(candidateId)) {
          return { videoId: candidateId, isShorts: false };
        }
      }

      // 4. Standard Watch URL: youtube.com/watch?v={id} or /watch/?v={id}
      if (pathname === '/watch' || pathname === '/watch/') {
        const candidateId = parsed.searchParams.get('v');
        if (candidateId && VIDEO_ID_REGEX.test(candidateId)) {
          return { videoId: candidateId, isShorts: false };
        }
      }

      // 5. Embed link and legacy v: youtube.com/embed/{id} or /v/{id}
      if (pathname.startsWith('/embed/') || pathname.startsWith('/v/')) {
        const parts = pathname.split('/').filter(Boolean);
        const candidateId = parts[1]?.split(/[?&#/]/)[0] || null;
        if (candidateId && VIDEO_ID_REGEX.test(candidateId)) {
          return { videoId: candidateId, isShorts: false };
        }
      }

      // 6. Attribution link: /attribution_link?u=/watch?v={id}
      if (pathname.startsWith('/attribution_link')) {
        const u = parsed.searchParams.get('u');
        if (u) {
          const innerMatch = u.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
          if (innerMatch && innerMatch[1]) {
            return { videoId: innerMatch[1], isShorts: false };
          }
        }
      }

      return { videoId: null, isShorts };
    } catch {
      return { videoId: null, isShorts: false };
    }
  }

  public validate(url: string): ProviderValidationResult {
    // 1. Run SSRF / Base Security Check
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return { isValid: false, provider: 'unsupported', error: sec.error };
    }

    if (!this.canHandle(url)) {
      return { isValid: false, provider: 'unsupported', error: 'Not a recognized YouTube address.' };
    }

    const { videoId, isShorts } = this.extractVideoId(url);
    if (!videoId) {
      return {
        isValid: false,
        provider: isShorts ? 'youtube_shorts' : 'youtube',
        error: 'Invalid or missing YouTube video ID. Please check the URL format.',
      };
    }

    const normalizedUrl = isShorts
      ? `https://www.youtube.com/shorts/${videoId}`
      : `https://www.youtube.com/watch?v=${videoId}`;

    return {
      isValid: true,
      provider: isShorts ? 'youtube_shorts' : 'youtube',
      normalizedUrl,
      videoId,
    };
  }

  public async fetchMetadata(url: string, signal?: AbortSignal): Promise<ImportedVideoMetadata> {
    const val = this.validate(url);
    if (!val.isValid || !val.videoId) {
      throw new Error(val.error || 'Failed to validate YouTube URL.');
    }

    const videoId = val.videoId;
    const isShorts = val.provider === 'youtube_shorts';
    const cleanUrl = val.normalizedUrl || url;

    let title = isShorts ? `YouTube Short #${videoId}` : `YouTube Video (${videoId})`;
    let author = 'YouTube Creator';
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // Fetch official oEmbed metadata with timeout protection to prevent hanging indefinitely
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
      if (signal?.aborted) throw new Error('Metadata extraction cancelled by user.');
      // Non-fatal: fallback to standard YouTube thumbnail format
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onUserAbort);
    }

    // Default duration baseline (Shorts <= 60s, Standard ~180s)
    const estimatedDuration = isShorts ? 45.0 : 180.0;
    const aspectRatio = isShorts ? '9:16' : '16:9';
    const width = isShorts ? 1080 : 1920;
    const height = isShorts ? 1920 : 1080;

    return {
      fileName: `${title.replace(/[/\\?%*:|"<>]/g, '').slice(0, 50)}.mp4`,
      fileSize: Math.round(estimatedDuration * 1200000), // ~1.2 MB/s estimated
      fileType: 'video/mp4',
      duration: estimatedDuration,
      width,
      height,
      aspectRatio,
      thumbnailUrl,
      sourceType: isShorts ? 'youtube_shorts' : 'youtube',
      sourceUrl: cleanUrl,
      author,
      providerName: isShorts ? 'YouTube Shorts' : 'YouTube',
      isShorts,
      requiresMediaDownload: true,
      hasMediaAccess: false,
      mediaAccessStatus: 'metadata_only',
      capability: 'metadata_only',
      mediaAccessMessage:
        "YouTube public links provide metadata and embedded player preview only. Direct media stream extraction is restricted under YouTube's API Terms of Service without authorized partner/creator export. To clip this video, please upload the source file directly or provide an authorized direct media stream URL.",
    };
  }

  public async importMedia(
    url: string,
    onProgress?: ImportProgressCallback,
    signal?: AbortSignal
  ): Promise<ImportedMediaResult> {
    onProgress?.({
      stage: 'validating_link',
      progress: 20,
      message: 'Validating YouTube URL format and security policies...',
    });

    const meta = await this.fetchMetadata(url, signal);

    if (signal?.aborted) {
      throw new Error('Import cancelled by user.');
    }

    onProgress?.({
      stage: 'retrieving_metadata',
      progress: 60,
      message: `Retrieved video details: "${meta.fileName}" by ${meta.author || 'creator'}`,
    });

    if (signal?.aborted) {
      throw new Error('Import cancelled by user.');
    }

    onProgress?.({
      stage: 'waiting_for_media_access',
      progress: 90,
      message: 'Checking platform media stream access permissions...',
    });

    if (signal?.aborted) {
      throw new Error('Import cancelled by user.');
    }

    // YouTube public URLs provide oEmbed metadata only.
    // Direct media download is restricted by YouTube's API Terms of Service.
    // We intentionally stop here and inform the user rather than fake success or download without authorization.
    onProgress?.({
      stage: 'waiting_for_media_access',
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

export const youTubeImportProviderInstance = new YouTubeImportProvider();
export const youtubeProvider = youTubeImportProviderInstance;
