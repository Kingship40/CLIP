/**
 * Unified Video Import Service.
 * Manages provider registration, URL validation, SSRF checks, metadata retrieval,
 * and media pipeline handoff.
 */

import {
  IVideoImportProvider,
  ImportedMediaResult,
  ImportedVideoMetadata,
  ImportProgressCallback,
  ImportCancellationToken,
  ProviderValidationResult,
} from './types';
import { validateUrlSecurity } from './securityValidator';
import { youTubeImportProviderInstance } from './providers/youtubeProvider';
import { tikTokImportProviderInstance } from './providers/tiktokProvider';
import { instagramImportProviderInstance } from './providers/instagramProvider';
import { otherSocialImportProviderInstance } from './providers/otherSocialProvider';
import { directMediaImportProviderInstance } from './providers/directMediaProvider';
import { userUploadImportProviderInstance } from './providers/uploadProvider';

export class VideoImportService {
  private providers: IVideoImportProvider[] = [
    youTubeImportProviderInstance,
    tikTokImportProviderInstance,
    instagramImportProviderInstance,
    otherSocialImportProviderInstance,
    directMediaImportProviderInstance,
    userUploadImportProviderInstance,
  ];

  /**
   * Registers a new custom provider for video ingestion.
   */
  public registerProvider(provider: IVideoImportProvider): void {
    this.providers.unshift(provider);
  }

  /**
   * Locates a registered provider that can handle the specified URL.
   */
  public getProvider(url: string): IVideoImportProvider | null {
    if (!url || typeof url !== 'string') return null;
    return this.providers.find((p) => p.canHandle(url)) || null;
  }

  public detectProvider(url: string): IVideoImportProvider | null {
    return this.getProvider(url);
  }

  /**
   * Validates a URL against both general SSRF safety rules and provider-specific syntax.
   */
  public validate(url: string): ProviderValidationResult {
    // 1. SSRF and Base Security Check
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return {
        isValid: false,
        provider: 'unsupported',
        error: sec.error,
      };
    }

    // 2. Locate Matching Provider
    const provider = this.getProvider(url);
    if (!provider) {
      return {
        isValid: false,
        provider: 'unsupported',
        error: 'Unsupported video platform. Please provide a supported video link (YouTube, TikTok, Instagram, Vimeo, or direct MP4/WebM URL).',
      };
    }

    // 3. Provider-Specific Validation
    return provider.validate(url);
  }

  /**
   * Fetches metadata for an authorized video link without initiating full clipping.
   */
  public async fetchMetadata(
    url: string,
    signal?: AbortSignal
  ): Promise<ImportedVideoMetadata> {
    const val = this.validate(url);
    if (!val.isValid) {
      throw new Error(val.error || 'Invalid video URL.');
    }

    const provider = this.getProvider(url);
    if (!provider) {
      throw new Error('No matching provider found.');
    }

    return provider.fetchMetadata(val.normalizedUrl || url, signal);
  }

  /**
   * Fully imports video media and metadata, returning a unified payload
   * ready for the clipping pipeline.
   */
  public async importVideo(
    url: string,
    onProgress?: ImportProgressCallback,
    token?: ImportCancellationToken
  ): Promise<ImportedMediaResult> {
    const abortController = new AbortController();

    if (token) {
      token.cancel = () => {
        token.isCancelled = true;
        abortController.abort();
      };
    }

    onProgress?.({
      stage: 'validating',
      progress: 10,
      message: 'Running security and format checks...',
    });

    // 1. Validate
    const val = this.validate(url);
    if (!val.isValid) {
      onProgress?.({
        stage: 'failed',
        progress: 0,
        message: val.error || 'URL validation failed.',
      });
      throw new Error(val.error || 'Validation failed.');
    }

    if (token?.isCancelled || abortController.signal.aborted) {
      throw new Error('Video import was cancelled.');
    }

    // 2. Select Provider
    const provider = this.getProvider(url);
    if (!provider) {
      throw new Error('Unsupported video source.');
    }

    // 3. Delegate to Provider
    try {
      const result = await provider.importMedia(
        val.normalizedUrl || url,
        onProgress,
        abortController.signal
      );

      return result;
    } catch (err: any) {
      onProgress?.({
        stage: 'failed',
        progress: 0,
        message: err.message || 'Media import encountered an error.',
      });
      throw err;
    }
  }
}

export const videoImportServiceInstance = new VideoImportService();
export const videoImportService = videoImportServiceInstance;
