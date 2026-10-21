import { Project, ProjectConfig, ProcessingJob, ProcessingStage, Clip, SubtitleSegment } from '../types';
import { viralIntelligenceEngineInstance } from './intelligence/viralIntelligenceEngine';

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

    const videoDuration = Math.max(30, project.sourceVideo.duration || 120);

    let targetSeconds = 30;
    if (config.targetDuration === '15-30') targetSeconds = 24;
    else if (config.targetDuration === '30-60') targetSeconds = 42;
    else if (config.targetDuration === '60-90') targetSeconds = 68;
    else if (config.customDurationSeconds) targetSeconds = config.customDurationSeconds;

    const result = await viralIntelligenceEngineInstance.extractViralMoments(
      subtitles || [],
      videoDuration,
      {
        clipCount,
        targetDuration: targetSeconds,
        minDuration: 12,
        maxDuration: Math.min(videoDuration, 60),
      },
      project.name || project.sourceVideo.name
    );

    return viralIntelligenceEngineInstance.convertMomentsToClips(result.moments, project);
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

    const videoDuration = Math.max(30, project.sourceVideo.duration || 120);

    // Calculate clip segment targets
    let targetSeconds = 30;
    if (config.targetDuration === '15-30') targetSeconds = 24;
    else if (config.targetDuration === '30-60') targetSeconds = 42;
    else if (config.targetDuration === '60-90') targetSeconds = 68;
    else if (config.customDurationSeconds) targetSeconds = config.customDurationSeconds;

    const clipIdeas = [
      {
        title: 'The Uncomfortable Truth About High Performers',
        description: 'Presents a counter-intuitive paradigm shift challenging conventional wisdom.',
        hook: 'High curiosity hook questioning common conventional wisdom in first 3 seconds.',
        score: 97,
        category: 'counterintuitive_fact',
        tags: ['#HighPerformance', '#Mindset', '#CreatorEconomy'],
        breakdown: { hookStrength: 98, emotionalIntellectual: 96, clarityContext: 94, payoffValue: 97, narrativeCompleteness: 95, shareability: 96, avQuality: 92, boundaryQuality: 94 },
      },
      {
        title: 'Stop Making This Critical Content Strategy Mistake',
        description: 'Direct breakdown of why 80% of long-form videos get zero organic traction on short-form feeds.',
        hook: 'Immediate pattern interrupt alerting viewer to an expensive mistake.',
        score: 93,
        category: 'actionable_advice',
        tags: ['#ContentStrategy', '#ViralTips', '#ShortsGrowth'],
        breakdown: { hookStrength: 94, emotionalIntellectual: 92, clarityContext: 90, payoffValue: 95, narrativeCompleteness: 92, shareability: 93, avQuality: 90, boundaryQuality: 90 },
      },
      {
        title: 'The 3-Step Formula That Scaled Us to 1M Views',
        description: 'Step-by-step framework structuring video hooks, body retention, and calls-to-action.',
        hook: 'Concrete measurable outcome promised upfront.',
        score: 91,
        category: 'clear_explanation',
        tags: ['#VideoMarketing', '#GrowthHacking', '#TikTokTips'],
        breakdown: { hookStrength: 92, emotionalIntellectual: 90, clarityContext: 92, payoffValue: 92, narrativeCompleteness: 90, shareability: 91, avQuality: 90, boundaryQuality: 92 },
      },
      {
        title: 'Why Most Advice in 2026 is Completely Outdated',
        description: 'Contrarian analysis explaining how generative workflows changed the speed of distribution.',
        hook: 'Challenging established beliefs to build strong engagement and comment debate.',
        score: 88,
        category: 'controversial_debate',
        tags: ['#ModernWork', '#AIRevolution', '#Innovation'],
        breakdown: { hookStrength: 90, emotionalIntellectual: 88, clarityContext: 86, payoffValue: 88, narrativeCompleteness: 88, shareability: 89, avQuality: 88, boundaryQuality: 88 },
      },
      {
        title: 'The Single Metric You Must Track Every Day',
        description: 'Why viewer retention curve at 5 seconds determines algorithmic distribution across all platforms.',
        hook: 'Actionable focus on one single high-impact lever.',
        score: 86,
        category: 'revelation',
        tags: ['#Analytics', '#SocialMediaAlgorithm', '#ReelsTips'],
        breakdown: { hookStrength: 88, emotionalIntellectual: 86, clarityContext: 85, payoffValue: 86, narrativeCompleteness: 85, shareability: 87, avQuality: 86, boundaryQuality: 86 },
      },
    ];

    const clips: Clip[] = [];
    const stepInterval = Math.max(10, Math.floor((videoDuration - targetSeconds) / (clipCount + 1)));

    for (let i = 0; i < clipCount; i++) {
      const idea = clipIdeas[i % clipIdeas.length];
      const start = Math.min(Math.max(5, (i + 1) * stepInterval), Math.max(0, videoDuration - targetSeconds - 5));
      const end = Math.min(videoDuration, start + targetSeconds);
      const actualDuration = Math.round((end - start) * 10) / 10;

      const subtitles: SubtitleSegment[] = [
        {
          id: `sub_${i}_1`,
          start: start + 0.5,
          end: start + 4.2,
          text: `Why 99% of creators fail to capture retention in the first three seconds`,
          highlightWords: ['99%', 'creators', 'retention', 'three seconds'],
        },
        {
          id: `sub_${i}_2`,
          start: start + 4.5,
          end: start + 8.8,
          text: `is because they start with long intros instead of an immediate pattern break.`,
          highlightWords: ['long intros', 'pattern break'],
        },
        {
          id: `sub_${i}_3`,
          start: start + 9.0,
          end: start + 14.5,
          text: `They don't work twice as hard. They build workflows that multiply their reach.`,
          highlightWords: ['twice as hard', 'multiply reach'],
        },
        {
          id: `sub_${i}_4`,
          start: start + 15.0,
          end: start + 19.8,
          text: `And that single optimization fundamentally changes your distribution curves.`,
          highlightWords: ['single optimization', 'distribution curves'],
        },
      ];

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
        subtitles,
        captionSettings: {
          ...config.captionSettings,
          showOpeningTitle: true,
          openingTitle: idea.title.length > 28 ? idea.title.slice(0, 25) + '...' : idea.title,
        },
        thumbnailUrl: project.sourceVideo.thumbnailUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
        videoUrl: project.sourceVideo.url || '',
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
