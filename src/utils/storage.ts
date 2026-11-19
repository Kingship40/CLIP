import { Project, UserSettings, User, Clip } from '../types';
import { ensureWordTimings } from '../services/transcriptionService';

const STORAGE_KEYS = {
  PROJECTS: 'clipforge_projects',
  SETTINGS: 'clipforge_settings',
  USER: 'clipforge_user',
  IDB_DB_NAME: 'clipforge_media_db',
  IDB_STORE_NAME: 'video_blobs',
};

export const DEFAULT_USER: User = {
  id: 'usr_demo_01',
  name: 'Alex Rivera',
  email: 'alex.rivera@clipforge.ai',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  plan: 'pro',
  clipsGeneratedCount: 38,
  isDemo: true,
};

export const DEFAULT_SETTINGS: UserSettings = {
  defaultAspectRatio: '9:16',
  defaultDuration: '30-60',
  defaultLanguage: 'en',
  defaultCaptionPreset: 'hormozi',
  autoHighlightKeywords: true,
  emailNotifications: true,
  theme: 'dark',
  aiSettings: {
    provider: 'gemini',
    geminiApiKey: '',
    openaiApiKey: '',
    geminiModel: 'gemini-1.5-flash',
    openaiModel: 'gpt-4o-mini',
    isKeyVerified: false,
  },
  deepgramSettings: {
    apiKey: '',
    model: 'nova-2',
    language: 'auto',
    smartFormat: true,
    punctuate: true,
    diarize: true,
    utterances: true,
    isKeyVerified: false,
  },
  subtitleDefaults: {
    enabled: true,
    preset: 'hormozi',
    fontSize: 'md',
    position: 'bottom',
    fontFamily: 'Montserrat',
    highlightColor: '#F59E0B',
    textColor: '#FFFFFF',
    activeWordBgColor: '#F59E0B',
    activeWordTextColor: '#000000',
    textCase: 'uppercase',
    outlineWidth: 'medium',
    outlineColor: '#000000',
    displayMode: 'word-highlight',
    showOpeningTitle: true,
    openingTitle: 'Key Takeaway',
  },
};

