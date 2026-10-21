/**
 * Intelligent Clip Boundary Optimizer.
 * Selects complete narrative and conversational segments [t_start, t_end] with setup,
 * core insight, and punchline/payoff, eliminating mid-word cuts and dead air.
 */

import { SubtitleSegment } from '../../types';

export interface OptimizedBoundary {
  startTime: number;
  endTime: number;
  duration: number;
  subtitles: SubtitleSegment[];
  transcriptText: string;
  boundaryScore: number; // 0-100 score of boundary elegance and completeness
  startsOnSentence: boolean;
  endsOnPayoff: boolean;
  trimmedDeadAirSeconds: number;
  explanation: string;
}

export interface BoundarySearchOptions {
  minDuration?: number; // e.g. 12s
  maxDuration?: number; // e.g. 50s
  preferredDuration?: number; // e.g. 30s
  shotBoundaries?: number[]; // Timestamps of visual scene cuts
}

const TRAILING_DANGLING_WORDS = new Set([
  'and', 'or', 'but', 'because', 'so', 'that', 'if', 'when', 'while', 'although',
  'though', 'whereas', 'with', 'as', 'like', 'um', 'uh', 'well', 'then', 'which', 'to'
]);

export class BoundaryOptimizer {
  /**
   * Optimizes the start and end timestamps around a candidate viral core moment.
   */
  public optimizeBoundaries(
    allSubtitles: SubtitleSegment[],
    seedStartTime: number,
    seedEndTime: number,
    options: BoundarySearchOptions = {}
  ): OptimizedBoundary {
    const minDur = options.minDuration || 14;
    const maxDur = options.maxDuration || 55;
    const preferredDur = options.preferredDuration || 30;

    if (!allSubtitles || allSubtitles.length === 0) {
      const duration = Math.max(minDur, Math.min(maxDur, seedEndTime - seedStartTime));
      return {
        startTime: seedStartTime,
        endTime: seedStartTime + duration,
        duration,
        subtitles: [],
        transcriptText: '',
        boundaryScore: 50,
        startsOnSentence: false,
        endsOnPayoff: false,
        trimmedDeadAirSeconds: 0,
        explanation: 'No subtitle segments provided; using raw seed bounds.',
      };
    }

    // 1. Locate subtitle index nearest to or containing seedStart
    let seedStartIndex = allSubtitles.findIndex((s) => s.end >= seedStartTime);
    if (seedStartIndex === -1) {
      seedStartIndex = allSubtitles.length - 1;
    }
    if (seedStartIndex < 0) seedStartIndex = 0;

    const LEADING_DANGLING_CONJUNCTIONS = /^(and|or|but|so|then|well|because|also|like)\b/i;

    // 2. Scan backward to find the earliest natural sentence start or question setup
    let bestStartIndex = seedStartIndex;

    for (let i = seedStartIndex; i >= 0; i--) {
      const seg = allSubtitles[i];
      const prevSeg = i > 0 ? allSubtitles[i - 1] : null;

      const startsWithCapital = /^[A-Z]/.test(seg.text.trim());
      const segStartsConjunction = LEADING_DANGLING_CONJUNCTIONS.test(seg.text.trim());

      // If previous segment ended with terminal punctuation, this seg is definitely a sentence start
      const prevEndedTerminal = prevSeg && /[.?!]$/.test(prevSeg.text.trim());
      // Large pause (>0.7s) before this segment also indicates a new thought
      const precededByPause = prevSeg && (seg.start - prevSeg.end >= 0.7);

      // If the previous segment was an introductory conjunction clause ending with a comma
      // e.g., "And in the morning,", then seg (starting with capital) is the true sentence start
      const prevWasIntroClause = prevSeg && prevSeg.text.trim().endsWith(',') && LEADING_DANGLING_CONJUNCTIONS.test(prevSeg.text.trim());

      if (prevEndedTerminal || precededByPause || (startsWithCapital && prevWasIntroClause)) {
        bestStartIndex = i;
        break;
      }

      if (i === 0) {
        // If segment 0 starts with a dangling conjunction and ends with a comma, prefer segment 1 if segment 1 starts with capital
        if (segStartsConjunction && seg.text.trim().endsWith(',') && allSubtitles.length > 1 && /^[A-Z]/.test(allSubtitles[1].text.trim())) {
          bestStartIndex = 1;
        } else {
          bestStartIndex = 0;
        }
        break;
      }

      const backwardDur = seedStartTime - seg.start;
      if (backwardDur > 14) {
        if (startsWithCapital) bestStartIndex = i;
        break;
      }

      if (startsWithCapital) {
        bestStartIndex = i;
      }
    }

    let startTime = Math.max(0, allSubtitles[bestStartIndex].start);

    // 3. Scan forward to find the satisfying conclusion, answer, or punchline
    let bestEndIndex = bestStartIndex;
    let candidateEndTime = startTime + preferredDur;
    let foundValidPayoff = false;

    for (let j = bestStartIndex; j < allSubtitles.length; j++) {
      const seg = allSubtitles[j];
      const curDuration = seg.end - startTime;

      if (curDuration >= minDur) {
        const text = seg.text.trim();
        const lastWord = text.split(/\s+/).pop()?.toLowerCase().replace(/[^\w]/g, '') || '';
        const isDangling = TRAILING_DANGLING_WORDS.has(lastWord) || /\.{2,}$|…$/.test(text) || /,\s*$/.test(text);
        const hasTerminalPunctuation = /[.?!]$/.test(text) && !/\.{2,}$|…$/.test(text);

        // Ideal ending: terminal punctuation, not dangling, and within max duration
        if (!isDangling && (hasTerminalPunctuation || curDuration >= preferredDur)) {
          bestEndIndex = j;
          candidateEndTime = seg.end;
          foundValidPayoff = true;
          if (curDuration >= preferredDur * 0.80) {
            break;
          }
        }
      }

      if (curDuration > maxDur) {
        break;
      }

      // If we haven't found any valid payoff yet and this is before minDur, keep candidate moving forward
      if (!foundValidPayoff && curDuration < minDur) {
        bestEndIndex = j;
        candidateEndTime = seg.end;
      }
    }

    // Ensure duration strictly satisfies minDuration by expanding if video boundary permitted
    while (candidateEndTime - startTime < minDur && bestStartIndex > 0) {
      bestStartIndex--;
      startTime = allSubtitles[bestStartIndex].start;
    }
    while (candidateEndTime - startTime < minDur && bestEndIndex < allSubtitles.length - 1) {
      bestEndIndex++;
      candidateEndTime = allSubtitles[bestEndIndex].end;
    }

    // Ensure duration strictly respects maxDuration
    while (candidateEndTime - startTime > maxDur && bestEndIndex > bestStartIndex) {
      bestEndIndex--;
      candidateEndTime = allSubtitles[bestEndIndex].end;
    }

    // 4. Extract bounded subtitles
    const boundedSubs = allSubtitles.slice(bestStartIndex, bestEndIndex + 1);
    const actualDuration = Math.round((candidateEndTime - startTime) * 10) / 10;
    const fullTranscript = boundedSubs.map((s) => s.text).join(' ').trim();

    // 5. Evaluate Boundary Quality
    let boundaryScore = 70;
    const startsOnSentence = /^[A-Z]/.test(boundedSubs[0]?.text || '');
    if (startsOnSentence) boundaryScore += 12;

    const lastSegText = boundedSubs[boundedSubs.length - 1]?.text || '';
    const endsWithTerminalPunc = /[.?!]$/.test(lastSegText);
    const lastWord = lastSegText.split(/\s+/).pop()?.toLowerCase().replace(/[^\w]/g, '') || '';
    const isDanglingEnd = TRAILING_DANGLING_WORDS.has(lastWord);

    if (endsWithTerminalPunc) boundaryScore += 12;
    if (isDanglingEnd) boundaryScore -= 20;

    // Check dead air between end of last speech and boundary
    const trimmedDeadAir = Math.max(0, candidateEndTime - (boundedSubs[boundedSubs.length - 1]?.end || candidateEndTime));
    if (trimmedDeadAir > 0.5) boundaryScore -= 8;

    boundaryScore = Math.min(100, Math.max(30, boundaryScore));

    return {
      startTime: Math.round(startTime * 100) / 100,
      endTime: Math.round(candidateEndTime * 100) / 100,
      duration: actualDuration,
      subtitles: boundedSubs,
      transcriptText: fullTranscript,
      boundaryScore,
      startsOnSentence,
      endsOnPayoff: endsWithTerminalPunc && !isDanglingEnd,
      trimmedDeadAirSeconds: Math.round(trimmedDeadAir * 100) / 100,
      explanation: endsWithTerminalPunc && !isDanglingEnd
        ? 'Clean complete sentence ending with no dangling conjunctions.'
        : 'Adjusted to preserve spoken cadence without cutting active words.',
    };
  }
}

export const boundaryOptimizerInstance = new BoundaryOptimizer();
