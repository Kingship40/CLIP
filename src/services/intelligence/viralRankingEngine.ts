/**
 * Viral Moment Ranking, Scoring & Diversity Engine.
 * Evaluates candidate clips across 8 normalized dimensions, deduplicates via Non-Maximum Suppression (NMS),
 * and maximizes category & temporal diversity.
 */

import { CandidateMoment, ViralScoreBreakdown, ViralIntelligenceConfig, DEFAULT_VIRAL_WEIGHTS } from './types';

export class ViralRankingEngine {
  /**
   * Computes the composite weighted score out of 100 from the 8 component dimensions.
   */
  public calculateCompositeScore(
    breakdown: ViralScoreBreakdown,
    customWeights: Record<keyof ViralScoreBreakdown, number> = DEFAULT_VIRAL_WEIGHTS
  ): number {
    const raw =
      breakdown.hookStrength * customWeights.hookStrength +
      breakdown.emotionalIntellectual * customWeights.emotionalIntellectual +
      breakdown.clarityContext * customWeights.clarityContext +
      breakdown.payoffValue * customWeights.payoffValue +
      breakdown.narrativeCompleteness * customWeights.narrativeCompleteness +
      breakdown.shareability * customWeights.shareability +
      breakdown.avQuality * customWeights.avQuality +
      breakdown.boundaryQuality * customWeights.boundaryQuality;

    return Math.round(Math.min(99, Math.max(50, raw)));
  }

  /**
   * Computes temporal Intersection over Union (IoU) between two time intervals.
   */
  public calculateTemporalIoU(
    startA: number,
    endA: number,
    startB: number,
    endB: number
  ): number {
    const interStart = Math.max(startA, startB);
    const interEnd = Math.min(endA, endB);
    const inter = Math.max(0, interEnd - interStart);

    const unionStart = Math.min(startA, startB);
    const unionEnd = Math.max(endA, endB);
    const union = Math.max(0.001, unionEnd - unionStart);

    return inter / union;
  }

  /**
   * Computes word token Jaccard similarity between two transcripts.
   */
  public calculateTranscriptSimilarity(textA: string, textB: string): { similarity: number; sharedCount: number } {
    const setA = new Set(
      textA.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((w) => w.length > 2)
    );
    const setB = new Set(
      textB.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((w) => w.length > 2)
    );

    if (setA.size === 0 || setB.size === 0) return { similarity: 0, sharedCount: 0 };

    let intersectionCount = 0;
    for (const item of setA) {
      if (setB.has(item)) intersectionCount++;
    }

    const unionCount = setA.size + setB.size - intersectionCount;
    const similarity = unionCount > 0 ? intersectionCount / unionCount : 0;
    return { similarity, sharedCount: intersectionCount };
  }

  /**
   * Filters and deduplicates candidates using Non-Maximum Suppression (NMS) and category diversity.
   */
  public rankAndDeduplicate(
    candidates: CandidateMoment[],
    config: Partial<ViralIntelligenceConfig> = {}
  ): {
    rankedClips: CandidateMoment[];
    suppressedDuplicates: { candidate: CandidateMoment; reason: string }[];
  } {
    const maxClips = config.clipCount || 3;
    const maxOverlap = config.maxOverlapSeconds ?? 4.0;
    const diversityFactor = config.diversityFactor ?? 0.4;

    const accepted: CandidateMoment[] = [];
    const suppressed: { candidate: CandidateMoment; reason: string }[] = [];
    const pool = [...candidates];

    // Iteratively select candidate with highest marginal viral relevance
    while (accepted.length < maxClips && pool.length > 0) {
      // Calculate effective score balancing viral impact and portfolio diversity (MMR)
      const scoredPool = pool.map((cand, index) => {
        let divPenalty = 0;
        const categoryCount = accepted.filter((a) => a.category === cand.category).length;
        if (categoryCount > 0) {
          divPenalty = diversityFactor * 15 * categoryCount;
        }
        const effectiveScore = cand.overallScore - divPenalty;
        return { cand, index, effectiveScore };
      });

      scoredPool.sort((a, b) => b.effectiveScore - a.effectiveScore);
      const best = scoredPool[0];

      // Remove selected candidate from pool
      pool.splice(best.index, 1);

      // Check for temporal or semantic duplication against already accepted clips
      let isDuplicate = false;
      let duplicateReason = '';

      for (const acc of accepted) {
        const iou = this.calculateTemporalIoU(best.cand.startTime, best.cand.endTime, acc.startTime, acc.endTime);
        const { similarity: textSim, sharedCount } = this.calculateTranscriptSimilarity(best.cand.transcriptText, acc.transcriptText);
        const overlapSeconds = Math.max(0, Math.min(best.cand.endTime, acc.endTime) - Math.max(best.cand.startTime, acc.startTime));
        const startDiff = Math.abs(best.cand.startTime - acc.startTime);

        // Substantial temporal overlap (IoU > 0.35 or temporal overlap > maxOverlap)
        if (iou > 0.35 || overlapSeconds > maxOverlap) {
          isDuplicate = true;
          duplicateReason = `Overlaps ${Math.round(iou * 100)}% with higher-scoring clip "${acc.title}" [${acc.startTime.toFixed(1)}s - ${acc.endTime.toFixed(1)}s]`;
          break;
        }

        // Substantial transcript similarity (near-identical talking points: >=60% match and at least 3 shared substantive words)
        if (textSim > 0.60 && sharedCount >= 3) {
          isDuplicate = true;
          duplicateReason = `Transcript conveys similar content (${Math.round(textSim * 100)}% similarity) to "${acc.title}"`;
          break;
        }

        // Near-exact boundary collision
        if (startDiff < Math.min(maxOverlap, 3.0)) {
          isDuplicate = true;
          duplicateReason = `Starts within ${startDiff.toFixed(1)}s of higher-scoring clip "${acc.title}"`;
          break;
        }
      }

      if (isDuplicate) {
        suppressed.push({ candidate: best.cand, reason: duplicateReason });
      } else {
        accepted.push(best.cand);
      }
    }

    // Evaluate all remaining unselected candidates in pool to check for duplicates of accepted clips
    for (const remaining of pool) {
      for (const acc of accepted) {
        const iou = this.calculateTemporalIoU(remaining.startTime, remaining.endTime, acc.startTime, acc.endTime);
        const { similarity: textSim, sharedCount } = this.calculateTranscriptSimilarity(remaining.transcriptText, acc.transcriptText);
        const overlapSeconds = Math.max(0, Math.min(remaining.endTime, acc.endTime) - Math.max(remaining.startTime, acc.startTime));
        const startDiff = Math.abs(remaining.startTime - acc.startTime);

        if (iou > 0.35 || overlapSeconds > maxOverlap || (textSim > 0.60 && sharedCount >= 3) || startDiff < Math.min(maxOverlap, 3.0)) {
          const reason = (iou > 0.35 || overlapSeconds > maxOverlap)
            ? `Overlaps ${Math.round(iou * 100)}% with higher-scoring clip "${acc.title}" [${acc.startTime.toFixed(1)}s - ${acc.endTime.toFixed(1)}s]`
            : (textSim > 0.60 && sharedCount >= 3)
            ? `Transcript conveys similar content (${Math.round(textSim * 100)}% similarity) to "${acc.title}"`
            : `Starts within ${startDiff.toFixed(1)}s of higher-scoring clip "${acc.title}"`;
          suppressed.push({ candidate: remaining, reason });
          break;
        }
      }
    }

    return {
      rankedClips: accepted,
      suppressedDuplicates: suppressed,
    };
  }
}

export const viralRankingEngineInstance = new ViralRankingEngine();
