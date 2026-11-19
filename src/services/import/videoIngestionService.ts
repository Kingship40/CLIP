/**
 * Video Ingestion & Platform Detection Service.
 * Centralized service implementing the Platform Connector Architecture for:
 * 1. YouTube
 * 2. Facebook
 * 3. TikTok
 * 4. Instagram
 * 5. Vimeo
 * 6. X (Twitter)
 * 7. Twitch
 * 8. Direct Video & Upload
 */

import {
  PlatformAdapter,
  AdapterValidationResult,
  StandardizedPlatformMetadata,
  AccessibilityCheckResult,
  AuthorizedMediaResult,
  NormalizedProcessingMedia,
} from './adapters/types';
import { youtubeAdapterInstance } from './adapters/youtubeAdapter';
import { facebookAdapterInstance } from './adapters/facebookAdapter';
import { tikTokAdapterInstance } from './adapters/tiktokAdapter';
import { instagramAdapterInstance } from './adapters/instagramAdapter';
import { vimeoAdapterInstance } from './adapters/vimeoAdapter';
import { xAdapterInstance } from './adapters/xAdapter';
import { twitchAdapterInstance } from './adapters/twitchAdapter';
import { directVideoUploadAdapterInstance } from './adapters/directVideoUploadAdapter';
import { validateUrlSecurity } from './securityValidator';

export interface StandardizedPlatformResponse {
  platformName: string;
  videoId: string | null;
  videoTitle: string;
  thumbnail: string;
  duration: number;
  creatorName?: string;
  videoUrl?: string;
  accessibilityStatus: 'verified' | 'metadata_only' | 'unauthorized' | 'unreachable' | 'restricted';
  processingEligibility: boolean;
  requiresCreatorUpload: boolean;
  error?: string;
  mediaAccessMessage?: string;
}

export class VideoIngestionService {
  private adapters: PlatformAdapter[] = [
    youtubeAdapterInstance,
    facebookAdapterInstance,
    tikTokAdapterInstance,
    instagramAdapterInstance,
    vimeoAdapterInstance,
    xAdapterInstance,
    twitchAdapterInstance,
    directVideoUploadAdapterInstance,
  ];

  /**
   * Registers a new platform adapter.
   */
  public registerAdapter(adapter: PlatformAdapter): void {
    this.adapters.unshift(adapter);
  }

  /**
   * Returns all active platform adapters.
   */
  public getAdapters(): PlatformAdapter[] {
    return [...this.adapters];
  }

  /**
   * Automatically detects the source platform for any video link.
   */
  public detectPlatform(url: string): PlatformAdapter | null {
    if (!url || typeof url !== 'string') return null;
    return this.adapters.find((a) => a.detectPlatform(url)) || null;
  }

  /**
   * Standardized URL validation across security rules and platform syntax.
   */
  public validate(url: string): AdapterValidationResult {
    const sec = validateUrlSecurity(url);
    if (!sec.isValid) {
      return {
        isValid: false,
        platform: 'unsupported',
        error: sec.error,
      };
    }

    const adapter = this.detectPlatform(url);
    if (!adapter) {
      return {
        isValid: false,
        platform: 'unsupported',
        error:
          'Unsupported video platform. Supported platforms: YouTube, Facebook, TikTok, Instagram, Vimeo, X (Twitter), Twitch, or direct MP4/WebM/S3 URLs.',
      };
    }

    return adapter.validateUrl(url);
  }

  /**
   * Retrieves standardized metadata from the matching platform adapter.
   */
  public async getMetadata(
    url: string,
    signal?: AbortSignal
  ): Promise<StandardizedPlatformMetadata> {
    const val = this.validate(url);
    if (!val.isValid) {
      throw new Error(val.error || 'Failed to validate video URL.');
    }

    const adapter = this.detectPlatform(url);
    if (!adapter) {
      throw new Error('No matching platform adapter found.');
    }

    return adapter.getMetadata(val.normalizedUrl || url, signal);
  }

  /**
   * Checks whether the underlying media is accessible through authorized means.
   */
  public async checkAccessibility(url: string): Promise<AccessibilityCheckResult> {
    const adapter = this.detectPlatform(url);
    if (!adapter) {
      return {
        isAccessible: false,
        status: 'unreachable',
        requiresAuth: false,
        message: 'Unsupported video platform.',
        supportsDirectClipping: false,
      };
    }

    return adapter.checkAccessibility(url);
  }

  /**
   * Delivers a standardized response for the frontend and API layers.
   */
  public async getStandardizedResponse(
    url: string,
    signal?: AbortSignal
  ): Promise<StandardizedPlatformResponse> {
    const adapter = this.detectPlatform(url);
    if (!adapter) {
      return {
        platformName: 'Unknown',
        videoId: null,
        videoTitle: '',
        thumbnail: '',
        duration: 0,
        accessibilityStatus: 'unreachable',
        processingEligibility: false,
        requiresCreatorUpload: true,
        error: 'Unsupported platform.',
      };
    }

    try {
      const meta = await adapter.getMetadata(url, signal);
      return {
        platformName: meta.platformName,
        videoId: meta.videoId,
        videoTitle: meta.title,
        thumbnail: meta.thumbnailUrl,
        duration: meta.duration,
        creatorName: meta.author,
        videoUrl: meta.hasMediaAccess ? meta.sourceUrl : undefined,
        accessibilityStatus: meta.accessibilityStatus,
        processingEligibility: meta.processingEligibility,
        requiresCreatorUpload: meta.requiresCreatorUpload,
        mediaAccessMessage: meta.mediaAccessMessage,
      };
    } catch (err: any) {
      return {
        platformName: adapter.displayName,
        videoId: null,
        videoTitle: '',
        thumbnail: '',
        duration: 0,
        accessibilityStatus: 'unreachable',
        processingEligibility: false,
        requiresCreatorUpload: true,
        error: err.message || 'Failed to extract platform metadata.',
      };
    }
  }

  /**
   * Obtains video through authorized platform method.
   */
  public async retrieveAuthorizedMedia(
    url: string,
    options?: any
  ): Promise<AuthorizedMediaResult> {
    const adapter = this.detectPlatform(url);
    if (!adapter) {
      throw new Error('Unsupported platform for media retrieval.');
    }
    return adapter.retrieveAuthorizedMedia(url, options);
  }

  /**
   * Prepares video for standardized processing pipeline.
   */
  public async prepareForProcessing(
    media: AuthorizedMediaResult,
    options?: any
  ): Promise<NormalizedProcessingMedia> {
    return directVideoUploadAdapterInstance.prepareForProcessing(media, options);
  }
}

export const videoIngestionServiceInstance = new VideoIngestionService();
export const platformDetectionService = videoIngestionServiceInstance;