// Seed projects so the user immediately experiences a live, rich creative SaaS workspace
export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj_demo_ai_podcast',
    name: 'The AI Productivity Shift — Ep. 42',
    createdAt: new Date(Date.now() - 3600000 * 26).toISOString(), // ~1 day ago
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'completed',
    sourceVideo: {
      name: 'future_of_ai_full_podcast.mp4',
      size: 142589000, // ~136 MB
      type: 'video/mp4',
      duration: 185,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
    },
    config: {
      clipCount: 4,
      targetDuration: '30-60',
      aspectRatio: '9:16',
      contentType: 'podcast',
      preferences: ['hooks', 'educational', 'engaging'],
      captionSettings: {
        enabled: true,
        preset: 'hormozi',
        fontSize: 'md',
        position: 'bottom',
        highlightColor: '#F59E0B',
        textColor: '#FFFFFF',
        showOpeningTitle: true,
        openingTitle: 'The $10B AI Shift 🔥',
      },
      outputResolution: '1080p',
      language: 'en',
      keepAudio: true,
      customInstructions: 'Highlight contrarian takes and actionable advice for content creators.',
    },
    clips: [
      {
        id: 'clip_01',
        projectId: 'proj_demo_ai_podcast',
        title: 'Why 99% of Content Creators Will Use AI Clips in 2026',
        description: 'Key breakdown of synthetic video workflows and how small teams outperform traditional media houses.',
        startTime: 12,
        endTime: 46,
        duration: 34,
        aspectRatio: '9:16',
        viralScore: 96,
        hookSummary: 'High energy hook with strong curiosity gap in first 3 seconds.',
        hashtags: ['#AI', '#ContentCreator', '#ViralShorts', '#Productivity'],
        captionSettings: {
          enabled: true,
          preset: 'hormozi',
          fontSize: 'md',
          position: 'bottom',
          highlightColor: '#F59E0B',
          textColor: '#FFFFFF',
          showOpeningTitle: true,
          openingTitle: 'Why 99% Will Switch 🚀',
        },
        subtitles: [
          { id: 'sub_1', start: 12.0, end: 15.2, text: 'If you are spending five hours editing a 30-minute podcast...', highlightWords: ['spending', 'five hours'] },
          { id: 'sub_2', start: 15.3, end: 18.8, text: 'You are completely wasting your leverage in 2026.', highlightWords: ['wasting', 'leverage'] },
          { id: 'sub_3', start: 19.0, end: 23.5, text: 'The creators dominating TikTok and Reels right now have one secret.', highlightWords: ['secret', 'dominating'] },
          { id: 'sub_4', start: 23.7, end: 28.0, text: 'They automate the highlight extraction and polish the hooks.', highlightWords: ['automate', 'highlight'] },
          { id: 'sub_5', start: 28.2, end: 34.0, text: 'And that turns one interview into twenty high-performing touchpoints.', highlightWords: ['twenty', 'touchpoints'] },
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        selected: true,
        createdAt: new Date(Date.now() - 3600000 * 25).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 25).toISOString(),
        isRendered: false,
      },
      {
        id: 'clip_02',
        projectId: 'proj_demo_ai_podcast',
        title: 'The Number 1 Rule for Short-Form Hooks',
        description: 'How to frame the opening sentence so viewers stop scrolling immediately.',
        startTime: 58,
        endTime: 95,
        duration: 37,
        aspectRatio: '9:16',
        viralScore: 92,
        hookSummary: 'Pattern interrupt question combined with bold counter-intuitive statement.',
        hashtags: ['#SocialMediaTips', '#ShortsGrowth', '#VideoEditing'],
        captionSettings: {
          enabled: true,
          preset: 'karaoke',
          fontSize: 'lg',
          position: 'bottom',
          highlightColor: '#06B6D4',
          textColor: '#FFFFFF',
          showOpeningTitle: true,
          openingTitle: 'The Golden Hook Rule 🎯',
        },
        subtitles: [
          { id: 'sub_21', start: 58.0, end: 61.2, text: 'Never start your short with "Hey guys, welcome back."', highlightWords: ['Never', 'Hey guys'] },
          { id: 'sub_22', start: 61.4, end: 65.5, text: 'Nobody cares who you are yet. They care about what solves their problem.', highlightWords: ['Nobody cares', 'problem'] },
          { id: 'sub_23', start: 65.8, end: 70.0, text: 'Start in the middle of the most controversial sentence you spoke.', highlightWords: ['controversial', 'sentence'] },
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        selected: true,
        createdAt: new Date(Date.now() - 3600000 * 25).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 25).toISOString(),
        isRendered: false,
      },
      {
        id: 'clip_03',
        projectId: 'proj_demo_ai_podcast',
        title: 'How Captions Increased Retention by 68%',
        description: 'Data-driven analysis of modern viewer behavior: silent viewing and dynamic word highlights.',
        startTime: 110,
        endTime: 142,
        duration: 32,
        aspectRatio: '9:16',
        viralScore: 89,
        hookSummary: 'Specific metric presented upfront establishes immediate credibility.',
        hashtags: ['#GrowthHacking', '#VideoStrategy', '#AIEditing'],
        captionSettings: {
          enabled: true,
          preset: 'neon',
          fontSize: 'md',
          position: 'middle',
          highlightColor: '#A855F7',
          textColor: '#FFFFFF',
          showOpeningTitle: false,
        },
        subtitles: [
          { id: 'sub_31', start: 110.0, end: 114.5, text: 'Over 70% of people on mobile watch reels with the sound turned off.', highlightWords: ['70%', 'sound turned off'] },
          { id: 'sub_32', start: 114.8, end: 120.2, text: 'If your visual captions are boring or static, they swipe before hearing a word.', highlightWords: ['static', 'swipe'] },
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        selected: false,
        createdAt: new Date(Date.now() - 3600000 * 25).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 25).toISOString(),
        isRendered: false,
      },
      {
        id: 'clip_04',
        projectId: 'proj_demo_ai_podcast',
        title: 'Building a Full Media Engine as a Solo Creator',
        description: 'The step-by-step framework to repurpose 1 master recording into 30 pieces of social content.',
        startTime: 145,
        endTime: 178,
        duration: 33,
        aspectRatio: '9:16',
        viralScore: 88,
        hookSummary: 'Actionable step-by-step breakdown with immediate takeaway.',
        hashtags: ['#SoloCreator', '#ContentStrategy', '#MediaEmpire'],
        captionSettings: {
          enabled: true,
          preset: 'hormozi',
          fontSize: 'md',
          position: 'bottom',
          highlightColor: '#F59E0B',
          textColor: '#FFFFFF',
          showOpeningTitle: true,
          openingTitle: 'Solo Media Engine 💡',
        },
        subtitles: [
          { id: 'sub_41', start: 145.0, end: 150.0, text: 'One video is not one piece of content. It is a goldmine of atomic ideas.', highlightWords: ['goldmine', 'atomic ideas'] },
          { id: 'sub_42', start: 150.5, end: 156.0, text: 'Extract three strong hooks, generate captions, and schedule them out.', highlightWords: ['three hooks', 'schedule'] },
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        selected: false,
        createdAt: new Date(Date.now() - 3600000 * 25).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 25).toISOString(),
        isRendered: false,
      },
    ],
  },
  {
    id: 'proj_demo_founder_talk',
    name: 'SaaS Bootstrapping Workshop 2026',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: 'completed',
    sourceVideo: {
      name: 'saas_bootstrapping_masterclass.mp4',
      size: 215000000,
      type: 'video/mp4',
      duration: 240,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
    },
    config: {
      clipCount: 3,
      targetDuration: '15-30',
      aspectRatio: '9:16',
      contentType: 'educational',
      preferences: ['educational', 'explanations'],
      captionSettings: {
        enabled: true,
        preset: 'minimal',
        fontSize: 'md',
        position: 'bottom',
        highlightColor: '#6366F1',
        textColor: '#FFFFFF',
        showOpeningTitle: false,
      },
      outputResolution: '1080p',
      language: 'en',
      keepAudio: true,
    },
    clips: [
      {
        id: 'clip_b1',
        projectId: 'proj_demo_founder_talk',
        title: 'Pricing Mistakes That Kill SaaS Startups',
        description: 'Why underpricing early kills unit economics and attracts wrong customers.',
        startTime: 20,
        endTime: 48,
        duration: 28,
        aspectRatio: '9:16',
        viralScore: 94,
        hookSummary: 'Identifies painful business mistake with clear remedy.',
        hashtags: ['#SaaS', '#Bootstrapping', '#StartupPricing'],
        captionSettings: {
          enabled: true,
          preset: 'minimal',
          fontSize: 'md',
          position: 'bottom',
          highlightColor: '#6366F1',
          textColor: '#FFFFFF',
          showOpeningTitle: true,
          openingTitle: 'Stop Underpricing! 🛑',
        },
        subtitles: [
          { id: 'sub_b1', start: 0.5, end: 4.5, text: 'If you charge $10 a month, you need 10,000 customers to make $100k ARR.', highlightWords: ['charge $10', '10,000 customers'] },
          { id: 'sub_b2', start: 5.0, end: 8.5, text: 'If you charge $1,000 a year, you only need 100 happy customers.', highlightWords: ['100 happy customers'] },
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        selected: true,
        createdAt: new Date(Date.now() - 3600000 * 70).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 70).toISOString(),
        isRendered: false,
      },
      {
        id: 'clip_b2',
        projectId: 'proj_demo_founder_talk',
        title: 'The Rule of 40 in High-Growth SaaS',
        description: 'How to balance growth rate and profit margin to achieve top quartile venture valuation.',
        startTime: 60,
        endTime: 88,
        duration: 28,
        aspectRatio: '9:16',
        viralScore: 91,
        hookSummary: 'Actionable breakdown of the single financial metric top investors look for.',
        hashtags: ['#SaaSMetrics', '#RuleOf40', '#VentureCapital'],
        captionSettings: {
          enabled: true,
          preset: 'minimal',
          fontSize: 'md',
          position: 'bottom',
          highlightColor: '#6366F1',
          textColor: '#FFFFFF',
          showOpeningTitle: true,
          openingTitle: 'The Rule of 40 📈',
        },
        subtitles: [
          { id: 'sub_b2_1', start: 0.5, end: 4.2, text: 'Your growth rate plus your free cash flow margin must exceed 40 percent.', highlightWords: ['growth rate', 'exceed 40 percent'] },
          { id: 'sub_b2_2', start: 4.6, end: 8.8, text: 'If you grow at 60% with negative 20% margin, you are still elite.', highlightWords: ['grow at 60%', 'still elite'] },
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        selected: true,
        createdAt: new Date(Date.now() - 3600000 * 68).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 68).toISOString(),
        isRendered: false,
      },
      {
        id: 'clip_b3',
        projectId: 'proj_demo_founder_talk',
        title: 'Why Product-Led Growth Beats Sales Early On',
        description: 'How self-serve onboarding creates compounding viral loops that eliminate expensive ad spend.',
        startTime: 105,
        endTime: 132,
        duration: 27,
        aspectRatio: '9:16',
        viralScore: 89,
        hookSummary: 'Reveals why self-serve customer journeys beat outbound sales for early validation.',
        hashtags: ['#ProductLedGrowth', '#StartupGrowth', '#ViralLoops'],
        captionSettings: {
          enabled: true,
          preset: 'minimal',
          fontSize: 'md',
          position: 'bottom',
          highlightColor: '#6366F1',
          textColor: '#FFFFFF',
          showOpeningTitle: true,
          openingTitle: 'Product-Led Growth 🚀',
        },
        subtitles: [
          { id: 'sub_b3_1', start: 0.6, end: 4.5, text: 'Sales-led companies spend months pitching before knowing if the product works.', highlightWords: ['Sales-led', 'months pitching'] },
          { id: 'sub_b3_2', start: 5.0, end: 9.2, text: 'Product-led companies get feedback within 60 seconds of signup.', highlightWords: ['feedback within 60 seconds'] },
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        selected: true,
        createdAt: new Date(Date.now() - 3600000 * 65).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 65).toISOString(),
        isRendered: false,
      },
    ],
  },
];

