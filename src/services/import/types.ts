/**
 * Types and interfaces for the Provider-Based Video URL Import System.
 * Supports private backend media processing, background job queueing,
 * and platform capability reporting.
 */

import { VideoMetadata, Clip } from '../../types';

export type VideoSourceType =
  | 'upload'
  | 'youtube'
  | 'youtube_shorts'
  | 'tiktok'
  | 'instagram'
  | 'other_social'
  | 'direct_url'
  | 'authorized_storage';

/**
 * Explicit platform capability reported by each provider adapter.
 */
export type PlatformCapability =
  | 'metadata_only'            // Metadata lookup available, no direct source download
  | 'embedded_playback_only'   // Official embedded player snippet available
  | 'authorized_source_media'  // Direct audiovisual source stream accessible for private processing
  | 'no_supported_access';     // No supported API access available

/**
 * 11 Real import lifecycle states reflecting true backend & AI pipeline status.
 */
export type IngestionJobStage =
  | 'validating_url'             // Step 1: Validating URL & SSRF security
  | 'checking_link'              // Alias for validating_url
  | 'detecting_platform'         // Step 2: Matching adapter & checking provider syntax
  | 'identifying_platform'       // Alias for detecting_platform
  | 'checking_video_access'      // Step 3: Checking authorized source access & platform permissions
  | 'checking_authorized_access' // Alias for checking_video_access
  | 'extracting_metadata'        // Step 4: Extracting metadata
  | 'retrieving_metadata'        // Alias for extracting_metadata
  | 'retrieving_video'           // Step 5: Retrieving authorized video stream
  | 'importing_source_privately' // Alias for retrieving_video
  | 'preparing_video'            // Step 6: Normalizing video container, codecs & timestamps
  | 'analyzing_content'          // Step 7: Decoding frames & ASR speech tokenization
  | 'analyzing_video_audio'      // Alias for analyzing_content
  | 'detecting_highlights'       // Step 8: 18-category viral moment discovery & scoring
  | 'detecting_moments'          // Alias for detecting_highlights
  | 'generating_clips'           // Step 9: Subject-aware 9:16 vertical cropping & reframing
  | 'generating_subtitles'       // Step 10: Automatic VEED / Whisper caption sync & burning
  | 'rendering_captions'         // Alias for generating_subtitles
  | 'rendering_final_videos'     // Step 11: Exporting finalized MP4 deliverables
  | 'ready_to_download'          // Step 12: Finished clips ready with individual download buttons
  | 'completed'                  // Alias for ready_to_download
  | 'action_required'            // Step 13: Metadata loaded, creator export or upload needed
  | 'import_failed'              // Step 14: Unrecoverable failure with clear explanation
  | 'failed';                    // Alias for import_failed

/**
 * Backwards compatibility union with previous stage names.
 */
export type ImportStage =
  | IngestionJobStage
  | 'idle'
  | 'validating_link'
  | 'retrieving_metadata'
  | 'waiting_for_media_access'
  | 'verifying_media'
  | 'ready_for_clipping'
  | 'failed'
  | 'validating'
  | 'metadata'
  | 'downloading'
  | 'preparing'
  | 'completed';

export type MediaAccessStatus =
  | 'verified'                 // Media stream verified, video & audio readable
  | 'metadata_only'            // Metadata loaded, but platform permissions restrict direct stream download
  | 'unauthorized'             // Source requires OAuth credentials or storage access keys
  | 'unreachable';             // Stream unreachable, 404, or network timeout

export interface ImportStageInfo {
  stage: ImportStage;
  progress: number; // 0 to 100
  message: string;
}

export type ImportProgressCallback = (info: ImportStageInfo) => void;

export interface ImportCancellationToken {
  isCancelled: boolean;
  cancel: () => void;
}

export type CancellationToken = ImportCancellationToken;

export interface SecurityValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
  hostname?: string;
  protocol?: string;
  isPrivateIp?: boolean;
}

export interface ProviderValidationResult {
  isValid: boolean;
  provider: VideoSourceType | 'unsupported';
  normalizedUrl?: string;
  videoId?: string;
  capability?: PlatformCapability;
  error?: string;
}

export interface MediaVerificationResult {
  isPlayable: boolean;
  hasVideoStream: boolean;
  hasAudioStream: boolean;
  duration?: number;
  width?: number;
  height?: number;
  contentType?: string;
  contentLength?: number;
  error?: string;
}

export interface ImportedVideoMetadata extends VideoMetadata {
  sourceType: VideoSourceType;
  sourceUrl: string;
  author?: string;
  providerName: string;
  isShorts?: boolean;
  requiresMediaDownload?: boolean;
  hasMediaAccess: boolean;           // True ONLY when authorized video stream is available
  mediaAccessStatus: MediaAccessStatus;
  mediaAccessMessage?: string;       // Clear user-facing explanation if metadata_only
  audioDetected?: boolean;           // Audio track detected
  capability: PlatformCapability;    // Explicit provider capability
}

export interface ImportedMediaResult {
  metadata: ImportedVideoMetadata;
  videoUrl?: string;                 // Present ONLY when hasMediaAccess === true
  sourceType: VideoSourceType;
  providerName: string;
  mediaVerified: boolean;            // True only after media verification succeeds
  verificationDetails?: MediaVerificationResult;
  privateJobId?: string;             // Private backend job identifier
}

export interface IVideoImportProvider {
  id: VideoSourceType;
  displayName: string;
  getCapability(): PlatformCapability;
  canHandle(url: string): boolean;
  validate(url: string): ProviderValidationResult;
  fetchMetadata(url: string, signal?: AbortSignal): Promise<ImportedVideoMetadata>;
  importMedia(
    url: string,
    onProgress?: ImportProgressCallback,
    signal?: AbortSignal
  ): Promise<ImportedMediaResult>;
}

export type RetentionPolicy = 'immediate' | '15min' | '1hour';

export interface IngestionJob {
  id: string;
  sourceUrl?: string;
  sourceType: VideoSourceType;
  providerName: string;
  capability: PlatformCapability;
  stage: ImportStage;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'action_required' | 'cancelled';
  progress: number;
  metadata?: ImportedVideoMetadata;
  clips: Clip[];
  error?: string;
  isRetryable: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  retentionPolicy: RetentionPolicy;
  sourceCleanedUp: boolean;
  // Tokens for secure download
  downloadTokens?: Record<string, string>;
}
