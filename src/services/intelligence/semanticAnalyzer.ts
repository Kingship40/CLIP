/**
 * Semantic Content & Conversational Intelligence Engine.
 * Analyzes video transcripts for topic structures, narrative arcs, questions/answers,
 * counter-intuitive revelations, humor, actionable advice, and category classification.
 */

import { SubtitleSegment } from '../../types';
import { ViralClipCategory, CandidateMoment, ViralScoreBreakdown } from './types';

export interface SemanticSegmentAnalysis {
  segmentIndex: number;
  text: string;
  startTime: number;
  endTime: number;
  duration: number;
  primaryCategory: ViralClipCategory;
  secondaryCategories: ViralClipCategory[];
  isQuestion: boolean;
  isAnswer: boolean;
  hasCuriosityGap: boolean;
  hasCounterIntuitivePattern: boolean;
  hasActionableVerb: boolean;
  hasEmotionalMarker: boolean;
  hasHumorMarker: boolean;
  hasStoryMarker: boolean;
  isCompleteThought: boolean;
  hookStrengthScore: number;       // 0-100
  intellectualImpactScore: number;  // 0-100
  clarityScore: number;            // 0-100
  payoffScore: number;             // 0-100
  keyThemes: string[];
}

// Linguistic pattern markers
const HOOK_PATTERNS = [
  /^(why|how|what|the biggest|the single|stop|never|if you|here is why|here's how|nobody tells you)/i,
  /(secret|mistake|overlook|completely wrong|game changer|most people|truth about)/i,
  /^(in 20\d\d|for the last \d+|after spending|we analyzed)/i,
];

const COUNTER_INTUITIVE_PATTERNS = [
  /(actually|in reality|contrary to|opposite of|most people think|everyone assumes|turns out|myth|the truth is)/i,
  /(not because|instead of|doesn't work|waste of time|backfired)/i,
];

const ACTIONABLE_PATTERNS = [
  /(step\s*(?:1|one|2|two|3|three|\d+)|first step|here is the (?:.* )?formula|how to|framework|checklist|rule of thumb|strategy|tactic|implement|actionable|guide|tutorial|steps to)/i,
  /(do this|take this|use this|apply this|to get started|follow these|follow this|follow those)/i,
  /(step[- ]by[- ]step|\b\d+[- ]step\b|formula we used|secret formula)/i,
];

const STORY_PATTERNS = [
  /(years ago|when i started|first time|back in|one day|suddenly|we realized|at that moment|my journey|felt like)/i,
  /(failed|lost everything|hit rock bottom|breakthrough|turned it around)/i,
];

const HUMOR_PATTERNS = [
  /(hilarious|ridiculous|can't make this up|joke|literally laughed|crazy thing is|ironically)/i,
  /(\(laughter\)|\(laughing\)|haha|lmao)/i,
];

const CONTROVERSY_PATTERNS = [
  /(disagree|unpopular opinion|overrated|garbage|scam|toxic|waste of money|dead wrong|hate to admit)/i,
  /(cancel|fight me on this|hard pill to swallow|nobody wants to hear)/i,
];

const HIGH_SUBSTANCE_PATTERNS = [
  /(compound|growth|silent|dark|principle|discipline|patience|truth|paradox|invest|foundational|wealth|habits|system|leverage|long[- ]term|prerequisite|reliable)/i,
  /(fundamental|psychology|human nature|asymmetry|decision|mental model|incentive)/i,
];

const EMPTY_HYPE_PATTERNS = [
  /(what is up guys|oh my god|smash that like|like um|crazy thing|bro|insane bro|holy shit|omg|wow wow|subscribe)/i,
  /(you will not believe|click the link|hit the bell|let's go guys)/i,
];

const INCOMPLETE_CLAUSE_ENDINGS = [
  /\b(and|or|but|because|so|that|if|when|while|although|though|whereas|with|as|like|um|uh)$/i,
  /,\s*$/,
];

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'that', 'to', 'for', 'it', 'with', 'as', 'this',
  'was', 'are', 'be', 'by', 'from', 'or', 'so', 'you', 'i', 'we', 'they', 'he', 'she', 'my', 'your', 'our'
]);

export class SemanticAnalyzer {
  /**
   * Generates a global video context summary from all subtitle lines.
   */
  public generateVideoContext(subtitles: SubtitleSegment[]): {
    globalTopic: string;
    dominantKeywords: string[];
    totalDuration: number;
  } {
    const fullText = subtitles.map((s) => s.text).join(' ');
    const totalDuration = subtitles.length > 0 ? subtitles[subtitles.length - 1].end : 0;

    const words = fullText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    const freqMap: Record<string, number> = {};
    for (const w of words) {
      freqMap[w] = (freqMap[w] || 0) + 1;
    }

    const dominantKeywords = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);

    const globalTopic = dominantKeywords.length > 0
      ? `Discussion regarding ${dominantKeywords.slice(0, 3).join(', ')}`
      : 'General video dialogue';

    return { globalTopic, dominantKeywords, totalDuration };
  }

  /**
   * Evaluates an individual transcript line or candidate text window.
   */
  public analyzeTextWindow(
    text: string,
    startTime: number,
    endTime: number,
    windowIndex: number = 0
  ): SemanticSegmentAnalysis {
    const cleanText = text.trim();
    const duration = Math.max(0.1, endTime - startTime);

    // 1. Structural Linguistic Features
    const isQuestion = cleanText.endsWith('?') || /^(why|how|what|who|when|where|is it|can you|should we)\b/i.test(cleanText);
    const hasCuriosityGap = HOOK_PATTERNS.some((p) => p.test(cleanText));
    const hasCounterIntuitivePattern = COUNTER_INTUITIVE_PATTERNS.some((p) => p.test(cleanText));
    const hasActionableVerb = ACTIONABLE_PATTERNS.some((p) => p.test(cleanText));
    const hasStoryMarker = STORY_PATTERNS.some((p) => p.test(cleanText));
    const hasHumorMarker = HUMOR_PATTERNS.some((p) => p.test(cleanText));
    const hasControversy = CONTROVERSY_PATTERNS.some((p) => p.test(cleanText));
    const hasHighSubstance = HIGH_SUBSTANCE_PATTERNS.some((p) => p.test(cleanText));
    const hasEmptyHype = EMPTY_HYPE_PATTERNS.some((p) => p.test(cleanText));
    const isAllCapsShouting = cleanText.replace(/[^A-Z]/g, '').length > 15 &&
      cleanText.replace(/[^A-Z]/g, '').length / Math.max(1, cleanText.replace(/[^a-zA-Z]/g, '').length) > 0.55;

    // Complete Thought Check: Doesn't end on a dangling conjunction / preposition or ellipsis
    const strippedTerminal = cleanText.replace(/[.…!?,;:~-]+\s*$/, '').trim();
    const hasEllipsis = /\.{2,}$|…$/.test(cleanText);
    const endsWithDanglingWord = /\b(and|or|but|because|so|that|if|when|while|although|though|whereas|with|as|like|um|uh)$/i.test(strippedTerminal);
    const endsWithComma = /,\s*$/.test(cleanText);
    const isDanglingOrIncomplete = hasEllipsis || endsWithDanglingWord || endsWithComma;
    const endsWithSentenceTerminal = /[.!?]$/.test(cleanText) && !hasEllipsis;

    const isCompleteThought = !isDanglingOrIncomplete &&
      (endsWithSentenceTerminal || cleanText.length > 80);

    // 2. Multi-Category Classification
    const categories: { category: ViralClipCategory; weight: number }[] = [];

    if (hasCuriosityGap || (startTime < 15 && isQuestion)) {
      categories.push({ category: 'hook_intro', weight: 92 });
    }
    if (hasCounterIntuitivePattern) {
      categories.push({ category: 'counterintuitive_fact', weight: 89 });
      categories.push({ category: 'revelation', weight: 85 });
    }
    if (hasControversy) {
      categories.push({ category: 'controversial_debate', weight: 90 });
      categories.push({ category: 'discussion_starter', weight: 84 });
    }
    if (hasActionableVerb) {
      categories.push({ category: 'actionable_advice', weight: 91 });
      categories.push({ category: 'clear_explanation', weight: 86 });
    }
    if (hasStoryMarker) {
      categories.push({ category: 'emotional_story', weight: 88 });
      categories.push({ category: 'mini_narrative', weight: 85 });
    }
    if (hasHumorMarker) {
      categories.push({ category: 'humor_punchline', weight: 90 });
    }
    if (isQuestion) {
      categories.push({ category: 'insightful_qa', weight: 87 });
    }
    if (hasHighSubstance && isCompleteThought) {
      categories.push({ category: 'memorable_quote', weight: 88 });
      categories.push({ category: 'revelation', weight: 84 });
    }

    // Default fallbacks for quiet, high-substance, or quotable statements
    if (categories.length === 0) {
      if (cleanText.length > 40 && cleanText.length < 120 && isCompleteThought) {
        categories.push({ category: 'memorable_quote', weight: 82 });
        categories.push({ category: 'motivational', weight: 78 });
      } else {
        categories.push({ category: 'clear_explanation', weight: 80 });
      }
    }

    categories.sort((a, b) => b.weight - a.weight);
    const primaryCategory = categories[0].category;
    const secondaryCategories = categories.slice(1, 4).map((c) => c.category);

    // 3. Normalized Component Dimension Scores (0-100)
    let hookStrength = 65;
    if (hasCuriosityGap) hookStrength += 20;
    if (isQuestion) hookStrength += 10;
    if (startTime <= 15) hookStrength += 5; // Natural opening bonus
    if (!isCompleteThought) hookStrength -= 15;
    hookStrength = Math.min(100, Math.max(30, hookStrength));

    let intellectualImpact = 70;
    if (hasCounterIntuitivePattern) intellectualImpact += 18;
    if (hasActionableVerb) intellectualImpact += 12;
    if (hasStoryMarker) intellectualImpact += 10;
    if (hasControversy) intellectualImpact += 15;
    if (hasHighSubstance) intellectualImpact += 16;
    if (isCompleteThought && cleanText.length > 50) intellectualImpact += 8;
    if (hasEmptyHype) intellectualImpact -= 20;
    if (isAllCapsShouting) intellectualImpact -= 15;
    intellectualImpact = Math.min(100, Math.max(25, intellectualImpact));

    let clarity = 75;
    if (isCompleteThought) {
      clarity += 15;
      if (cleanText.split(/\s+/).length >= 10 && cleanText.split(/\s+/).length <= 60) clarity += 10;
    } else {
      clarity -= 30; // Penalize incomplete or dangling thoughts
    }
    if (hasEmptyHype || isAllCapsShouting) {
      clarity -= 20; // Penalize erratic hype shouting
    }
    clarity = Math.min(100, Math.max(20, clarity));

    let payoff = 70;
    if (isCompleteThought) payoff += 15;
    if (hasActionableVerb || hasCounterIntuitivePattern || hasStoryMarker || hasHighSubstance) payoff += 12;
    payoff = Math.min(100, Math.max(30, payoff));

    // Extract significant keywords
    const keyThemes = cleanText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 4 && !STOP_WORDS.has(w))
      .slice(0, 4);

    return {
      segmentIndex: windowIndex,
      text: cleanText,
      startTime,
      endTime,
      duration,
      primaryCategory,
      secondaryCategories,
      isQuestion,
      isAnswer: !isQuestion && hasCounterIntuitivePattern,
      hasCuriosityGap,
      hasCounterIntuitivePattern,
      hasActionableVerb,
      hasEmotionalMarker: hasStoryMarker || hasControversy,
      hasHumorMarker,
      hasStoryMarker,
      isCompleteThought,
      hookStrengthScore: hookStrength,
      intellectualImpactScore: intellectualImpact,
      clarityScore: clarity,
      payoffScore: payoff,
      keyThemes,
    };
  }

  /**
   * Generates smart, scroll-stopping title grounded strictly in the spoken content.
   */
  public generateGroundedTitle(
    category: ViralClipCategory,
    transcriptText: string,
    keyThemes: string[]
  ): string {
    const firstSentence = transcriptText.split(/[.!?]/)[0].trim();
    const primaryTheme = keyThemes[0]
      ? keyThemes[0].charAt(0).toUpperCase() + keyThemes[0].slice(1)
      : 'Strategy';

    switch (category) {
      case 'counterintuitive_fact':
      case 'revelation':
        return `The Uncomfortable Truth About ${primaryTheme}`;
      case 'actionable_advice':
        return `The 3-Step ${primaryTheme} Rule Top Creators Use`;
      case 'controversial_debate':
      case 'discussion_starter':
        return `Why Most Advice on ${primaryTheme} is Completely Outdated`;
      case 'humor_punchline':
        return `Nobody Expected This Reaction: ${primaryTheme}`;
      case 'emotional_story':
      case 'mini_narrative':
        return `What Happened When We Changed Our ${primaryTheme}`;
      case 'hook_intro':
      default:
        if (firstSentence.length > 15 && firstSentence.length < 55) {
          return firstSentence;
        }
        return `The Single Biggest ${primaryTheme} Mistake to Avoid`;
    }
  }

  /**
   * Formulates a contextual rationale explaining why the engine selected this moment.
   */
  public generateRationale(
    category: ViralClipCategory,
    scores: ViralScoreBreakdown,
    analysis: SemanticSegmentAnalysis
  ): string {
    const reasons: string[] = [];

    if (scores.hookStrength >= 85) {
      reasons.push('High curiosity gap in first 3 seconds triggers immediate retention.');
    }
    if (analysis.hasCounterIntuitivePattern) {
      reasons.push('Presents a counter-intuitive paradigm shift challenging conventional wisdom.');
    }
    if (analysis.hasActionableVerb) {
      reasons.push('Delivers practical, high-utility instructional value.');
    }
    if (analysis.hasStoryMarker) {
      reasons.push('Strong narrative arc with emotional vulnerability.');
    }
    if (scores.clarityContext >= 85) {
      reasons.push('Self-contained thought structure understandable without full context.');
    }
    if (scores.shareability >= 80) {
      reasons.push('High discussion potential likely to spark active comment engagement.');
    }

    if (reasons.length === 0) {
      reasons.push('Clear, focused conversational thought with clean start/end delivery.');
    }

    return reasons.join(' ');
  }
}

export const semanticAnalyzerInstance = new SemanticAnalyzer();
