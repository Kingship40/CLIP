import { Project, ProjectConfig, ProcessingJob, ProcessingStage, Clip, SubtitleSegment } from '../types';
import { viralIntelligenceEngineInstance } from './intelligence/viralIntelligenceEngine';
import { resolveDurationConstraint, validateSourceDuration, enforceClipDurationBoundaries } from './intelligence/durationValidator';
import { transcriptionServiceInstance, syncTranscriptToClip, ensureWordTimings } from './transcriptionService';

export const PIPELINE_STAGES: Omit<ProcessingStage, 'status'>[] = [
  {
    id: 'stage_prep',
    title: 'Preparing Video',
    description: 'Validating container format, decoding video track, and preparing audio streams.',
  },
  {
    id: 'stage_transcribe',
    title: 'Analyzing Content',
    description: 'Simulating speech-to-text tokenization and semantic topic segmentation.',
  },
  {
    id: 'stage_highlights',
    title: 'Identifying Highlights',
    description: 'Evaluating hook retention scores, curiosity gaps, and key takeaways.',
  },
  {
    id: 'stage_clipping',
    title: 'Creating Clip Segments',
    description: 'Calculating optimal start/end timestamps and 9:16 vertical crop framing.',
  },
  {
    id: 'stage_captions',
    title: 'Preparing Captions',
    description: 'Aligning kinetic word timing, keyword highlights, and typography styles.',
  },
  {
    id: 'stage_finalizing',
    title: 'Finalizing Previews',
    description: 'Generating timeline scrubbing previews and saving project workspace.',
  },
];

export interface IClippingService {
  isDemoService: boolean;
  createJob(
    project: Project,
    onProgressUpdate?: (job: ProcessingJob) => void
  ): Promise<ProcessingJob>;
  cancelJob(jobId: string): Promise<boolean>;
  generateClips(project: Project, subtitles?: SubtitleSegment[]): Promise<Clip[]>;
  generateSimulatedClips(project: Project): Clip[];
}

/**
 * DemoClippingService simulates the multi-stage AI workflow on the client side.
 * Clearly informs the user that no actual backend AI is running unless connected.
 */
export class DemoClippingService implements IClippingService {
  public isDemoService = true;
  private activeJobs: Map<string, { cancelled: boolean }> = new Map();

