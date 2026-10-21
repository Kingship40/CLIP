/**
 * Face-Aware Auto-Reframing Controller.
 * Computes optimal crop windows with cinematic headroom, safe margins,
 * velocity-aware critically damped smoothing, deadband filtering, and multi-speaker compositions.
 */

import { NormalizedRect, TrackedFace, ReframingTarget, CompositionMode } from './types';

export interface AutoReframerConfig {
  targetAspectRatio: '9:16' | '1:1' | '16:9' | '21:9';
  compositionMode: CompositionMode;
  smoothingFactor: number; // 0.05 (ultra-cinematic) to 0.40 (snappy)
  deadbandPercent: number; // e.g. 0.025 (2.5% of frame)
  headroomFactor: number; // e.g. 0.35 (eye line at 35% from top)
  maxPanVelocity: number; // normalized units per second (default: 0.85)
}

export class AutoReframer {
  private config: AutoReframerConfig;

  // Current smoothed camera crop state
  private currentPanX: number = 0.50; // normalized 0 to 1
  private currentPanY: number = 0.50; // normalized 0 to 1
  private currentZoom: number = 1.0;
  private currentVelocityX: number = 0;
  private currentVelocityY: number = 0;

  private lastTimestampMs: number = 0;

  constructor(config: Partial<AutoReframerConfig> = {}) {
    this.config = {
      targetAspectRatio: '9:16',
      compositionMode: 'active-speaker',
      smoothingFactor: 0.16,
      deadbandPercent: 0.025,
      headroomFactor: 0.36,
      maxPanVelocity: 0.85,
      ...config,
    };
  }

