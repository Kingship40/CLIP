/**
 * Main-Subject Prioritization Engine.
 * Evaluates multi-modal signals (confidence, size, stability, speech activity,
 * audio alignment, center proximity, and hysteresis) to select the primary subject.
 */

import { TrackedFace } from './types';

export interface PrioritizationWeights {
  confidenceWeight: number; // default: 0.15
  sizeWeight: number; // default: 0.15
  centerWeight: number; // default: 0.15
  stabilityWeight: number; // default: 0.20
  speakingWeight: number; // default: 0.25
  audioSyncWeight: number; // default: 0.10
  hysteresisBonus: number; // default: 0.30
}

export interface PrioritizationDecision {
  primaryTrackId: number | null;
  secondaryTrackId: number | null;
  rankedTracks: TrackedFace[];
  explanation: string;
}

export class SubjectPrioritizer {
  private previousSubjectId: number | null = null;
  private currentSubjectLockedDuration: number = 0; // frames
  private weights: PrioritizationWeights;

  constructor(customWeights: Partial<PrioritizationWeights> = {}) {
    this.weights = {
      confidenceWeight: 0.15,
      sizeWeight: 0.15,
      centerWeight: 0.15,
      stabilityWeight: 0.20,
      speakingWeight: 0.25,
      audioSyncWeight: 0.10,
      hysteresisBonus: 0.30,
      ...customWeights,
    };
  }

  public reset(): void {
    this.previousSubjectId = null;
    this.currentSubjectLockedDuration = 0;
  }

  /**
   * Scores and ranks all visible tracks to select the main subject.
   */
  public prioritize(
    tracks: TrackedFace[],
    audioActivity: number = 0.5, // 0 to 1 audio energy / dialogue signal
    userLockedTrackId: number | null = null
  ): PrioritizationDecision {
    if (tracks.length === 0) {
      this.previousSubjectId = null;
      this.currentSubjectLockedDuration = 0;
      return {
        primaryTrackId: null,
        secondaryTrackId: null,
        rankedTracks: [],
        explanation: 'No faces detected in current frame.',
      };
    }

    // Direct User Selection Override
    if (userLockedTrackId !== null) {
      const userTrack = tracks.find(t => t.trackId === userLockedTrackId);
      if (userTrack) {
        this.previousSubjectId = userTrack.trackId;
        userTrack.prioritizationScore = 1.0;
        return {
          primaryTrackId: userTrack.trackId,
          secondaryTrackId: tracks.find(t => t.trackId !== userLockedTrackId)?.trackId || null,
          rankedTracks: [userTrack, ...tracks.filter(t => t.trackId !== userLockedTrackId)],
          explanation: `User locked onto Track #${userTrack.trackId}.`,
        };
      }
    }

    // Compute normalized feature scores for each track
    for (const track of tracks) {
      // 1. Confidence Score (0 to 1)
      const confScore = Math.max(0, Math.min(1, track.confidence));

      // 2. Size Score (Log-normalized to prevent large faces from dominating)
      const area = track.box.width * track.box.height;
      // Typical face is 2% - 15% of frame area
      const sizeScore = Math.min(1.0, Math.max(0.1, Math.log10(area * 100 + 1) / 1.5));

      // 3. Center Proximity Score (Distance from optical center [0.5, 0.4])
      const cx = track.box.x + track.box.width / 2;
      const cy = track.box.y + track.box.height / 2;
      const distFromCenter = Math.hypot((cx - 0.5) * 1.2, cy - 0.38);
      const centerScore = Math.max(0.0, 1.0 - distFromCenter * 1.5);

      // 4. Stability Score (Logarithmic reward for track age up to 90 frames / 3s)
      const stabilityScore = Math.min(1.0, Math.log10(track.hits + 1) / Math.log10(90));

      // 5. Speaking Activity Score (Visual mouth vertical variance)
      const speakingScore = track.speakingScore;

      // 6. Audio-Visual Correlation
      const audioSyncScore = track.isSpeaking && audioActivity > 0.3 ? 0.95 : 0.35;

      // 7. Hysteresis Bonus (Prevents jittery flip-flopping)
      const isPrevious = this.previousSubjectId === track.trackId;
      const hysteresis = isPrevious ? this.weights.hysteresisBonus : 0.0;

      // Total Weighted Score
      const totalScore =
        this.weights.confidenceWeight * confScore +
        this.weights.sizeWeight * sizeScore +
        this.weights.centerWeight * centerScore +
        this.weights.stabilityWeight * stabilityScore +
        this.weights.speakingWeight * speakingScore +
        this.weights.audioSyncWeight * audioSyncScore +
        hysteresis;

      track.prioritizationScore = Math.round(totalScore * 1000) / 1000;
      track.scoreBreakdown = {
        confidence: Math.round(confScore * 100) / 100,
        size: Math.round(sizeScore * 100) / 100,
        centerProximity: Math.round(centerScore * 100) / 100,
        stability: Math.round(stabilityScore * 100) / 100,
        speakingActivity: Math.round(speakingScore * 100) / 100,
        audioSync: Math.round(audioSyncScore * 100) / 100,
        hysteresis: Math.round(hysteresis * 100) / 100,
      };
    }

    // Sort descending by score
    const sorted = [...tracks].sort((a, b) => b.prioritizationScore - a.prioritizationScore);
    const chosen = sorted[0];
    const secondary = sorted.length > 1 ? sorted[1] : null;

    if (this.previousSubjectId === chosen.trackId) {
      this.currentSubjectLockedDuration++;
    } else {
      this.currentSubjectLockedDuration = 1;
    }
    this.previousSubjectId = chosen.trackId;

    // Formulate human-readable explainable rationale
    const b = chosen.scoreBreakdown!;
    const reasons: string[] = [];
    if (chosen.isSpeaking) reasons.push('Active speech detected');
    if (b.stability > 0.7) reasons.push('Stable established track');
    if (b.centerProximity > 0.75) reasons.push('Centrally positioned');
    if (b.hysteresis > 0) reasons.push('Temporal continuity bonus');

    const explanation = `Selected Track #${chosen.trackId} (Score ${(chosen.prioritizationScore * 100).toFixed(0)}%) - ${reasons.join(', ') || 'Highest confidence subject'}.`;

    return {
      primaryTrackId: chosen.trackId,
      secondaryTrackId: secondary ? secondary.trackId : null,
      rankedTracks: sorted,
      explanation,
    };
  }
}
