/**
 * Common Interfaces & Types for Platform Adapters & Video Ingestion Architecture.
 */

import { VideoSourceType, PlatformCapability, MediaAccessStatus } from '../types';

export interface AdapterValidationResult {
  isValid: boolean;
  platform: VideoSourceType | 'unsupported';
  normalizedUrl?: string;
  videoId?: string | null;
  error?: string;
}

export interface StandardizedPlatformMetadata {
  platformName: string;
  platformId: VideoSourceType;
  videoId: string | null;
  title: string;
  author?: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  width: number;
  height: number;
  aspectRatio: string; // '16:9' | '9:16' | '1:1'
  sourceUrl: string;
  isShort: boolean;
  hasMediaAccess: boolean;
  accessibilityStatus: MediaAccessStatus;
  processingEligibility: boolean;
  mediaAccessMessage?: string;
  requiresCreatorUpload: boolean;
  capability: PlatformCapability;
}

export interface AccessibilityCheckResult {
  isAccessible: boolean;
  status: MediaAccessStatus;
  requiresAuth: boolean;
  authType?: 'oauth' | 'api_key' | 'partner_contract' | 'none';
  message: string;
  supportsDirectClipping: boolean;
}

export interface AuthorizedMediaResult {
  hasMediaBytes: boolean;
  streamUrl?: string;
  mediaBuffer?: Buffer | Uint8Array;
  filePath?: string;
  format: string;
  duration?: number;
  isDirectDownloadAuthorized: boolean;
  requiresCreatorUpload: boolean;
  message?: string;
}

export interface NormalizedProcessingMedia {
  readyForClipping: boolean;
  mediaPath?: string;
  mediaUrl?: string;
  width: number;
  height: number;
  duration: number;
  hasAudio: boolean;
  videoCodec: string;
  audioCodec?: string;
  normalizedFormat: string;
}

export interface PlatformAdapter {
  readonly id: VideoSourceType;
  readonly displayName: string;
  readonly supportedDomains: string[];

  detectPlatform(url: string): boolean;
  validateUrl(url: string): AdapterValidationResult;
  getMetadata(url: string, signal?: AbortSignal): Promise<StandardizedPlatformMetadata>;
  checkAccessibility(url: string): Promise<AccessibilityCheckResult>;
  retrieveAuthorizedMedia(url: string, options?: any): Promise<AuthorizedMediaResult>;
  prepareForProcessing(media: AuthorizedMediaResult, options?: any): Promise<NormalizedProcessingMedia>;
}
