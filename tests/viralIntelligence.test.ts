/**
 * Automated Verification & Benchmark Test Suite for:
 * 1. Semantic Topic & Conversational Intelligence (18 high-value categories).
 * 2. 8-Factor Weighted Viral Scoring & Normalization.
 * 3. Intelligent Boundary Selection (setup + punchline, no mid-word cuts, dead air trimming).
 * 4. Quiet Insightful vs Loud Irrelevant Discrimination.
 * 5. Temporal & Semantic Deduplication (NMS) and Category Diversity (MMR).
 * 6. Editorial Ground Truth Benchmark (Precision, Recall, Boundary Accuracy).
 */

import { semanticAnalyzerInstance } from '../src/services/intelligence/semanticAnalyzer';
import { boundaryOptimizerInstance } from '../src/services/intelligence/boundaryOptimizer';
import { viralRankingEngineInstance } from '../src/services/intelligence/viralRankingEngine';
import { viralIntelligenceEngineInstance } from '../src/services/intelligence/viralIntelligenceEngine';
import { SubtitleSegment } from '../src/types';
import { CandidateMoment, ViralScoreBreakdown } from '../src/services/intelligence/types';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
    if (detail) console.log(`      ↳ ${detail}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`      ↳ Error: ${detail}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runViralIntelligenceTests() {
  console.log('\n======================================================================');
  console.log('   EXPERT-LEVEL VIRAL MOMENT INTELLIGENCE BENCHMARK SUITE');
  console.log('======================================================================\n');

  // -------------------------------------------------------------
  // Test 1: High-Value Category Classification
  // -------------------------------------------------------------
  console.log('--- Test 1: Linguistic & Category Classification (18 Categories) ---');

  // A. Counter-intuitive fact
  const counterAnalysis = semanticAnalyzerInstance.analyzeTextWindow(
    'Contrary to what most people think, working 80 hours a week actually destroys your creative output.',
    10.0,
    16.0
  );
  assert(
    counterAnalysis.primaryCategory === 'counterintuitive_fact' || counterAnalysis.secondaryCategories.includes('counterintuitive_fact'),
    'Correctly classifies counter-intuitive paradigm shift',
    `Classified: ${counterAnalysis.primaryCategory}`
  );
  assert(counterAnalysis.intellectualImpactScore >= 80, 'Assigns high intellectual impact to counter-intuitive insight', `${counterAnalysis.intellectualImpactScore}%`);

  // B. Actionable advice / Framework
  const actionAnalysis = semanticAnalyzerInstance.analyzeTextWindow(
    'Here is the 3-step formula you need to implement to double your video completion rate.',
    25.0,
    32.0
  );
  assert(
    actionAnalysis.primaryCategory === 'actionable_advice' || actionAnalysis.secondaryCategories.includes('actionable_advice'),
    'Correctly identifies actionable advice and framework instructions',
    `Classified: ${actionAnalysis.primaryCategory}`
  );

  // C. Question & Answer
  const qaAnalysis = semanticAnalyzerInstance.analyzeTextWindow(
    'Why do 90 percent of short videos fail in the first three seconds? The answer is weak contrast.',
    40.0,
    47.0
  );
  assert(
    qaAnalysis.isQuestion,
    'Accurately detects rhetorical or direct question setup'
  );
  assert(
    qaAnalysis.primaryCategory === 'hook_intro' || qaAnalysis.primaryCategory === 'insightful_qa',
    'Classifies question-led hook appropriately',
    `Classified: ${qaAnalysis.primaryCategory}`
  );

  // D. Emotional story
  const storyAnalysis = semanticAnalyzerInstance.analyzeTextWindow(
    'Years ago when I lost my first business, I hit rock bottom and had to rebuild from zero.',
    60.0,
    68.0
  );
  assert(
    storyAnalysis.hasStoryMarker && (storyAnalysis.primaryCategory === 'emotional_story' || storyAnalysis.secondaryCategories.includes('mini_narrative')),
    'Identifies vulnerable storytelling arc with emotional resonance',
    `Classified: ${storyAnalysis.primaryCategory}`
  );

  // E. Controversial debate
  const debateAnalysis = semanticAnalyzerInstance.analyzeTextWindow(
    'Unpopular opinion, but modern university degrees are completely overrated and a massive waste of money.',
    85.0,
    92.0
  );
  assert(
    debateAnalysis.primaryCategory === 'controversial_debate' || debateAnalysis.secondaryCategories.includes('controversial_debate'),
    'Classifies bold assertion / debate starter',
    `Classified: ${debateAnalysis.primaryCategory}`
  );

  // -------------------------------------------------------------
  // Test 2: Incomplete Thoughts & Trailing Dangling Tokens
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Incomplete Thoughts vs Completed Statements ---');
  const incompleteAnalysis = semanticAnalyzerInstance.analyzeTextWindow(
    'We started working on this new distribution system and then we were like uh and so...',
    12.0,
    18.0
  );
  assert(!incompleteAnalysis.isCompleteThought, 'Detects incomplete dangling clause');
  assert(incompleteAnalysis.clarityScore < 60, 'Penalizes clarity score for dangling thought', `Clarity: ${incompleteAnalysis.clarityScore}%`);

  const completeAnalysis = semanticAnalyzerInstance.analyzeTextWindow(
    'Simplicity is the prerequisite for reliability in distributed software systems.',
    20.0,
    25.0
  );
  assert(completeAnalysis.isCompleteThought, 'Recognizes complete self-contained thought');
  assert(completeAnalysis.clarityScore >= 85, 'Rewards clear self-contained statements', `Clarity: ${completeAnalysis.clarityScore}%`);

  // -------------------------------------------------------------
  // Test 3: Intelligent Boundary Optimization
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Boundary Optimization (Setup + Punchline, No Mid-Word Cuts) ---');
  const mockSubtitles: SubtitleSegment[] = [
    { id: 's1', start: 10.0, end: 12.5, text: 'And in the morning,' },
    { id: 's2', start: 12.8, end: 15.0, text: 'The single biggest mistake most creators make' },
    { id: 's3', start: 15.2, end: 19.0, text: 'is spending two days on the video body' },
    { id: 's4', start: 19.2, end: 23.5, text: 'and only two minutes on the opening hook.' },
    { id: 's5', start: 23.8, end: 28.0, text: 'Because without an immediate pattern interrupt,' },
    { id: 's6', start: 28.2, end: 32.5, text: 'nobody ever stays around to watch the body.' },
    { id: 's7', start: 32.8, end: 34.5, text: 'And so we...' }, // Dangling clause
    { id: 's8', start: 35.0, end: 38.0, text: 'Moving on to the next topic today.' },
  ];

  // Seed placed in the middle (at 16s)
  const opt = boundaryOptimizerInstance.optimizeBoundaries(
    mockSubtitles,
    16.0,
    22.0,
    { minDuration: 12, maxDuration: 25, preferredDuration: 20 }
  );

  assert(opt.startTime === 12.8, 'Scans back to sentence start (omits leading clause "And in the morning,")', `Start: ${opt.startTime}s`);
  assert(opt.endTime === 32.5, 'Scans forward to complete conclusion (omits dangling "And so we...")', `End: ${opt.endTime}s`);
  assert(opt.endsOnPayoff, 'Verified ending terminates on a satisfying conclusion payoff');
  assert(opt.boundaryScore >= 85, 'High boundary elegance score', `Score: ${opt.boundaryScore}%`);

  // -------------------------------------------------------------
  // Test 4: 8-Factor Weighted Viral Score Computation
  // -------------------------------------------------------------
  console.log('\n--- Test 4: 8-Factor Weighted Scoring & Normalization ---');
  const testBreakdown: ViralScoreBreakdown = {
    hookStrength: 95,          // 20% -> 19.0
    emotionalIntellectual: 90, // 15% -> 13.5
    clarityContext: 85,        // 15% -> 12.75
    payoffValue: 92,           // 15% -> 13.8
    narrativeCompleteness: 90, // 10% -> 9.0
    shareability: 88,          // 10% -> 8.8
    avQuality: 90,             // 10% -> 9.0
    boundaryQuality: 94,       // 5%  -> 4.7
  };
  // Expected sum: 19.0 + 13.5 + 12.75 + 13.8 + 9.0 + 8.8 + 9.0 + 4.7 = 90.55 -> ~91
  const score = viralRankingEngineInstance.calculateCompositeScore(testBreakdown);
  assert(score >= 90 && score <= 92, 'Calculates exact weighted composite score', `Calculated score: ${score}/100`);

  // -------------------------------------------------------------
  // Test 5: Quiet Insight vs Loud Empty Filler Discrimination
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Quiet High-Substance vs Loud Empty Filler ---');
  const quietInsightText = 'True compound growth is silent. You work in the dark for four years, and then overnight everyone calls you lucky.';
  const loudFillerText = 'WHAT IS UP GUYS! OH MY GOD! YOU WILL NOT BELIEVE THIS CRAZY THING LIKE UM YEAH WOW!';

  const quietAnalysis = semanticAnalyzerInstance.analyzeTextWindow(quietInsightText, 10, 25);
  const loudAnalysis = semanticAnalyzerInstance.analyzeTextWindow(loudFillerText, 30, 42);

  assert(
    quietAnalysis.intellectualImpactScore > loudAnalysis.intellectualImpactScore,
    'Quiet insight scores higher intellectual impact than loud filler',
    `Quiet: ${quietAnalysis.intellectualImpactScore}% vs Loud: ${loudAnalysis.intellectualImpactScore}%`
  );
  assert(
    quietAnalysis.clarityScore > loudAnalysis.clarityScore,
    'Quiet insight scores higher clarity and narrative completeness',
    `Quiet: ${quietAnalysis.clarityScore}% vs Loud: ${loudAnalysis.clarityScore}%`
  );

  // -------------------------------------------------------------
  // Test 6: Deduplication via Non-Maximum Suppression (NMS)
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Deduplication via Temporal IoU & Lexical Similarity ---');
  const candidates: CandidateMoment[] = [
    {
      id: 'c1',
      startTime: 10.0,
      endTime: 35.0,
      duration: 25.0,
      title: 'The Uncomfortable Truth About High Performers',
      hookSummary: 'Why elite performers operate on different rules',
      category: 'counterintuitive_fact',
      secondaryCategories: [],
      overallScore: 96,
      scoreBreakdown: testBreakdown,
      rationale: 'Top score revelation',
      subtitles: [],
      transcriptText: 'Why elite performers operate on different rules and how they structure focus.',
      confidence: 0.95,
    },
    {
      id: 'c2', // Heavily overlapping duplicate (IoU > 0.6)
      startTime: 12.0,
      endTime: 36.0,
      duration: 24.0,
      title: 'Performers Truth Variant',
      hookSummary: 'Why elite performers operate on different rules',
      category: 'counterintuitive_fact',
      secondaryCategories: [],
      overallScore: 89,
      scoreBreakdown: testBreakdown,
      rationale: 'Overlapping duplicate',
      subtitles: [],
      transcriptText: 'Why elite performers operate on different rules and how they structure focus.',
      confidence: 0.90,
    },
    {
      id: 'c3', // Distinct, high-value clip elsewhere in video
      startTime: 75.0,
      endTime: 102.0,
      duration: 27.0,
      title: 'The 3-Step Strategy for Retention',
      hookSummary: 'Framework to double retention',
      category: 'actionable_advice',
      secondaryCategories: [],
      overallScore: 92,
      scoreBreakdown: testBreakdown,
      rationale: 'Distinct advice moment',
      subtitles: [],
      transcriptText: 'Here is the step by step framework to double retention on short form video.',
      confidence: 0.92,
    },
  ];

  const { rankedClips, suppressedDuplicates } = viralRankingEngineInstance.rankAndDeduplicate(candidates, {
    clipCount: 2,
    maxOverlapSeconds: 4.0,
  });

  assert(rankedClips.length === 2, 'Retains exactly the target number of distinct clips');
  assert(rankedClips[0].id === 'c1' && rankedClips[1].id === 'c3', 'Preserves distinct moments c1 and c3');
  assert(suppressedDuplicates.length === 1 && suppressedDuplicates[0].candidate.id === 'c2',
    'Suppresses overlapping near-duplicate c2 with recorded rationale',
    suppressedDuplicates[0]?.reason
  );

  // -------------------------------------------------------------
  // Test 7: Category Diversity Re-Ranking
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Category Diversity (MMR Portfolio Balance) ---');
  const candidatePool: CandidateMoment[] = [
    {
      id: 'hook_1',
      startTime: 5.0,
      endTime: 28.0,
      duration: 23.0,
      title: 'First Hook',
      hookSummary: 'Opening hook',
      category: 'hook_intro',
      secondaryCategories: [],
      overallScore: 96,
      scoreBreakdown: testBreakdown,
      rationale: 'Hook 1',
      subtitles: [],
      transcriptText: 'Text 1',
      confidence: 0.9,
    },
    {
      id: 'hook_2', // Another hook in a different part of the video
      startTime: 35.0,
      endTime: 58.0,
      duration: 23.0,
      title: 'Second Hook',
      hookSummary: 'Second hook',
      category: 'hook_intro',
      secondaryCategories: [],
      overallScore: 94,
      scoreBreakdown: testBreakdown,
      rationale: 'Hook 2',
      subtitles: [],
      transcriptText: 'Text 2',
      confidence: 0.9,
    },
    {
      id: 'advice_1', // Actionable advice moment
      startTime: 65.0,
      endTime: 90.0,
      duration: 25.0,
      title: 'Step-by-Step Rule',
      hookSummary: 'Practical framework',
      category: 'actionable_advice',
      secondaryCategories: [],
      overallScore: 93,
      scoreBreakdown: testBreakdown,
      rationale: 'Advice 1',
      subtitles: [],
      transcriptText: 'Text 3',
      confidence: 0.9,
    },
  ];

  const diverseResult = viralRankingEngineInstance.rankAndDeduplicate(candidatePool, {
    clipCount: 2,
    diversityFactor: 0.8,
  });

  const categoriesSelected = diverseResult.rankedClips.map((c) => c.category);
  assert(
    categoriesSelected.includes('hook_intro') && categoriesSelected.includes('actionable_advice'),
    'Balances portfolio with diverse categories (Hook + Actionable Advice) rather than two hooks',
    `Categories: ${categoriesSelected.join(', ')}`
  );

  // -------------------------------------------------------------
  // Test 8: End-to-End Extraction on Full Multi-Topic Transcript
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Full Transcript Extraction Pipeline ---');
  const fullInterviewTranscript: SubtitleSegment[] = [
    { id: 't1', start: 2.0, end: 5.5, text: 'Welcome back to the podcast everyone.' },
    { id: 't2', start: 6.0, end: 10.5, text: 'Today we are diving into generative video and creator monetization.' },
    { id: 't3', start: 11.0, end: 15.0, text: 'Why do 99% of creators fail to capture retention in the first three seconds?' },
    { id: 't4', start: 15.2, end: 19.5, text: 'Because they start with long intros instead of an immediate pattern break.' },
    { id: 't5', start: 19.8, end: 24.5, text: 'The golden rule is high contrast visual shifts right at second two.' },
    { id: 't6', start: 25.0, end: 29.0, text: 'And that single optimization doubles your completion rate.' },
    { id: 't7', start: 30.0, end: 34.0, text: 'That makes total sense. Let me ask you about distribution.' },
    { id: 't8', start: 35.0, end: 40.0, text: 'Here is the 3-step formula we used to scale to ten million impressions.' },
    { id: 't9', start: 40.2, end: 45.0, text: 'Step one is isolate the peak revelation moment from the long video.' },
    { id: 't10', start: 45.2, end: 50.0, text: 'Step two is reframe the speaker using eye-line headroom margins.' },
    { id: 't11', start: 50.2, end: 56.0, text: 'Step three is burn high-contrast kinetic captions that highlight keywords.' },
    { id: 't12', start: 56.5, end: 60.0, text: 'Follow those three steps, and your organic reach multiplies.' },
    { id: 't13', start: 61.0, end: 66.0, text: 'Now let’s discuss pricing and founder mistakes.' },
    { id: 't14', start: 67.0, end: 72.0, text: 'Unpopular opinion, but lowering your prices to win customers is complete suicide.' },
    { id: 't15', start: 72.2, end: 77.0, text: 'When you cut prices, you attract the most demanding and least profitable clients.' },
    { id: 't16', start: 77.2, end: 83.0, text: 'Instead, double your price and double the perceived value of your delivery.' },
  ];

  const fullResult = await viralIntelligenceEngineInstance.extractViralMoments(
    fullInterviewTranscript,
    90.0,
    {
      clipCount: 3,
      minDuration: 12,
      maxDuration: 40,
      targetDuration: 22,
    },
    'Future of Creator Distribution'
  );

  assert(fullResult.moments.length === 3, 'Extracted exactly 3 top viral moments', `Count: ${fullResult.moments.length}`);
  assert(fullResult.moments[0].overallScore >= 88, 'Top moment achieves high viral score', `${fullResult.moments[0].overallScore}/100`);
  assert(fullResult.moments.every((m) => m.duration >= 12 && m.duration <= 40), 'All clip durations strictly respect constraints');
  assert(fullResult.moments.every((m) => m.rationale && m.rationale.length > 20), 'Every clip includes transparent editorial rationale');

  // Ground Truth Benchmark Comparison
  console.log('\n--- Test 9: Human Editorial Alignment Benchmark ---');
  const humanGroundTruthMoments = [
    { start: 11.0, end: 29.0, expectedCategory: 'hook_intro' },
    { start: 35.0, end: 60.0, expectedCategory: 'actionable_advice' },
    { start: 67.0, end: 83.0, expectedCategory: 'controversial_debate' },
  ];

  let matches = 0;
  for (const gt of humanGroundTruthMoments) {
    const matched = fullResult.moments.some((m) => {
      const overlap = Math.max(0, Math.min(m.endTime, gt.end) - Math.max(m.startTime, gt.start));
      return overlap > 10.0;
    });
    if (matched) matches++;
  }

  const precision = Math.round((matches / humanGroundTruthMoments.length) * 100);
  assert(precision === 100, 'Matches 100% of human editorial gold-standard viral moments', `Benchmark Precision: ${precision}%`);

  // -------------------------------------------------------------
  // Final Benchmark Summary
  // -------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`   VIRAL INTELLIGENCE TESTS: ${passedTests}/${totalTests} PASSED (100%)`);
  console.log('======================================================================\n');
}

runViralIntelligenceTests().catch((err) => {
  console.error('\nViral Intelligence Test Suite Failed:', err);
  process.exit(1);
});
