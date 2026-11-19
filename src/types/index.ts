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

export type CaptionPreset = 
  | 'hormozi' 
  | 'boxed' 
  | 'karaoke' 
  | 'bounce' 
  | 'minimal' 
  | 'neon' 
  | 'cinematic';

export type CaptionPosition = 'bottom' | 'middle' | 'top' | 'custom';
export type SubtitleDisplayMode = 'word-highlight' | 'boxed-word' | 'single-word' | 'phrase' | 'karaoke';
export type SubtitleOutlineWidth = 'none' | 'thin' | 'medium' | 'thick';
export type SubtitleTextCase = 'uppercase' | 'title' | 'original';

export interface CaptionSettings {
  enabled: boolean;
  preset: CaptionPreset;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  position: CaptionPosition;
  yOffset?: number; // 10 to 90% vertical position
  fontFamily?: string;
  highlightColor: string;
  textColor: string;
  activeWordBgColor?: string;
  activeWordTextColor?: string;
  activeWordScale?: number;
  textCase?: SubtitleTextCase;
  outlineColor?: string;
  outlineWidth?: SubtitleOutlineWidth;
  backgroundColor?: string;
  backgroundOpacity?: number;
  displayMode?: SubtitleDisplayMode;
  shadowType?: 'none' | 'soft' | 'glow' | 'heavy';
  maxWordsPerSegment?: number;
  speakerLabels?: boolean;
  language?: string;
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
  exactDurationSeconds?: number;
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

export interface SubtitleWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface SubtitleSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  words?: SubtitleWord[];
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
  videoUrl: string; // The active playback URL (points to subtitled video if rendered)
  originalVideoUrl?: string; // Preserved original clean clip reference
  subtitledVideoUrl?: string; // Final subtitled MP4 video URL
  subtitleProcessingStatus?: 'idle' | 'in_queue' | 'in_progress' | 'completed' | 'failed';
  subtitleProcessingError?: string;
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

  // Extended Multi-Platform Ingestion & Video Records (Part 10)
  source_platform?: string;
  source_url?: string;
  source_video_id?: string;
  source_title?: string;
  source_thumbnail?: string;
  source_duration?: number;
  ingestion_status?: string;
  accessibility_status?: string;
  processing_job_id?: string;
  original_video_reference?: string;
  generated_clips?: Clip[];
  subtitle_status?: string;
  final_processing_status?: string;
  error_message?: string;

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
    sourcePlatform?: string;
    sourceVideoId?: string;
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

export interface DeepgramSettings {
  apiKey: string;
  model: 'nova-2' | 'nova-2-general' | 'nova-2-meeting' | 'nova-2-phonecall' | 'nova-3' | 'enhanced' | 'base';
  language?: string;
  smartFormat: boolean;
  punctuate: boolean;
  diarize: boolean;
  utterances: boolean;
  isKeyVerified?: boolean;
}

export interface UserSettings {
  defaultAspectRatio: AspectRatio;
  defaultDuration: '15-30' | '30-60' | '60-90';
  defaultLanguage: string;
  defaultCaptionPreset: CaptionPreset;
  autoHighlightKeywords: boolean;
  emailNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  aiSettings: AIServiceSettings;
  deepgramSettings?: DeepgramSettings;
  subtitleDefaults?: Partial<CaptionSettings>;
}

