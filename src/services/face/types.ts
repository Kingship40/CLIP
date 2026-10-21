/**
 * Types and interfaces for the Advanced Face Detection, Tracking, and Reframing Pipeline.
 */

export interface NormalizedRect {
  x: number; // 0 to 1 horizontal left
  y: number; // 0 to 1 vertical top
  width: number; // 0 to 1 width
  height: number; // 0 to 1 height
}

export interface PixelRect {
  x: number; // pixel left
  y: number; // pixel top
  width: number; // pixel width
  height: number; // pixel height
}

export interface Point2D {
  x: number;
  y: number;
}

export interface FaceLandmarks {
  leftEye: Point2D;
  rightEye: Point2D;
  noseTip: Point2D;
  mouthLeft: Point2D;
  mouthRight: Point2D;
  mouthCenter?: Point2D;
}

export interface RawFaceDetection {
  box: NormalizedRect;
  confidence: number;
  landmarks?: FaceLandmarks;
  mouthOpenness?: number; // 0 to 1 estimation of mouth opening
  sourcePass: 'primary' | 'high_res' | 'hardware';
  rawScore?: number;
}

export type TrackState = 'tentative' | 'confirmed' | 'lost' | 'deleted';

export interface TrackedFace {
  trackId: number;
  box: NormalizedRect;
  interpolatedBox: NormalizedRect;
  velocity: { vx: number; vy: number; vw: number; vh: number };
  confidence: number;
  landmarks?: FaceLandmarks;
  state: TrackState;
  ageFrames: number;
  hits: number;
  timeSinceUpdate: number;
  isSpeaking: boolean;
  speakingScore: number;
  mouthHistory: number[];
  prioritizationScore: number;
  scoreBreakdown?: {
    confidence: number;
    size: number;
    centerProximity: number;
    stability: number;
    speakingActivity: number;
    audioSync: number;
    hysteresis: number;
  };
  appearanceSignature?: number[]; // simplified 16-bin color/intensity histogram
}

export type CompositionMode =
  | 'auto' // Intelligent auto speaker tracking
  | 'active-speaker' // Intelligently follows the active speaker
  | 'all-speakers-wide' // Zooms/pans to keep all active subjects visible
  | 'dual-split' // Vertical split (Top: Speaker 1, Bottom: Speaker 2)
  | 'split-dual' // Podcast 2-speaker stacked layout
  | 'fit-blur' // Preserves full 16:9 width with blurred background
  | 'manual-track' // Locked to a specific Track ID
  | 'left' // Preset left third
  | 'center' // Preset center
  | 'right'; // Preset right third

export interface ReframingTarget {
  cropBox: NormalizedRect;
  panX: number; // 0 to 100% horizontal center
  panY: number; // 0 to 100% vertical center
  zoom: number; // 1.0 = standard framing, >1.0 = zoomed in
  activeTrackId: number | null;
  secondaryTrackId?: number | null;
  isSceneCut: boolean;
  compositionMode: CompositionMode;
  explanation: string;
}

export interface PipelineConfig {
  detectorSensitivity: 'low' | 'medium' | 'high' | 'ultra';
  minDetectionConfidence: number;
  highResPassEnabled: boolean;
  maxLostFrames: number;
  smoothingFactor: number; // 0.05 to 0.40 (higher = snappier, lower = smoother)
  deadbandPercent: number; // e.g. 2.5% movement threshold
  headroomPercent: number; // e.g. 15% headroom above eye line
  compositionMode: CompositionMode;
  selectedTrackId?: number | null;
  shotCutThreshold: number; // e.g. 0.35 luminance/color diff threshold
}

export interface DetectionBenchmarkResult {
  totalFrames: number;
  detectionCount: number;
  precision: number;
  recall: number;
  f1Score: number;
  averageIoU: number;
  idSwitches: number;
  fragmentations: number;
  faceVisibilityRate: number;
  smoothnessJerkScore: number; // lower is smoother
  avgInferenceMs: number;
  fps: number;
}
