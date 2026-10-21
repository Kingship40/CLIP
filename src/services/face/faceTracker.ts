/**
 * ByteTrack-style Multi-Object Face Tracker with Kalman Filter motion prediction,
 * stable track IDs, two-stage detection association, and occlusion recovery.
 */

import { NormalizedRect, RawFaceDetection, TrackedFace, FaceLandmarks } from './types';
import { KalmanBoxTracker } from './kalmanFilter';

export interface TrackerOptions {
  maxLostFrames?: number; // frames to keep predicting before deleting (default: 30)
  minConfirmationHits?: number; // frames needed to confirm tentative track (default: 2)
  iouThreshold?: number; // minimum IoU for association (default: 0.28)
  highScoreThreshold?: number; // threshold separating high vs low score detections (default: 0.50)
}

interface InternalTrack {
  trackId: number;
  kalman: KalmanBoxTracker;
  box: NormalizedRect;
  interpolatedBox: NormalizedRect;
  confidence: number;
  landmarks?: FaceLandmarks;
  ageFrames: number;
  hits: number;
  timeSinceUpdate: number;
  state: 'tentative' | 'confirmed' | 'lost' | 'deleted';
  mouthHistory: number[]; // last 12 frames of mouth openness
  appearanceSignature?: number[];
}

export class ByteFaceTracker {
  private nextTrackId: number = 1;
  private tracks: InternalTrack[] = [];

  private maxLostFrames: number;
  private minConfirmationHits: number;
  private iouThreshold: number;
  private highScoreThreshold: number;

  constructor(options: TrackerOptions = {}) {
    this.maxLostFrames = options.maxLostFrames ?? 30;
    this.minConfirmationHits = options.minConfirmationHits ?? 2;
    this.iouThreshold = options.iouThreshold ?? 0.28;
    this.highScoreThreshold = options.highScoreThreshold ?? 0.50;
  }

  /**
   * Resets all tracks (e.g. on scene cuts / shot boundaries).
   */
  public reset(): void {
    this.tracks = [];
    this.nextTrackId = 1;
  }

  /**
   * Updates tracks with new detections from current video frame.
   */
  public update(detections: RawFaceDetection[]): TrackedFace[] {
    // 1. Predict new locations of all existing tracks via Kalman filter
    for (const track of this.tracks) {
      track.ageFrames++;
      track.timeSinceUpdate++;
      const predictedBox = track.kalman.predict();
      track.interpolatedBox = predictedBox;
      if (track.timeSinceUpdate > 0) {
        // If not updated yet this frame, use predicted box
        track.box = predictedBox;
        track.confidence = Math.max(0.1, track.confidence * 0.94); // decay confidence
      }
    }

    // 2. Partition detections into high-score (D_high) and low-score (D_low)
    const dHigh: RawFaceDetection[] = [];
    const dLow: RawFaceDetection[] = [];

    for (const d of detections) {
      if (d.confidence >= this.highScoreThreshold) {
        dHigh.push(d);
      } else if (d.confidence >= 0.25) {
        dLow.push(d);
      }
    }

    // 3. Stage 1 Association: Match D_high with all active/lost tracks
    const { matched: matchedStage1, unmatchedTracks: unmatchedTracks1, unmatchedDetections: unmatchedDHigh } =
      this.associateDetectionsToTracks(dHigh, this.tracks, this.iouThreshold);

    for (const [tIdx, dIdx] of matchedStage1) {
      this.updateTrackWithDetection(this.tracks[tIdx], dHigh[dIdx]);
    }

    // 4. Stage 2 Association: Match D_low with remaining unmatched tracks
    const remainingTracks = unmatchedTracks1.map(idx => this.tracks[idx]);
    const { matched: matchedStage2, unmatchedTracks: unmatchedTracks2 } =
      this.associateDetectionsToTracks(dLow, remainingTracks, Math.max(0.18, this.iouThreshold - 0.10));

    for (const [relTIdx, dIdx] of matchedStage2) {
      const origTrack = remainingTracks[relTIdx];
      this.updateTrackWithDetection(origTrack, dLow[dIdx]);
    }

    // 5. Create new tracks for unmatched high-confidence detections
    for (const dIdx of unmatchedDHigh) {
      this.createNewTrack(dHigh[dIdx]);
    }

    // 6. Update track states (confirmations & lost timeouts)
    const activeResults: TrackedFace[] = [];

    for (const track of this.tracks) {
      if (track.timeSinceUpdate === 0) {
        if (track.state === 'tentative' && track.hits >= this.minConfirmationHits) {
          track.state = 'confirmed';
        } else if (track.state === 'lost') {
          track.state = 'confirmed';
        }
      } else {
        if (track.timeSinceUpdate > this.maxLostFrames) {
          track.state = 'deleted';
        } else if (track.state === 'confirmed') {
          track.state = 'lost';
        }
      }

      // Compute speech activity from mouth variance
      const mouthVar = this.computeVariance(track.mouthHistory);
      const isSpeaking = mouthVar > 0.008 && track.confidence > 0.45;
      const speakingScore = Math.min(1.0, mouthVar * 40.0);

      // Return confirmed and recently lost tracks (with interpolated positions)
      if (track.state === 'confirmed' || (track.state === 'lost' && track.timeSinceUpdate <= 15)) {
        activeResults.push({
          trackId: track.trackId,
          box: track.box,
          interpolatedBox: track.interpolatedBox,
          velocity: track.kalman.getVelocities(),
          confidence: Math.round(track.confidence * 100) / 100,
          landmarks: track.landmarks,
          state: track.state,
          ageFrames: track.ageFrames,
          hits: track.hits,
          timeSinceUpdate: track.timeSinceUpdate,
          isSpeaking,
          speakingScore: Math.round(speakingScore * 100) / 100,
          mouthHistory: [...track.mouthHistory],
          prioritizationScore: 0,
        });
      }
    }

    // Filter out deleted tracks
    this.tracks = this.tracks.filter(t => t.state !== 'deleted');

    return activeResults;
  }