  public setConfig(config: Partial<AutoReframerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public reset(): void {
    this.currentPanX = 0.50;
    this.currentPanY = 0.50;
    this.currentZoom = 1.0;
    this.currentVelocityX = 0;
    this.currentVelocityY = 0;
    this.lastTimestampMs = 0;
  }

  /**
   * Calculates the optimal smoothed reframed crop window for the current frame.
   */
  public update(
    primaryTrack: TrackedFace | null,
    secondaryTrack: TrackedFace | null,
    allTracks: TrackedFace[],
    isSceneCut: boolean = false,
    timestampMs: number = Date.now(),
    sourceAspectRatio: number = 16 / 9
  ): ReframingTarget {
    const dt = this.lastTimestampMs > 0 ? Math.min(0.2, (timestampMs - this.lastTimestampMs) / 1000.0) : 0.033;
    this.lastTimestampMs = timestampMs;

    // Calculate crop window dimensions based on target aspect ratio
    const targetRatio = this.getTargetRatioValue(this.config.targetAspectRatio);
    let cropWidthNorm = 1.0;
    let cropHeightNorm = 1.0;

    if (this.config.targetAspectRatio === '9:16') {
      // Source is typically 16:9 (ratio ~1.777), Target is 9:16 (ratio ~0.5625)
      cropWidthNorm = Math.min(1.0, targetRatio / sourceAspectRatio);
      cropHeightNorm = 1.0;
    } else if (this.config.targetAspectRatio === '1:1') {
      cropWidthNorm = Math.min(1.0, 1.0 / sourceAspectRatio);
      cropHeightNorm = 1.0;
    } else {
      cropWidthNorm = 1.0;
      cropHeightNorm = 1.0;
    }

    // Determine target center (targetX, targetY) based on composition mode
    let targetX = 0.50;
    let targetY = 0.50;
    let explanation = 'Default center composition.';

    const mode = this.config.compositionMode;

    if (mode === 'left') {
      targetX = 0.25;
      explanation = 'Manual Left-Third Framing Preset.';
    } else if (mode === 'center') {
      targetX = 0.50;
      explanation = 'Manual Center-Stage Framing Preset.';
    } else if (mode === 'right') {
      targetX = 0.75;
      explanation = 'Manual Right-Third Framing Preset.';
    } else if (mode === 'all-speakers-wide' && allTracks.length >= 2) {
      // Enclose all visible subjects
      const minX = Math.min(...allTracks.map(t => t.box.x));
      const maxX = Math.max(...allTracks.map(t => t.box.x + t.box.width));
      targetX = (minX + maxX) / 2.0;
      explanation = `Group Framing: Enclosing ${allTracks.length} visible subjects.`;
    } else if (primaryTrack) {
      // Active Speaker / Track-focused Framing
      const box = primaryTrack.box;
      const faceCenterX = box.x + box.width / 2.0;
      const faceCenterY = box.y + box.height / 2.0;

      // Eye line target: Eyes sit at ~36% from the top of the cropped frame
      const eyeLineY = primaryTrack.landmarks ? primaryTrack.landmarks.leftEye.y : (box.y + box.height * 0.38);
      targetX = faceCenterX;
      targetY = Math.max(cropHeightNorm * 0.4, Math.min(cropHeightNorm * 0.7, eyeLineY + cropHeightNorm * (0.50 - this.config.headroomFactor)));

      explanation = `AI Centered on Track #${primaryTrack.trackId} (${(primaryTrack.prioritizationScore * 100).toFixed(0)}% score).`;
    } else {
      // Fallback: Slowly glide back to center
      targetX = 0.50;
      targetY = 0.50;
      explanation = 'No active face detected; holding smooth center position.';
    }

    // Clamp targets so crop window stays fully within frame bounds [0, 1]
    const halfCropW = cropWidthNorm / 2.0;
    const halfCropH = cropHeightNorm / 2.0;
    const minCenterNormX = halfCropW;
    const maxCenterNormX = 1.0 - halfCropW;
    const clampedTargetX = Math.max(minCenterNormX, Math.min(maxCenterNormX, targetX));
    const clampedTargetY = Math.max(halfCropH, Math.min(1.0 - halfCropH, targetY));

    // Handle Scene Cut / Shot Boundary: Instant Snap!
    if (isSceneCut) {
      this.currentPanX = clampedTargetX;
      this.currentPanY = clampedTargetY;
      this.currentVelocityX = 0;
      this.currentVelocityY = 0;
    } else {
      // Apply Deadband: Ignore micro-movements within deadband threshold
      const deltaX = clampedTargetX - this.currentPanX;
      const deltaY = clampedTargetY - this.currentPanY;

      if (Math.abs(deltaX) > this.config.deadbandPercent) {
        // Critically damped velocity-aware smoothing
        const desiredVelX = (deltaX / Math.max(0.01, dt)) * this.config.smoothingFactor;
        const clampedVelX = Math.max(-this.config.maxPanVelocity, Math.min(this.config.maxPanVelocity, desiredVelX));
        this.currentPanX += clampedVelX * dt;
      }

      if (Math.abs(deltaY) > this.config.deadbandPercent) {
        const desiredVelY = (deltaY / Math.max(0.01, dt)) * this.config.smoothingFactor;
        const clampedVelY = Math.max(-this.config.maxPanVelocity, Math.min(this.config.maxPanVelocity, desiredVelY));
        this.currentPanY += clampedVelY * dt;
      }
    }

    // Ensure smoothed position stays strictly within physical bounds
    this.currentPanX = Math.max(minCenterNormX, Math.min(maxCenterNormX, this.currentPanX));
    this.currentPanY = Math.max(halfCropH, Math.min(1.0 - halfCropH, this.currentPanY));

    // Calculate final normalized crop rectangle
    const cropX = Math.max(0, this.currentPanX - halfCropW);
    const cropY = Math.max(0, this.currentPanY - halfCropH);

    // Convert to percentage values (0 - 100%) for CSS / Canvas object-position
    const panRatioX = (maxCenterNormX > minCenterNormX)
      ? (this.currentPanX - minCenterNormX) / (maxCenterNormX - minCenterNormX)
      : 0.50;
    const panRatioY = (1.0 - cropHeightNorm > 0)
      ? cropY / (1.0 - cropHeightNorm)
      : 0.50;

    return {
      cropBox: {
        x: cropX,
        y: cropY,
        width: cropWidthNorm,
        height: cropHeightNorm,
      },
      panX: Math.round(panRatioX * 1000) / 10.0,
      panY: Math.round(panRatioY * 1000) / 10.0,
      zoom: this.currentZoom,
      activeTrackId: primaryTrack ? primaryTrack.trackId : null,
      secondaryTrackId: secondaryTrack ? secondaryTrack.trackId : null,
      isSceneCut,
      compositionMode: this.config.compositionMode,
      explanation,
    };
  }

  private getTargetRatioValue(aspect: '9:16' | '1:1' | '16:9' | '21:9'): number {
    switch (aspect) {
      case '9:16': return 9 / 16;
      case '1:1': return 1.0;
      case '16:9': return 16 / 9;
      case '21:9': return 21 / 9;
    }
  }
}
