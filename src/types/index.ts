export type AspectRatio = '9:16' | '16:9' | '1:1' | 'original' | '21:9' | '4:3';

export type ContentType = 
  | 'podcast'
  | 'interview'
  | 'educational'
  | 'tutorial'
  | 'vlog'
  | 'presentation'
  | 'other';

export type ClipPreference = 
  | 'hooks'
  | 'educational'
  | 'explanations'
  | 'engaging'
  | 'emotional'
  | 'highlights';

export type CaptionPreset = 'hormozi' | 'minimal' | 'karaoke' | 'neon' | 'cinematic';
export type CaptionPosition = 'bottom' | 'middle' | 'top';

export interface CaptionSettings {
  enabled: boolean;
  preset: CaptionPreset;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  position: CaptionPosition;
  highlightColor: string;
  textColor: string;
  showOpeningTitle: boolean;
  openingTitle?: string;
}

export interface VideoMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  thumbnailUrl?: string;
}

export interface ProjectConfig {
  clipCount: number | 'custom';
  customClipCount?: number;
  targetDuration: '15-30' | '30-60' | '60-90' | 'custom';
  customDurationSeconds?: number;
  aspectRatio: AspectRatio;
  contentType: ContentType;
  preferences: ClipPreference[];
  captionSettings: CaptionSettings;
  outputResolution: '1080p' | '720p' | '4k';
  language: string;
  keepAudio: boolean;
  customInstructions?: string;
}

export interface ProcessingStage {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface ProcessingJob {
  id: string;
  projectId: string;
  progress: number;
  currentStageIndex: number;
  stages: ProcessingStage[];
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface SubtitleSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  highlightWords?: string[];
}

export type FaceTrackingMode = 'auto' | 'left' | 'center' | 'right' | 'fit-blur' | 'split-dual';

export interface FaceCoordinates {
  x: number; // 0 to 100% horizontal position
  y: number; // 0 to 100% vertical position
  width?: number;
  height?: number;
  confidence?: number;
}

export interface Clip {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
  aspectRatio: AspectRatio;
  viralScore: number;
  hookSummary: string;
  hashtags: string[];
  subtitles: SubtitleSegment[];
  captionSettings: CaptionSettings;
  thumbnailUrl: string;
  videoUrl: string;
  selected: boolean;
  createdAt: string;
  updatedAt: string;
  isRendered: boolean;
  speakerFocus?: 'left' | 'center' | 'right' | 'dynamic';
  faceTrackingMode?: FaceTrackingMode;
  faceCoordinates?: FaceCoordinates;
  category?: string;
  rationale?: string;
  scoreBreakdown?: {
    hookStrength: number;
    emotionalIntellectual: number;
    clarityContext: number;
    payoffValue: number;
    narrativeCompleteness: number;
    shareability: number;
    avQuality: number;
    boundaryQuality: number;
  };
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  sourceVideo: {
    name: string;
    size: number;
    type: string;
    duration: number;
    width: number;
    height: number;
    aspectRatio: string;
    url?: string;
    thumbnailUrl?: string;
  };
  config: ProjectConfig;
  clips: Clip[];
  job?: ProcessingJob;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: 'free' | 'pro' | 'enterprise';
  clipsGeneratedCount: number;
  isDemo: boolean;
}

export interface AIServiceSettings {
  provider: 'gemini' | 'openai' | 'waveform';
  geminiApiKey: string;
  openaiApiKey: string;
  geminiModel: 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-2.0-flash-exp';
  openaiModel: 'gpt-4o-mini' | 'gpt-4o';
  isKeyVerified?: boolean;
}

export interface UserSettings {
  defaultAspectRatio: AspectRatio;
  defaultDuration: '15-30' | '30-60' | '60-90';
  defaultLanguage: string;
  defaultCaptionPreset: CaptionPreset;
  autoHighlightKeywords: boolean;
  emailNotifications: boolean;
  theme: 'dark';
  aiSettings: AIServiceSettings;
}

