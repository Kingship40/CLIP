import React from 'react';
import { UploadCloud, Sparkles, Sliders, Share2 } from 'lucide-react';

export const WorkflowSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: <UploadCloud className="w-6 h-6 text-brand-400" />,
      title: 'Upload Long Video',
      description: 'Upload your MP4 or MOV file, or paste your interview recording. We extract metadata and inspect audio locally.',
    },
    {
      num: '02',
      icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
      title: 'AI Hook Detection',
      description: 'The engine scans for high-retention questions, emotional peaks, and concise explanations to isolate top highlights.',
    },
    {
      num: '03',
      icon: <Sliders className="w-6 h-6 text-purple-400" />,
      title: 'Customize in Studio',
      description: 'Adjust 9:16 vertical crop bounds, tweak trim points on the timeline, and style animated captions with one click.',
    },
    {
      num: '04',
      icon: <Share2 className="w-6 h-6 text-emerald-400" />,
      title: 'Export & Dominate Feeds',
      description: 'Download ready-to-post clips with companion .SRT captions to publish on TikTok, Instagram Reels, and YouTube Shorts.',
    },
  ];

  return (
    <section id="workflow" className="py-20 md:py-28 bg-dark-950 border-t border-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            Effortless Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4 tracking-tight">
            How It Works in 4 Simple Steps
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            From a 60-minute podcast recording to 10 viral short-form clips in under 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative p-6 rounded-2xl bg-dark-900/60 border border-slate-800/80 hover:border-slate-700 transition-all hover:bg-dark-900 group"
            >
              <span className="text-3xl font-black text-slate-800 group-hover:text-brand-500/30 transition-colors font-mono">
                {step.num}
              </span>

              <div className="w-12 h-12 rounded-xl bg-dark-850 border border-slate-800 flex items-center justify-center my-4 group-hover:scale-105 transition-transform">
                {step.icon}
              </div>

              <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