  private createNewTrack(detection: RawFaceDetection): void {
    const tracker = new KalmanBoxTracker(detection.box);
    this.tracks.push({
      trackId: this.nextTrackId++,
      kalman: tracker,
      box: detection.box,
      interpolatedBox: detection.box,
      confidence: detection.confidence,
      landmarks: detection.landmarks,
      ageFrames: 1,
      hits: 1,
      timeSinceUpdate: 0,
      state: this.minConfirmationHits <= 1 ? 'confirmed' : 'tentative',
      mouthHistory: [detection.mouthOpenness ?? 0],
    });
  }

  private updateTrackWithDetection(track: InternalTrack, detection: RawFaceDetection): void {
    track.kalman.update(detection.box);
    track.box = detection.box;
    track.interpolatedBox = detection.box;
    track.confidence = detection.confidence;
    track.landmarks = detection.landmarks || track.landmarks;
    track.hits++;
    track.timeSinceUpdate = 0;

    // Track mouth openness for active speaker analysis
    const openness = detection.mouthOpenness ?? 0;
    track.mouthHistory.push(openness);
    if (track.mouthHistory.length > 15) {
      track.mouthHistory.shift();
    }
  }

  /**
   * Cost matrix association using IoU and centroid distance penalties
   */
  private associateDetectionsToTracks(
    detections: RawFaceDetection[],
    tracks: InternalTrack[],
    threshold: number
  ): {
    matched: Array<[number, number]>;
    unmatchedTracks: number[];
    unmatchedDetections: number[];
  } {
    if (tracks.length === 0) {
      return {
        matched: [],
        unmatchedTracks: [],
        unmatchedDetections: detections.map((_, i) => i),
      };
    }

    if (detections.length === 0) {
      return {
        matched: [],
        unmatchedTracks: tracks.map((_, i) => i),
        unmatchedDetections: [],
      };
    }

    // Build cost / IoU matrix
    const matched: Array<[number, number]> = [];
    const usedTracks = new Set<number>();
    const usedDetections = new Set<number>();

    // Greedy maximum-IoU bipartite matching
    const pairs: Array<{ tIdx: number; dIdx: number; iou: number }> = [];

    for (let t = 0; t < tracks.length; t++) {
      for (let d = 0; d < detections.length; d++) {
        const iou = this.calculateIoU(tracks[t].box, detections[d].box);
        if (iou >= threshold) {
          pairs.push({ tIdx: t, dIdx: d, iou });
        }
      }
    }

    // Sort descending by IoU
    pairs.sort((a, b) => b.iou - a.iou);

    for (const pair of pairs) {
      if (!usedTracks.has(pair.tIdx) && !usedDetections.has(pair.dIdx)) {
        usedTracks.add(pair.tIdx);
        usedDetections.add(pair.dIdx);
        matched.push([pair.tIdx, pair.dIdx]);
      }
    }

    const unmatchedTracks: number[] = [];
    for (let t = 0; t < tracks.length; t++) {
      if (!usedTracks.has(t)) unmatchedTracks.push(t);
    }

    const unmatchedDetections: number[] = [];
    for (let d = 0; d < detections.length; d++) {
      if (!usedDetections.has(d)) unmatchedDetections.push(d);
    }

    return { matched, unmatchedTracks, unmatchedDetections };
  }

  private calculateIoU(a: NormalizedRect, b: NormalizedRect): number {
    const xA = Math.max(a.x, b.x);
    const yA = Math.max(a.y, b.y);
    const xB = Math.min(a.x + a.width, b.x + b.width);
    const yB = Math.min(a.y + a.height, b.y + b.height);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const boxAArea = a.width * a.height;
    const boxBArea = b.width * b.height;
    const unionArea = boxAArea + boxBArea - interArea;

    return unionArea > 0 ? interArea / unionArea : 0;
  }

  private computeVariance(arr: number[]): number {
    if (arr.length < 3) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }
}
