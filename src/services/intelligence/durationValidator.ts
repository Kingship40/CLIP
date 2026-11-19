/**
 * Duration Constraint & Exact Boundary Enforcement Engine.
 * Serves as the single source of truth across the frontend, backend, AI selection,
 * and FFmpeg render verification to guarantee that generated clips strictly respect
 * the user-selected duration.
 */

export interface DurationConstraint {
  minSeconds: number;
  maxSeconds: number;
  targetSeconds: number;
  mode: 'range' | 'exact';
  toleranceSeconds: number;
  label: string;
}

/**
 * Resolves a duration configuration (preset string, number, or custom range) into a
 * strict DurationConstraint.
 */
export function resolveDurationConstraint(
  targetDuration?: '15-30' | '30-60' | '60-90' | 'custom' | string | number | DurationConstraint,
  customDurationSeconds?: number,
  exactSeconds?: number
): DurationConstraint {
  // If already a resolved DurationConstraint, return it directly
  if (targetDuration && typeof targetDuration === 'object' && 'minSeconds' in targetDuration) {
    return targetDuration as DurationConstraint;
  }
  // 1. Direct exact duration
  if (exactSeconds && exactSeconds > 0) {
    const exact = Math.round(exactSeconds * 10) / 10;
    return {
      minSeconds: Math.max(5, exact - 0.5),
      maxSeconds: exact + 0.5,
      targetSeconds: exact,
      mode: 'exact',
      toleranceSeconds: 0.15, // Frame-level tolerance (approx 2-4 frames at 30fps)
      label: `Exact ${exact}s`,
    };
  }

  // 2. Numeric target
  if (typeof targetDuration === 'number') {
    const num = Math.round(targetDuration * 10) / 10;
    return {
      minSeconds: Math.max(5, num - 1.0),
      maxSeconds: num + 1.0,
      targetSeconds: num,
      mode: 'exact',
      toleranceSeconds: 0.2,
      label: `Exact ${num}s`,
    };
  }

  // 3. String preset matching
  const durStr = String(targetDuration || '30-60').trim().toLowerCase();

  if (durStr === '15-30') {
    return {
      minSeconds: 15.0,
      maxSeconds: 30.0,
      targetSeconds: 22.5,
      mode: 'range',
      toleranceSeconds: 0.35,
      label: '15-30s',
    };
  }

  if (durStr === '30-60') {
    return {
      minSeconds: 30.0,
      maxSeconds: 60.0,
      targetSeconds: 45.0,
      mode: 'range',
      toleranceSeconds: 0.45,
      label: '30-60s',
    };
  }

  if (durStr === '60-90') {
    return {
      minSeconds: 60.0,
      maxSeconds: 90.0,
      targetSeconds: 75.0,
      mode: 'range',
      toleranceSeconds: 0.5,
      label: '60-90s',
    };
  }

  if (durStr === 'custom' || customDurationSeconds) {
    const custom = Math.max(5, Number(customDurationSeconds) || 30);
    return {
      minSeconds: Math.max(5, custom - 1.0),
      maxSeconds: custom + 1.0,
      targetSeconds: custom,
      mode: 'exact',
      toleranceSeconds: 0.2,
      label: `Custom ${custom}s`,
    };
  }

  // Default to 30-60s if unrecognized
  return {
    minSeconds: 30.0,
    maxSeconds: 60.0,
    targetSeconds: 45.0,
    mode: 'range',
    toleranceSeconds: 0.45,
    label: '30-60s',
  };
}

/**
 * Validates whether the source video is sufficiently long to satisfy the requested duration.
 */
export function validateSourceDuration(
  sourceDurationSeconds: number,
  constraint: DurationConstraint
): { isValid: boolean; error?: string; effectiveConstraint: DurationConstraint } {
  if (sourceDurationSeconds <= 0) {
    return {
      isValid: false,
      error: 'Invalid source video duration.',
      effectiveConstraint: constraint,
    };
  }

  if (sourceDurationSeconds < constraint.minSeconds) {
    return {
      isValid: false,
      error: `Source video (${sourceDurationSeconds.toFixed(1)}s) is shorter than the minimum requested duration (${constraint.minSeconds}s).`,
      effectiveConstraint: {
        ...constraint,
        minSeconds: Math.max(3, sourceDurationSeconds * 0.8),
        maxSeconds: sourceDurationSeconds,
        targetSeconds: sourceDurationSeconds,
      },
    };
  }

  return {
    isValid: true,
    effectiveConstraint: constraint,
  };
}