export function getStoredProjects(): Project[] {
  const migrateAndNormalizeProjects = (projects: Project[]): Project[] => {
    return projects.map((p) => {
      const normalizedClips: Clip[] = (p.clips || []).map((c) => ({
        ...c,
        projectId: c.projectId || p.id, // Strictly ensure link to project
        captionSettings: {
          ...c.captionSettings,
          enabled: c.captionSettings ? c.captionSettings.enabled !== false : true,
          preset: c.captionSettings?.preset || 'hormozi',
          displayMode: c.captionSettings?.displayMode || 'word-highlight',
          highlightColor: c.captionSettings?.highlightColor || '#FACC15',
          textColor: c.captionSettings?.textColor || '#FFFFFF',
        },
        subtitles: (c.subtitles || []).map(ensureWordTimings),
      }));

      // Non-destructive schema migration for Part 10 metadata
      const sourcePlatform = p.source_platform || (p.sourceVideo?.url?.includes('youtube') ? 'youtube' : 'upload');
      const sourceTitle = p.source_title || p.sourceVideo?.name || p.name;
      const sourceDuration = p.source_duration !== undefined ? p.source_duration : (p.sourceVideo?.duration || 0);

      return {
        ...p,
        source_platform: sourcePlatform,
        source_url: p.source_url || p.sourceVideo?.url || '',
        source_video_id: p.source_video_id || (p.sourceVideo as any)?.sourceVideoId || p.id,
        source_title: sourceTitle,
        source_thumbnail: p.source_thumbnail || p.sourceVideo?.thumbnailUrl || '',
        source_duration: sourceDuration,
        ingestion_status: p.ingestion_status || (p.status === 'completed' ? 'completed' : 'ready'),
        accessibility_status: p.accessibility_status || (p.sourceVideo?.url ? 'verified' : 'uploaded'),
        processing_job_id: p.processing_job_id || p.job?.id || `job_${p.id}`,
        original_video_reference: p.original_video_reference || p.sourceVideo?.url || p.sourceVideo?.name || '',
        generated_clips: normalizedClips,
        subtitle_status: p.subtitle_status || (normalizedClips.length > 0 ? 'completed' : 'ready'),
        final_processing_status: p.final_processing_status || p.status,
        error_message: p.error_message || p.job?.errorMessage,
        clips: normalizedClips,
      };
    });
  };

  try {
    if (typeof localStorage === 'undefined') {
      return migrateAndNormalizeProjects(SEED_PROJECTS);
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) {
      // Seed default projects with migrated schema
      const normalized = migrateAndNormalizeProjects(SEED_PROJECTS);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(normalized));
      return normalized;
    }
    const parsed = JSON.parse(raw);
    const migrated = migrateAndNormalizeProjects(parsed);
    return migrated;
  } catch (e) {
    return migrateAndNormalizeProjects(SEED_PROJECTS);
  }
}

export function saveStoredProjects(projects: Project[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to localStorage:', e);
  }
}

export function getStoredSettings(): UserSettings {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      aiSettings: {
        ...DEFAULT_SETTINGS.aiSettings,
        ...(parsed.aiSettings || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: UserSettings): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}

export function getStoredUser(): User {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_USER;
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return DEFAULT_USER;
    return { ...DEFAULT_USER, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER;
  }
}

export function saveStoredUser(user: User): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user to localStorage:', e);
  }
}

export function resetAllStorageData(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.USER);
    // Re-seed
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
  } catch (e) {
    console.error('Failed to reset storage:', e);
  }
}

// In-memory / blob URL cache so local uploaded videos remain playable during current session
const videoUrlCache = new Map<string, string>();

export function registerSessionVideoUrl(id: string, url: string) {
  videoUrlCache.set(id, url);
}

export function getSessionVideoUrl(id: string): string | undefined {
  return videoUrlCache.get(id);
}
