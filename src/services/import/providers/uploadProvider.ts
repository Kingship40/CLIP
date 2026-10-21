/**
 * User-Uploaded Video Provider Adapter.
 * Represents creator-authorized local video files.
 * Reports 'authorized_source_media' capability.
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

export class UserUploadImportProvider implements IVideoImportProvider {
  public id: VideoSourceType = 'upload';
  public displayName = 'Uploaded Video';

  public getCapability(): PlatformCapability {
    return 'authorized_source_media';
  }

  public canHandle(url: string): boolean {
    return url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('file:') || url.startsWith('upload://');
  }

  public validate(url: string): ProviderValidationResult {
    if (!this.canHandle(url)) {
      return { isValid: false, provider: 'unsupported', error: 'Not a local file or upload source.' };
    }
    return {
      isValid: true,
      provider: 'upload',
      normalizedUrl: url,
      capability: 'authorized_source_media',
    };
  }

  public async fetchMetadata(url: string): Promise<ImportedVideoMetadata> {
    return {
      fileName: 'uploaded_video.mp4',
      fileSize: 45000000,
      fileType: 'video/mp4',
      duration: 60.0,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      thumbnailUrl: '',
      sourceType: 'upload',
      sourceUrl: url,
      providerName: 'Uploaded Video',
      requiresMediaDownload: false,
      hasMediaAccess: true,
      mediaAccessStatus: 'verified',
      capability: 'authorized_source_media',
    };
  }

  public async importMedia(
    url: string,
    onProgress?: ImportProgressCallback
  ): Promise<ImportedMediaResult> {
    onProgress?.({
      stage: 'importing_source_privately',
      progress: 50,
      message: 'Loading uploaded video file into private workspace...',
    });

    const meta = await this.fetchMetadata(url);

    onProgress?.({
      stage: 'ready_for_clipping',
      progress: 100,
      message: 'Local video file ready for AI clipping.',
    });

    return {
      metadata: meta,
      videoUrl: url,
      sourceType: 'upload',
      providerName: 'Uploaded Video',
      mediaVerified: true,
    };
  }
}

export const userUploadImportProviderInstance = new UserUploadImportProvider();
export const uploadProvider = userUploadImportProviderInstance;
