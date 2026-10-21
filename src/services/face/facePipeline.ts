/**
 * Unified Face Detection, Tracking, and Auto-Reframing Pipeline Orchestrator.
 * Connects detector, multi-pass recovery, tracker, subject prioritizer, shot boundary detector,
 * and reframer into a unified, high-performance pipeline.
 */

import {
  PipelineConfig,
  TrackedFace,
  ReframingTarget,
  CompositionMode,
} from './types';
import { AdvancedFaceDetector } from './faceDetector';
import { ByteFaceTracker } from './faceTracker';
import { SubjectPrioritizer } from './subjectPrioritization';
import { ShotBoundaryDetector } from './shotBoundaryDetector';
import { AutoReframer } from './autoReframer';

export class FacePipeline {
  private detector: AdvancedFaceDetector;
  private tracker: ByteFaceTracker;
  private prioritizer: SubjectPrioritizer;
  private shotDetector: ShotBoundaryDetector;
  private reframer: AutoReframer;

  private config: PipelineConfig;
  private lastTracks: TrackedFace[] = [];
  private lastDecision: ReframingTarget | null = null;

  constructor(initialConfig: Partial<PipelineConfig> = {}) {
    this.config = {
      detectorSensitivity: 'medium',
      minDetectionConfidence: 0.50,
      highResPassEnabled: true,
      maxLostFrames: 30,
      smoothingFactor: 0.16,
      deadbandPercent: 0.025,
      headroomPercent: 0.36,
      compositionMode: 'active-speaker',
      selectedTrackId: null,
      shotCutThreshold: 0.38,
      ...initialConfig,
    };

    this.detector = new AdvancedFaceDetector();
    this.tracker = new ByteFaceTracker({
      maxLostFrames: this.config.maxLostFrames,
      highScoreThreshold: this.config.minDetectionConfidence,
    });
    this.prioritizer = new SubjectPrioritizer();
    this.shotDetector = new ShotBoundaryDetector(this.config.shotCutThreshold);
    this.reframer = new AutoReframer({
      compositionMode: this.config.compositionMode,
      smoothingFactor: this.config.smoothingFactor,
      deadbandPercent: this.config.deadbandPercent,
      headroomFactor: this.config.headroomPercent,
    });
  }

  public updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.compositionMode || newConfig.smoothingFactor || newConfig.deadbandPercent || newConfig.headroomPercent) {
      this.reframer.setConfig({
        compositionMode: this.config.compositionMode,
        smoothingFactor: this.config.smoothingFactor,
        deadbandPercent: this.config.deadbandPercent,
        headroomFactor: this.config.headroomPercent,
      });
    }
  }

  public reset(): void {
    this.tracker.reset();
    this.prioritizer.reset();
    this.shotDetector.reset();
    this.reframer.reset();
    this.lastTracks = [];
    this.lastDecision = null;
  }

  /**
   * Processes a video frame: runs shot boundary detection, multi-scale face detection,
   * ByteTrack tracking, subject prioritization, and cinematic auto-reframing.
   */
  public async processFrame(
    frameSource: HTMLVideoElement | HTMLCanvasElement,
    timestampMs: number = Date.now(),
    audioLevel: number = 0.5
  ): Promise<{
    reframing: ReframingTarget;
    tracks: TrackedFace[];
    primaryTrack: TrackedFace | null;
    secondaryTrack: TrackedFace | null;
    isSceneCut: boolean;
  }> {
    // 1. Detect Scene Cuts
    const isSceneCut = this.shotDetector.isSceneCut(frameSource);
    if (isSceneCut) {
      this.tracker.reset();
      this.prioritizer.reset();
    }

    // 2. Run Advanced Face Detection (with multi-pass refinement)
    const rawDetections = await this.detector.detect(frameSource, {
      sensitivity: this.config.detectorSensitivity,
      minConfidence: this.config.minDetectionConfidence,
      multiPass: this.config.highResPassEnabled,
    });

    // 3. Temporally Consistent Multi-Object Tracking
    const trackedFaces = this.tracker.update(rawDetections);

    // 4. Main-Subject Prioritization
    const decision = this.prioritizer.prioritize(
      trackedFaces,
      audioLevel,
      this.config.selectedTrackId ?? null
    );

    const primaryTrack = trackedFaces.find(t => t.trackId === decision.primaryTrackId) || null;
    const secondaryTrack = trackedFaces.find(t => t.trackId === decision.secondaryTrackId) || null;

    // 5. Cinematic Face-Aware Auto-Reframing
    const reframing = this.reframer.update(
      primaryTrack,
      secondaryTrack,
      trackedFaces,
      isSceneCut,
      timestampMs
    );

    this.lastTracks = trackedFaces;
    this.lastDecision = reframing;

    return {
      reframing,
      tracks: trackedFaces,
      primaryTrack,
      secondaryTrack,
      isSceneCut,
    };
  }

  public getLastTracks(): TrackedFace[] {
    return this.lastTracks;
  }

  public getLastDecision(): ReframingTarget | null {
    return this.lastDecision;
  }

  public destroy(): void {
    this.detector.destroy();
  }
}

// Global shared pipeline instance for client-side player & exporter
export const facePipelineInstance = new FacePipeline();
