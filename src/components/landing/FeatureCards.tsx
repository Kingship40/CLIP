import React from 'react';
import {
  Sparkles,
  Type,
  Maximize2,
  Scissors,
  Layers,
  FileText,
  Zap,
  ShieldCheck,
} from 'lucide-react';

export const FeatureCards: React.FC = () => {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      title: 'Smart Hook Retention Detection',
      description: 'Scores opening questions and controversial statements to pinpoint segments that keep viewers from scrolling past.',
    },
    {
      icon: <Type className="w-5 h-5 text-brand-400" />,
      title: 'Kinetic Subtitles & Highlight Presets',
      description: 'Generates animated captions styled like top creators (Hormozi Bold, Electric Karaoke, Neon Glow) with colored keywords.',
    },
    {
      icon: <Maximize2 className="w-5 h-5 text-cyan-400" />,
      title: 'Multi-Platform Aspect Ratios',
      description: 'One-click switch between 9:16 vertical shorts, 16:9 YouTube widescreen, and 1:1 Instagram square framing.',
    },
    {
      icon: <Scissors className="w-5 h-5 text-purple-400" />,
      title: 'Precision Dual-Handle Timeline',
      description: 'Scrub through the video, trim start/end timestamps with ±0.2s micro-steppers, and preview the cut in real-time.',
    },
    {
      icon: <Layers className="w-5 h-5 text-emerald-400" />,
      title: 'Batch Repurposing Pipeline',
      description: 'Generate 3, 5, or 10 atomic clips from a single long episode with personalized content preferences.',
    },
    {
      icon: <FileText className="w-5 h-5 text-rose-400" />,
      title: 'Instant Subtitle & Data Exports',
      description: 'Export SubRip (.SRT) and WebVTT (.VTT) caption files or complete JSON project data for seamless editorial workflows.',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Engineered for Creators
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-4 tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Everything You Need to Repurpose Video at Scale
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            Turn every master recording into a compounding library of social clips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border transition-all hover:shadow-lg"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl border flex items-center justify-center mb-4"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                {feat.icon}
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{feat.title}</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
