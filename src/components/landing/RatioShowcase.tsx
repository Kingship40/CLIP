import React from 'react';
import { Smartphone, Monitor, Square } from 'lucide-react';

export const RatioShowcase: React.FC = () => {
  const ratios = [
    {
      ratio: '9:16',
      name: 'Vertical Shorts',
      platforms: 'TikTok, Instagram Reels, YouTube Shorts',
      icon: <Smartphone className="w-5 h-5 text-brand-400" />,
      frame: 'w-24 h-40',
      badge: '90% of Social Attention',
    },
    {
      ratio: '16:9',
      name: 'Widescreen Standard',
      platforms: 'YouTube, Web, X (Twitter), LinkedIn',
      icon: <Monitor className="w-5 h-5 text-cyan-400" />,
      frame: 'w-40 h-24',
      badge: 'Desktop & Long-Form',
    },
    {
      ratio: '1:1',
      name: 'Square Carousel',
      platforms: 'Instagram Feed, Facebook, Threads',
      icon: <Square className="w-5 h-5 text-purple-400" />,
      frame: 'w-28 h-28',
      badge: 'Feed Engagement',
    },
  ];

  return (
    <section className="py-20 bg-dark-900/30 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Multi-Platform Export
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4 tracking-tight">
            Formatted for Every Social Feed
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Switch aspect ratios instantly with smart center reframing without stretching or awkward black bars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ratios.map((r, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-dark-900 border border-slate-800 flex flex-col items-center text-center hover:border-slate-700 transition-colors"
            >
              <div className="h-44 flex items-center justify-center mb-4">
                <div
                  className={`rounded-xl border-2 border-brand-500/50 bg-dark-950 flex flex-col items-center justify-center shadow-lg relative p-2 ${r.frame}`}
                >
                  <span className="text-xs font-mono font-bold text-brand-300">{r.ratio}</span>
                </div>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-full mb-2">
                {r.badge}
              </span>

              <h3 className="text-base font-bold text-white mb-1">{r.name}</h3>
              <p className="text-xs text-slate-400">{r.platforms}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
