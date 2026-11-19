import React from 'react';
import { Smartphone, Monitor, Square } from 'lucide-react';

export const RatioShowcase: React.FC = () => {
  const ratios = [
    {
      ratio: '9:16',
      name: 'Vertical Shorts',
      platforms: 'TikTok, Instagram Reels, YouTube Shorts',
      icon: <Smartphone className="w-5 h-5 text-brand-600 dark:text-brand-400" />,
      frame: 'w-24 h-40',
      badge: '90% of Social Attention',
    },
    {
      ratio: '16:9',
      name: 'Widescreen Standard',
      platforms: 'YouTube, Web, X (Twitter), LinkedIn',
      icon: <Monitor className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      frame: 'w-40 h-24',
      badge: 'Desktop & Long-Form',
    },
    {
      ratio: '1:1',
      name: 'Square Carousel',
      platforms: 'Instagram Feed, Facebook, Threads',
      icon: <Square className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      frame: 'w-28 h-28',
      badge: 'Feed Engagement',
    },
  ];

  return (
    <section className="py-20 bg-[var(--bg-page)] dark:bg-dark-900/30 border-t border-[var(--border)] dark:border-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Multi-Platform Export
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] dark:text-white mt-2 mb-4 tracking-tight">
            Formatted for Every Social Feed
          </h2>
          <p className="text-[var(--text-secondary)] dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Switch aspect ratios instantly with smart center reframing without stretching or awkward black bars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ratios.map((r, i) => (
            <div
              key={i}
              className="p-6 sm:p-7 rounded-2xl bg-[var(--bg-surface)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-slate-700 flex flex-col items-center text-center transition-all group"
            >
              <div className="h-48 flex items-center justify-center mb-5 w-full">
                <div
                  className={`rounded-xl border-2 border-brand-500 bg-brand-50/50 dark:bg-dark-950 flex flex-col items-center justify-center shadow-sm relative p-2 ${r.frame} ring-4 ring-brand-500/10 group-hover:scale-105 transition-transform duration-200`}
                >
                  <div className="mb-1">{r.icon}</div>
                  <span className="text-xs font-mono font-extrabold text-brand-700 dark:text-brand-300">
                    {r.ratio}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 bg-[#EAE8FF] dark:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 px-3 py-1 rounded-full mb-3">
                {r.badge}
              </span>

              <h3 className="text-base font-bold text-[var(--text-primary)] dark:text-white mb-1.5">
                {r.name}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] dark:text-slate-400 font-medium leading-relaxed">
                {r.platforms}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