/**
 * Adjusts candidate moment start and end timestamps so that the resulting clip strictly
 * satisfies the user-selected duration range or exact target, while keeping the core
 * moment centered and preserving conversational context.
 */
export function enforceClipDurationBoundaries(
  rawStart: number,
  rawEnd: number,
  constraint: DurationConstraint,
  sourceDuration: number = Infinity
): { startTime: number; endTime: number; duration: number } {
  let start = Math.max(0, Math.round(rawStart * 100) / 100);
  let end = Math.min(sourceDuration, Math.round(rawEnd * 100) / 100);
  let duration = end - start;

  // Midpoint of the core viral moment
  const coreCenter = start + duration / 2;

  if (constraint.mode === 'exact') {
    const target = Math.min(sourceDuration, constraint.targetSeconds);
    const half = target / 2;
    start = Math.max(0, coreCenter - half);
    end = start + target;

    if (end > sourceDuration) {
      end = sourceDuration;
      start = Math.max(0, end - target);
    }
  } else {
    // Mode is 'range': must be within [constraint.minSeconds, constraint.maxSeconds]
    if (duration < constraint.minSeconds) {
      const neededExpansion = constraint.minSeconds - duration;
      const expandBackward = neededExpansion / 2;
      const expandForward = neededExpansion / 2;

      start = Math.max(0, start - expandBackward);
      end = Math.min(sourceDuration, end + expandForward);

      // If hitting the beginning (start === 0), expand further forward
      if (end - start < constraint.minSeconds && end < sourceDuration) {
        end = Math.min(sourceDuration, start + constraint.minSeconds);
      }
      // If hitting the end of the video, expand further backward
      if (end - start < constraint.minSeconds && start > 0) {
        start = Math.max(0, end - constraint.minSeconds);
      }
    } else if (duration > constraint.maxSeconds) {
      const target = constraint.maxSeconds;
      const half = target / 2;
      start = Math.max(0, coreCenter - half);
      end = start + target;

      if (end > sourceDuration) {
        end = sourceDuration;
        start = Math.max(0, end - target);
      }
    }
  }

  start = Math.max(0, Math.round(start * 100) / 100);
  end = Math.min(sourceDuration, Math.round(end * 100) / 100);
  const finalDuration = Math.round((end - start) * 100) / 100;

  return {
    startTime: start,
    endTime: end,
    duration: finalDuration,
  };
}

/**
 * Checks whether an actual rendered or proposed duration satisfies the constraint within tolerance.
 */
export function isDurationCompliant(
  duration: number,
  constraint: DurationConstraint
): { compliant: boolean; diff: number; explanation: string } {
  const tol = constraint.toleranceSeconds;

  if (constraint.mode === 'exact') {
    const diff = Math.abs(duration - constraint.targetSeconds);
    const compliant = diff <= tol + 0.15; // Account for frame quantization
    return {
      compliant,
      diff,
      explanation: compliant
        ? `Output duration (${duration.toFixed(2)}s) matches target (${constraint.targetSeconds}s) within frame tolerance (±${tol}s).`
        : `Output duration (${duration.toFixed(2)}s) deviates from target (${constraint.targetSeconds}s) by ${diff.toFixed(2)}s.`,
    };
  }

  // Range mode
  const minAllowed = constraint.minSeconds - tol;
  const maxAllowed = constraint.maxSeconds + tol;
  const compliant = duration >= minAllowed && duration <= maxAllowed;
  const diff = duration < minAllowed
    ? minAllowed - duration
    : duration > maxAllowed
    ? duration - maxAllowed
    : 0;

  return {
    compliant,
    diff,
    explanation: compliant
      ? `Output duration (${duration.toFixed(2)}s) is within requested range [${constraint.minSeconds}s - ${constraint.maxSeconds}s].`
      : `Output duration (${duration.toFixed(2)}s) is outside requested range [${constraint.minSeconds}s - ${constraint.maxSeconds}s] by ${diff.toFixed(2)}s.`,
  };
}
