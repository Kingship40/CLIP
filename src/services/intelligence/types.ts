/**
 * Types and interfaces for the Expert-Level Viral Moment Intelligence Engine.
 */

import { SubtitleSegment, ContentType, ClipPreference } from '../../types';

export type ViralClipCategory =
  | 'hook_intro'               // Attention-grabbing opening with high retention
  | 'revelation'                // Surprising revelation, secret, or plot twist
  | 'humor_punchline'           // Funny moment, joke setup + punchline, witty reaction
  | 'controversial_debate'      // Bold assertion, disagreement, debate, or challenge
  | 'memorable_quote'           // Concise, powerful, quotable soundbite
  | 'actionable_advice'         // Practical takeaway, tutorial step, or how-to strategy
  | 'emotional_story'           // Vulnerable personal experience, struggle, or empathy trigger
  | 'relatable_frustration'     // Common pain point, shared creator/business struggle
  | 'suspense_tension'          // Dramatic buildup, curiosity gap, anticipation + payoff
  | 'insightful_qa'             // Sharp question followed by a high-value answer
  | 'success_failure_lesson'    // Behind-the-scenes case study, expensive mistake, or win
  | 'visual_demonstration'      // High visual motion, physical demonstration, or software action
  | 'audience_reaction'         // Memorable exchange, guest laughter, shock, or turnaround
  | 'clear_explanation'         // Complex technical or abstract concept made brilliantly simple
  | 'counterintuitive_fact'     // "Everything you know about X is wrong" paradigm shift
  | 'mini_narrative'            // Complete micro-story: setup, struggle, resolution
  | 'motivational'              // Inspiring perspective supported by substantive insight
  | 'discussion_starter';       // Open-ended question inviting comments and debate

export interface ViralScoreBreakdown {
  hookStrength: number;          // 0-100 (Weight: 20%) Immediate curiosity, pattern interrupt
  emotionalIntellectual: number; // 0-100 (Weight: 15%) Surprise, revelation, amusement, insight
  clarityContext: number;        // 0-100 (Weight: 15%) Self-contained, understandable without full video
  payoffValue: number;           // 0-100 (Weight: 15%) Satisfying conclusion, actionable takeaway
  narrativeCompleteness: number; // 0-100 (Weight: 10%) Complete thought, no abrupt mid-sentence cut
  shareability: number;          // 0-100 (Weight: 10%) Discussion potential, repost value
  avQuality: number;             // 0-100 (Weight: 10%) Clear audio, speaker presence, visual interest
  boundaryQuality: number;       // 0-100 (Weight: 5%)  Precision edit, natural breath pause, no dead air
}

export interface CandidateMoment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  title: string;
  hookSummary: string;
  category: ViralClipCategory;
  secondaryCategories: ViralClipCategory[];
  overallScore: number;          // 0-100 Composite weighted score
  scoreBreakdown: ViralScoreBreakdown;
  rationale: string;             // Detailed explanation of why this moment was selected
  subtitles: SubtitleSegment[];
  transcriptText: string;
  contextPrequel?: string;       // 1-sentence background context if needed
  confidence: number;            // 0.0 - 1.0 confidence in detection & boundary accuracy
  speakerCount?: number;
  primarySpeakerId?: number;
  warnings?: string[];           // e.g. "Low visual movement", "Fast speech rate"
}

export interface ViralIntelligenceConfig {
  minDuration: number;           // Minimum clip duration in seconds (default: 15)
  maxDuration: number;           // Maximum clip duration in seconds (default: 60)
  targetDuration?: number;       // Ideal duration in seconds (e.g. 30)
  exactDuration?: number;        // Strict exact duration target in seconds
  durationMode?: 'range' | 'exact';
  toleranceSeconds?: number;
  clipCount: number;             // Desired number of clips
  diversityFactor: number;       // 0.0 (pure highest score) to 1.0 (maximum category diversity)
  maxOverlapSeconds: number;     // Maximum allowable temporal overlap between clips (default: 3.0)
  weights?: Partial<ViralScoreBreakdown>;
  contentType?: ContentType;     // Content type (podcast, interview, educational, tutorial, vlog, presentation, other)
  preferences?: ClipPreference[]; // User clip focus preferences
}

export const DEFAULT_VIRAL_WEIGHTS: Record<keyof ViralScoreBreakdown, number> = {
  hookStrength: 0.20,
  emotionalIntellectual: 0.15,
  clarityContext: 0.15,
  payoffValue: 0.15,
  narrativeCompleteness: 0.10,
  shareability: 0.10,
  avQuality: 0.10,
  boundaryQuality: 0.05,
};
