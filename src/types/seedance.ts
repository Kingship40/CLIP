export type ImageReferenceRole = 
  | 'identity_face'
  | 'clothing_style'
  | 'lighting_environment'
  | 'art_style'
  | 'prop_object';

export type VideoReferenceRole = 
  | 'camera_motion_path'
  | 'character_choreography'
  | 'pacing_rhythm'
  | 'clay_blocking';

export type AudioReferenceRole = 
  | 'voice_timbre_clone'
  | 'music_score_motif'
  | 'acoustic_ambience'
  | 'foley_impact';

export interface ImageReferenceSlot {
  tag: string; // e.g. '@Ref_Image_1'
  url: string;
  role: ImageReferenceRole;
  fidelityStrength?: number; // 0.1 to 1.0
  thumbnailUrl?: string;
  name?: string;
}

export interface VideoReferenceSlot {
  tag: string; // e.g. '@Ref_Video_1'
  url: string;
  role: VideoReferenceRole;
  duration?: number;
  thumbnailUrl?: string;
  name?: string;
}

export interface AudioReferenceSlot {
  tag: string; // e.g. '@Ref_Audio_1'
  url: string;
  role: AudioReferenceRole;
  name?: string;
}

export interface InContextEditingConfig {
  enabled: boolean;
  timeWindow: {
    startTime: number;
    endTime: number;
  };
  spatialMaskUrl?: string;
  preserveOutsideWindow: boolean;
}

export interface StructureGuidanceConfig {
  enabled: boolean;
  clayRenderDepthUrl?: string;
  surfaceNormalUrl?: string;
  conditioningStrength: number; // 0.0 to 1.0
}

export interface SeedanceAudioSettings {
  dialogueLanguage: 'en' | 'zh' | 'es' | 'ja' | 'ko' | 'pt' | 'ar' | 'vi' | 'th' | 'id' | 'ms';
  enableSfx: boolean;
  enableAmbience: boolean;
  enableMusic: boolean;
}

export interface Seedance25GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '21:9' | '4:3';
  resolution: '720p' | '1080p' | '4k';
  durationSeconds: number; // 4 to 30s
  fps: 24 | 30 | 60;
  referenceConditioning: {
    images: ImageReferenceSlot[];
    videos: VideoReferenceSlot[];
    audios: AudioReferenceSlot[];
  };
  inContextEditing?: InContextEditingConfig;
  structureGuidance?: StructureGuidanceConfig;
  audioSettings: SeedanceAudioSettings;
  samplingParameters?: {
    steps?: number;
    guidanceScale?: number;
    audioGuidanceScale?: number;
    seed?: number;
  };
}

export interface SeedanceJobMetrics {
  inferenceLatencyMs: number;
  hardwareAllocation: string;
  peakVramGbPerGpu: number;
  effectiveFps: number;
}

export interface SeedanceJobArtifacts {
  masterMp4Url: string;
  audioIsolatedWavUrl: string;
  srtSubtitlesUrl: string;
  vttSubtitlesUrl: string;
  latentCheckpointUrl?: string;
}

export interface SeedanceJobResponse {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progressPercentage: number;
  currentStage?: string;
  executionMetrics?: SeedanceJobMetrics;
  artifacts?: SeedanceJobArtifacts;
  metadata?: {
    durationSeconds: number;
    totalVideoFrames: number;
    resolution: string;
    audioSampleRate: number;
    detectedSyncScore: number;
  };
}