  async createJob(
    project: Project,
    onProgressUpdate?: (job: ProcessingJob) => void
  ): Promise<ProcessingJob> {
    const jobId = `job_${Date.now()}`;
    this.activeJobs.set(jobId, { cancelled: false });

    const stages: ProcessingStage[] = PIPELINE_STAGES.map((s, index) => ({
      ...s,
      status: index === 0 ? 'in_progress' : 'pending',
    }));

    const job: ProcessingJob = {
      id: jobId,
      projectId: project.id,
      progress: 5,
      currentStageIndex: 0,
      stages,
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    onProgressUpdate?.({ ...job });

    // Step through each of the 6 stages with realistic timing
    const stageDurationMs = 1200; // ~7.2 seconds total processing time
    const totalStages = stages.length;

    for (let i = 0; i < totalStages; i++) {
      const jobControl = this.activeJobs.get(jobId);
      if (jobControl?.cancelled) {
        job.status = 'cancelled';
        job.stages[i].status = 'failed';
        onProgressUpdate?.({ ...job });
        throw new Error('Clipping job cancelled by user.');
      }

      // Update current stage to in_progress
      job.currentStageIndex = i;
      job.stages = job.stages.map((st, idx) => {
        if (idx < i) return { ...st, status: 'completed' };
        if (idx === i) return { ...st, status: 'in_progress' };
        return { ...st, status: 'pending' };
      });

      // Progress sub-ticks for smoother animation
      const startProgress = Math.round((i / totalStages) * 95);
      const endProgress = Math.round(((i + 1) / totalStages) * 95);

      for (let step = 0; step < 4; step++) {
        await new Promise((r) => setTimeout(r, stageDurationMs / 4));
        if (this.activeJobs.get(jobId)?.cancelled) break;
        job.progress = Math.min(95, startProgress + Math.round(((endProgress - startProgress) * (step + 1)) / 4));
        onProgressUpdate?.({ ...job });
      }

      job.stages[i].status = 'completed';
    }

    job.progress = 100;
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    onProgressUpdate?.({ ...job });

    this.activeJobs.delete(jobId);
    return job;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const jobControl = this.activeJobs.get(jobId);
    if (jobControl) {
      jobControl.cancelled = true;
      return true;
    }
    return false;
  }

  async generateClips(project: Project, subtitles?: SubtitleSegment[]): Promise<Clip[]> {
    if (!project.sourceVideo?.url) {
      throw new Error(
        'Cannot generate clips: No authorized media stream or video file is available for processing.'
      );
    }

    const config = project.config;
    const clipCount =
      typeof config.clipCount === 'number'
        ? config.clipCount
        : config.customClipCount || 3;

    const rawDuration = project.sourceVideo.duration || 120;
    const constraint = resolveDurationConstraint(
      config.targetDuration,
      config.customDurationSeconds
    );
    const validation = validateSourceDuration(rawDuration, constraint);
    const effectiveConstraint = validation.effectiveConstraint;
    const videoDuration = Math.max(effectiveConstraint.minSeconds, rawDuration);

    // 1. Automatic Speech Recognition (ASR): Transcribe video if subtitles not already provided
    let resolvedSubtitles = subtitles;
    if (!resolvedSubtitles || resolvedSubtitles.length === 0) {
      try {
        const transcript = await transcriptionServiceInstance.transcribeVideo(
          project.sourceVideo.url,
          { language: config.language || 'auto' }
        );
        if (transcript.hasSpeech && transcript.subtitles.length > 0) {
          resolvedSubtitles = transcript.subtitles;
        }
      } catch (err) {
        console.warn('Automatic speech recognition during clipping:', err);
      }
    }

    const result = await viralIntelligenceEngineInstance.extractViralMoments(
      resolvedSubtitles || [],
      videoDuration,
      {
        clipCount,
        targetDuration: effectiveConstraint.targetSeconds,
        minDuration: effectiveConstraint.minSeconds,
        maxDuration: effectiveConstraint.maxSeconds,
        exactDuration: effectiveConstraint.mode === 'exact' ? effectiveConstraint.targetSeconds : undefined,
        durationMode: effectiveConstraint.mode,
        toleranceSeconds: effectiveConstraint.toleranceSeconds,
        contentType: config.contentType,
        preferences: config.preferences,
      },
      project.name || project.sourceVideo.name
    );

    const momentsClips = viralIntelligenceEngineInstance.convertMomentsToClips(result.moments, project);
    return momentsClips;
  }

  /**
   * Generates realistic simulated clips based on project video metadata & configuration
   */
  generateSimulatedClips(project: Project): Clip[] {
    const config = project.config;
    const clipCount =
      typeof config.clipCount === 'number'
        ? config.clipCount
        : config.customClipCount || 3;

    const rawDuration = project.sourceVideo.duration || 120;
    const constraint = resolveDurationConstraint(
      config.targetDuration,
      config.customDurationSeconds
    );
    const validation = validateSourceDuration(rawDuration, constraint);
    const effectiveConstraint = validation.effectiveConstraint;
    const videoDuration = Math.max(effectiveConstraint.minSeconds, rawDuration);
    const targetSeconds = effectiveConstraint.targetSeconds;

    const contentType = config.contentType || 'podcast';

    const contentIdeasMap: Record<string, Array<{
      title: string;
      description: string;
      hook: string;
      score: number;
      category: string;
      tags: string[];
      phrases: string[];
      breakdown: any;
    }>> = {
      educational: [
        {
          title: 'The Core Principle Behind Cognitive Retention',
          description: 'Explains how active recall and spaced repetition form durable long-term memory structures.',
          hook: 'Why traditional passive re-reading has a 90% forgetting rate within 48 hours.',
          score: 96,
          category: 'clear_explanation',
          tags: ['#LearningScience', '#Neuroscience', '#StudyHacks'],
          phrases: ['Why 90% of students forget what they read', 'is because passive re-reading creates an illusion of competence', 'instead of testing retrieval strength.', 'Active recall forces the brain to build synaptic pathways.'],
          breakdown: { hookStrength: 96, emotionalIntellectual: 98, clarityContext: 95, payoffValue: 97, narrativeCompleteness: 94, shareability: 95, avQuality: 92, boundaryQuality: 94 },
        },
        {
          title: 'Why Intuition Fails in High-Complexity Systems',
          description: 'A deep dive into second-order effects and counterintuitive system dynamics.',
          hook: 'The mathematical reason simple intuitive solutions often create the worst outcomes.',
          score: 93,
          category: 'counterintuitive_fact',
          tags: ['#SystemsThinking', '#DecisionMaking', '#MentalModels'],
          phrases: ['In complex nonlinear systems, cause and effect', 'are separated in both space and time.', 'When you fix an immediate symptom,', 'you often amplify the underlying systemic failure.'],
          breakdown: { hookStrength: 94, emotionalIntellectual: 96, clarityContext: 92, payoffValue: 94, narrativeCompleteness: 92, shareability: 93, avQuality: 90, boundaryQuality: 92 },
        },
        {
          title: 'The Mental Model That Predicts Compounding Growth',
          description: 'How non-linear returns reshape career trajectories and technological adoption.',
          hook: 'Most people think linearly while every breakthrough technology compounds exponentially.',
          score: 91,
          category: 'actionable_advice',
          tags: ['#ExponentialGrowth', '#MentalModels', '#Strategy'],
          phrases: ['Human intuition is fundamentally calibrated for linear growth.', 'One plus one equals two.', 'Compounding yields thirty steps turning into a billion meters.', 'Position yourself where the derivative is increasing.'],
          breakdown: { hookStrength: 92, emotionalIntellectual: 94, clarityContext: 90, payoffValue: 92, narrativeCompleteness: 90, shareability: 91, avQuality: 90, boundaryQuality: 90 },
        },
        {
          title: 'The 3 Laws of Information Entropy',
          description: 'How communication breaks down across organizational layers and how to prevent it.',
          hook: 'Every layer of management cuts context by 50% unless this one protocol is used.',
          score: 89,
          category: 'revelation',
          tags: ['#ManagementScience', '#Communication', '#Leadership'],
          phrases: ['Every message transferred through an intermediary loses context.', 'The Shannon limit applies to human conversation.', 'Write asynchronous memos instead of oral briefings.', 'Clarity of thought requires clarity of prose.'],
          breakdown: { hookStrength: 90, emotionalIntellectual: 90, clarityContext: 92, payoffValue: 90, narrativeCompleteness: 88, shareability: 89, avQuality: 88, boundaryQuality: 88 },
        },
        {
          title: 'How Deep Neural Networks Actually Learn Features',
          description: 'Brilliant conceptual breakdown of hierarchical latent representations without dense jargon.',
          hook: 'From edge detection to semantic abstract concepts in 5 layers.',
          score: 87,
          category: 'clear_explanation',
          tags: ['#ArtificialIntelligence', '#MachineLearning', '#TechExplained'],
          phrases: ['Layer one detects simple contrast edges and gradients.', 'Layer two combines edges into basic geometric primitives.', 'By layer four, the network understands faces and semantic objects.', 'It is hierarchical compression of reality.'],
          breakdown: { hookStrength: 88, emotionalIntellectual: 92, clarityContext: 88, payoffValue: 88, narrativeCompleteness: 86, shareability: 88, avQuality: 88, boundaryQuality: 86 },
        },
      ],
      tutorial: [
        {
          title: 'Step 1: The Essential Configuration You Cannot Skip',
          description: 'Actionable walkthrough showing how setting environment boundaries early prevents 90% of runtime bugs.',
          hook: 'If you do not configure this setting first, the whole pipeline breaks silently.',
          score: 95,
          category: 'actionable_advice',
          tags: ['#CodingTutorial', '#DevTips', '#WorkflowAutomation'],
          phrases: ['Before writing a single line of application code,', 'you must configure this exact environment variable.', 'Without this flag enabled, silent timeouts occur.', 'Here is how to set it in under 30 seconds.'],
          breakdown: { hookStrength: 96, emotionalIntellectual: 92, clarityContext: 96, payoffValue: 98, narrativeCompleteness: 94, shareability: 93, avQuality: 92, boundaryQuality: 95 },
        },
        {
          title: 'Live Walkthrough: Zero to Production in 3 Minutes',
          description: 'Fast-paced hands-on demonstration deploying a production-ready containerized service.',
          hook: 'Watch how fast this deploys without touching cloud console dashboards.',
          score: 92,
          category: 'visual_demonstration',
          tags: ['#DevOps', '#CloudDeploy', '#TechHacks'],
          phrases: ['Watch the terminal on the left as we run the deploy script.', 'The entire Docker image builds in twelve seconds.', 'Traffic is now routed to the global edge network.', 'That is complete production deployment in three commands.'],
          breakdown: { hookStrength: 94, emotionalIntellectual: 90, clarityContext: 94, payoffValue: 94, narrativeCompleteness: 92, shareability: 92, avQuality: 90, boundaryQuality: 92 },
        },
        {
          title: 'The Pro-Level Shortcut That Saves 10 Hours a Week',
          description: 'Reveals little-known keyboard shortcuts and command-line aliases that 10x developer velocity.',
          hook: 'Stop clicking nested menu items when this one key combination does it instantly.',
          score: 90,
          category: 'actionable_advice',
          tags: ['#ProductivityTips', '#Shortcuts', '#EngineeringWorkflow'],
          phrases: ['Most engineers waste thirty minutes a day navigating submenus.', 'Press Command Shift P and type this immediate alias.', 'It executes the entire test suite in watch mode.', 'Save this shortcut to your daily muscle memory.'],
          breakdown: { hookStrength: 92, emotionalIntellectual: 88, clarityContext: 92, payoffValue: 92, narrativeCompleteness: 90, shareability: 91, avQuality: 88, boundaryQuality: 90 },
        },
        {
          title: 'Avoid This Costly Database Migration Trap',
          description: 'Shows why table locks during migrations bring down live web traffic and how to do zero-downtime schema changes.',
          hook: 'This single SQL statement locked our database table for 45 minutes.',
          score: 88,
          category: 'actionable_advice',
          tags: ['#Databases', '#BackendEngineering', '#ProductionCrash'],
          phrases: ['Never run ALTER TABLE with default values on millions of rows.', 'It acquires an exclusive lock that queues every read request.', 'Instead, add the nullable column first,', 'then backfill asynchronously in batch chunks.'],
          breakdown: { hookStrength: 90, emotionalIntellectual: 88, clarityContext: 90, payoffValue: 90, narrativeCompleteness: 88, shareability: 89, avQuality: 88, boundaryQuality: 88 },
        },
      ],
      interview: [
        {
          title: 'The Hardest Decision I Ever Made as Founder',
          description: 'Candid conversation revealing the brutal emotional reality of having 3 weeks of runway left.',
          hook: 'We were 21 days from running out of cash with 18 employees.',
          score: 97,
          category: 'emotional_story',
          tags: ['#FounderStory', '#StartupStruggles', '#VentureCapital'],
          phrases: ['We had twenty-one days of payroll left in the bank account.', 'I could not sleep for three straight weeks.', 'Then we decided to completely pivot our pricing model.', 'That single weekend saved the entire enterprise.'],
          breakdown: { hookStrength: 98, emotionalIntellectual: 97, clarityContext: 94, payoffValue: 96, narrativeCompleteness: 95, shareability: 96, avQuality: 94, boundaryQuality: 94 },
        },
        {
          title: 'What Nobody Tells You About Venture Capital Meetings',
          description: 'Behind-the-scenes breakdown of what institutional investors look for during partner meetings.',
          hook: 'The real decision happens in the hallway 5 minutes after you leave the room.',
          score: 94,
          category: 'revelation',
          tags: ['#VentureCapital', '#Fundraising', '#StartupAdvice'],
          phrases: ['Partners rarely debate your product metrics in detail.', 'They debate founder conviction and market sizing.', 'If one partner champions your vision with real passion,', 'the consensus decision follows within thirty minutes.'],
          breakdown: { hookStrength: 95, emotionalIntellectual: 94, clarityContext: 92, payoffValue: 94, narrativeCompleteness: 92, shareability: 95, avQuality: 92, boundaryQuality: 92 },
        },
        {
          title: 'The Exact Moment We Knew We Had Product-Market Fit',
          description: 'How organic word-of-mouth referral transformed an overlooked side project into a Category leader.',
          hook: 'When users started writing custom scripts to bypass our server limits, we knew.',
          score: 91,
          category: 'insightful_qa',
          tags: ['#ProductMarketFit', '#SaaSGrowth', '#FounderJourney'],
          phrases: ['For eighteen months nobody cared about our landing page.', 'Then we launched this one open-source command line tool.', 'Overnight people built communities around the repository.', 'That is what authentic demand pull actually feels like.'],
          breakdown: { hookStrength: 92, emotionalIntellectual: 92, clarityContext: 90, payoffValue: 92, narrativeCompleteness: 90, shareability: 92, avQuality: 90, boundaryQuality: 90 },
        },
      ],
      vlog: [
        {
          title: 'We Flew 14 Hours and Found This Secret Spot',
          description: 'High-energy storytelling showing unexpected adventures and spontaneous local discoveries.',
          hook: 'The map said this road ended, but look what is on the other side.',
          score: 95,
          category: 'mini_narrative',
          tags: ['#TravelVlog', '#AdventureTime', '#HiddenGems'],
          phrases: ['We took a spontaneous turn down an unmarked dirt trail,', 'and stumbled upon the most breathtaking hidden view.', 'Look at how the sunlight hits the cliff face.', 'This is why you never plan every single hour of travel.'],
          breakdown: { hookStrength: 96, emotionalIntellectual: 94, clarityContext: 92, payoffValue: 94, narrativeCompleteness: 94, shareability: 96, avQuality: 94, boundaryQuality: 92 },
        },
        {
          title: 'The Craziest Thing Happened When We Stopped Filming',
          description: 'Unfiltered authentic vlog moment capturing unexpected comedy and honest reactions.',
          hook: 'Right as I turned off the main camera, this happened.',
          score: 92,
          category: 'humor_punchline',
          tags: ['#VlogMoments', '#BehindTheScenes', '#RealLife'],
          phrases: ['I thought we had wrapped the shoot for the evening,', 'and suddenly the entire studio set fell over.', 'Look at everyone trying to keep a straight face.', 'Some of the best memories are the unscripted blunders.'],
          breakdown: { hookStrength: 94, emotionalIntellectual: 92, clarityContext: 90, payoffValue: 92, narrativeCompleteness: 90, shareability: 94, avQuality: 90, boundaryQuality: 90 },
        },
      ],
      presentation: [
        {
          title: 'The Market Shift That Changes Our Entire 2026 Strategy',
          description: 'Executive summary detailing shifting consumer behavior and enterprise investment priorities.',
          hook: 'Customer acquisition costs grew 240% across every traditional digital channel.',
          score: 96,
          category: 'revelation',
          tags: ['#Keynote', '#ExecutiveSummary', '#Strategy2026'],
          phrases: ['Our data across ten thousand accounts reveals a clear inflection point.', 'Customer acquisition costs have surged two hundred forty percent.', 'Direct creator-led distribution is now the only sustainable channel.', 'Here is our three-part execution roadmap for next quarter.'],
          breakdown: { hookStrength: 96, emotionalIntellectual: 96, clarityContext: 96, payoffValue: 96, narrativeCompleteness: 94, shareability: 94, avQuality: 92, boundaryQuality: 94 },
        },
        {
          title: 'Key Findings: Why 70% of Digital Transformations Fail',
          description: 'Compelling research-backed presentation slide highlighting cultural inertia over software tools.',
          hook: 'Technology is almost never the reason corporate transformations collapse.',
          score: 92,
          category: 'clear_explanation',
          tags: ['#EnterpriseTransformation', '#BusinessData', '#LeadershipInsight'],
          phrases: ['Organizations spend millions purchasing modern enterprise software suites,', 'without updating incentive structures or accountability frameworks.', 'Software merely accelerates whatever operational culture already exists.', 'Fix the organizational feedback loop first.'],
          breakdown: { hookStrength: 93, emotionalIntellectual: 92, clarityContext: 94, payoffValue: 92, narrativeCompleteness: 92, shareability: 91, avQuality: 90, boundaryQuality: 92 },
        },
      ],
      podcast: [
        {
          title: 'The Uncomfortable Truth About High Performers',
          description: 'Presents a counter-intuitive paradigm shift challenging conventional wisdom.',
          hook: 'High curiosity hook questioning common conventional wisdom in first 3 seconds.',
          score: 97,
          category: 'counterintuitive_fact',
          tags: ['#HighPerformance', '#Mindset', '#CreatorEconomy'],
          phrases: ['Why 99% of creators fail to capture retention', 'is because they start with long intros', 'instead of an immediate pattern break.', 'They build automated workflows that multiply reach.'],
          breakdown: { hookStrength: 98, emotionalIntellectual: 96, clarityContext: 94, payoffValue: 97, narrativeCompleteness: 95, shareability: 96, avQuality: 92, boundaryQuality: 94 },
        },
        {
          title: 'Stop Making This Critical Content Strategy Mistake',
          description: 'Direct breakdown of why 80% of long-form videos get zero organic traction on short-form feeds.',
          hook: 'Immediate pattern interrupt alerting viewer to an expensive mistake.',
          score: 93,
          category: 'actionable_advice',
          tags: ['#ContentStrategy', '#ViralTips', '#ShortsGrowth'],
          phrases: ['Posting identical clips across three platforms without re-hooking', 'destroys algorithmic reach on every single feed.', 'Each platform retention algorithm prioritizes different cadence cues.', 'Structure your initial three seconds specifically for the swipe feed.'],
          breakdown: { hookStrength: 94, emotionalIntellectual: 92, clarityContext: 90, payoffValue: 95, narrativeCompleteness: 92, shareability: 93, avQuality: 90, boundaryQuality: 90 },
        },
        {
          title: 'The 3-Step Formula That Scaled Us to 1M Views',
          description: 'Step-by-step framework structuring video hooks, body retention, and calls-to-action.',
          hook: 'Concrete measurable outcome promised upfront.',
          score: 91,
          category: 'clear_explanation',
          tags: ['#VideoMarketing', '#GrowthHacking', '#TikTokTips'],
          phrases: ['First, deliver an undeniable pattern break in two seconds.', 'Second, maintain visual momentum with dynamic framing shifts.', 'Third, conclude on a high-value insight with no sales pitch.', 'That is the complete retention architecture.'],
          breakdown: { hookStrength: 92, emotionalIntellectual: 90, clarityContext: 92, payoffValue: 92, narrativeCompleteness: 90, shareability: 91, avQuality: 90, boundaryQuality: 92 },
        },
      ],
      other: [
        {
          title: 'The Hidden Lever That Unlocks Massive Reach',
          description: 'High-impact breakdown of modern audience psychology and algorithmic distribution.',
          hook: 'Watch what happens when you alter this single creative parameter.',
          score: 94,
          category: 'revelation',
          tags: ['#ViralMoment', '#AlgorithmTips', '#Growth'],
          phrases: ['The moment you eliminate unnecessary introductory fluff,', 'average percentage viewed skyrockets past eighty percent.', 'Algorithms reward high completion rates with compounding organic reach.', 'Cut directly to the core payoff.'],
          breakdown: { hookStrength: 95, emotionalIntellectual: 94, clarityContext: 92, payoffValue: 94, narrativeCompleteness: 92, shareability: 94, avQuality: 90, boundaryQuality: 92 },
        },
      ],
    };

    const activeIdeaList = contentIdeasMap[contentType] || contentIdeasMap.podcast;

    const clips: Clip[] = [];
    const stepInterval = Math.max(10, Math.floor((videoDuration - targetSeconds) / (clipCount + 1)));

    for (let i = 0; i < clipCount; i++) {
      const idea = activeIdeaList[i % activeIdeaList.length];
      const rawStart = Math.min(Math.max(2, i * stepInterval + 2), Math.max(0, videoDuration - targetSeconds - 2));
      const rawEnd = Math.min(videoDuration, rawStart + targetSeconds);
      const bounded = enforceClipDurationBoundaries(rawStart, rawEnd, effectiveConstraint, videoDuration);
      const start = bounded.startTime;
      const end = bounded.endTime;
      const actualDuration = bounded.duration;

      // Ensure subtitle timestamps are strictly relative to clip timeline ($0.0s ... duration)
      // and chunked into short readable phrases (3-7 words) from the idea
      const phrases = idea.phrases || [
        'Here is the key takeaway you need to know',
        'because this insight transforms the entire workflow',
        'and delivers undeniable measurable outcomes.',
      ];

      const relativeSubtitles: SubtitleSegment[] = phrases.map((phrase, pIdx) => {
        const segDuration = Math.min(4.0, (actualDuration - 1.0) / phrases.length);
        const segStart = Math.round((0.5 + pIdx * segDuration) * 10) / 10;
        const segEnd = Math.min(actualDuration, Math.round((segStart + segDuration - 0.2) * 10) / 10);
        const words = phrase.split(' ');
        const highlightWords = words.slice(0, Math.min(2, words.length));
        return ensureWordTimings({
          id: `sub_${i}_${pIdx + 1}`,
          start: segStart,
          end: segEnd,
          text: phrase,
          speaker: pIdx === 2 ? 'Speaker 2' : 'Speaker 1',
          highlightWords,
        });
      }).filter((s) => s.start < actualDuration && s.end > s.start);

      clips.push({
        id: `clip_${Date.now()}_${i + 1}`,
        projectId: project.id,
        title: idea.title,
        description: idea.description,
        startTime: start,
        endTime: end,
        duration: actualDuration,
        aspectRatio: config.aspectRatio,
        viralScore: idea.score,
        hookSummary: idea.hook,
        hashtags: idea.tags,
        subtitles: relativeSubtitles,
        captionSettings: {
          ...config.captionSettings,
          enabled: true,
          preset: config.captionSettings?.preset || 'hormozi',
          fontSize: config.captionSettings?.fontSize || 'lg',
          position: config.captionSettings?.position || 'bottom',
          fontFamily: config.captionSettings?.fontFamily || 'Montserrat',
          highlightColor: config.captionSettings?.highlightColor || '#F59E0B',
          textColor: config.captionSettings?.textColor || '#FFFFFF',
          outlineColor: config.captionSettings?.outlineColor || '#000000',
          outlineWidth: config.captionSettings?.outlineWidth || 'medium',
          displayMode: config.captionSettings?.displayMode || 'word-highlight',
          textCase: config.captionSettings?.textCase || 'uppercase',
          maxWordsPerSegment: config.captionSettings?.maxWordsPerSegment || 5,
          showOpeningTitle: true,
          openingTitle: idea.title.length > 28 ? idea.title.slice(0, 25) + '...' : idea.title,
        },
        thumbnailUrl: project.sourceVideo.thumbnailUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
        videoUrl: project.sourceVideo.url || '',
        originalVideoUrl: project.sourceVideo.url || '',
        selected: i < 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRendered: false,
        faceTrackingMode: 'auto',
        faceCoordinates: { x: 50, y: 35 },
        category: idea.category,
        rationale: idea.description,
        scoreBreakdown: idea.breakdown,
      });
    }

    return clips;
  }
}

/**
 * Service instance factory.
 * Easily swapped with a RestClippingService when connected to a Python backend.
 */
export const clippingService = new DemoClippingService();
