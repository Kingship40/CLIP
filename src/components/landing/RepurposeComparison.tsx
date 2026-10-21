import React from 'react';
import { ArrowRight, Video, Sparkles, Check, Smartphone } from 'lucide-react';

export const RepurposeComparison: React.FC = () => {
  const contentTypes = [
    'Podcasts & Video Shows',
    'Founder & Expert Interviews',
    'Live Webinars & Keynotes',
    'Educational Tutorials',
    'Tech & Coding Talks',
    'Vlogs & Travel Content',
  ];

  return (
    <section className="py-20 bg-dark-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
            Content Multiplier
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4 tracking-tight">
            Stop Leaving 90% of Your Video's Value on the Table
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            One 45-minute recording contains dozens of atomic lessons, funny moments, and contrarian hooks.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
          {/* Before Column */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-dark-900 border border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Traditional Workflow</span>
            <h3 className="text-xl font-bold text-white mt-1 mb-4">1 Single Long-Form Upload</h3>

            <div className="aspect-video w-full rounded-xl bg-dark-950 border border-slate-800 p-4 flex flex-col items-center justify-center text-center mb-6">
              <Video className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">45-minute full video uploaded only to YouTube</p>
              <span className="text-[11px] text-rose-400/90 mt-1">Gets buried by the algorithm after 48 hours</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">✕</span> 4–6 hours manually scrubbing timestamps
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">✕</span> Tedious manual subtitle transcription
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">✕</span> Single touchpoint on 1 single platform
              </li>
            </ul>
          </div>

          {/* Center Connector */}
          <div className="lg:col-span-1 flex justify-center py-2">
            <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <ArrowRight className="w-5 h-5 rotate-90 lg:rotate-0" />
            </div>
          </div>

          {/* After Column (ClipForge AI) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-brand-950/40 to-dark-900 border border-brand-500/30 shadow-glow-brand">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-300">ClipForge AI Engine</span>
              <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold">
                10x Social Reach
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1 mb-4">10–15 Scroll-Stopping Shorts</h3>

            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {[
                { title: 'Hook 1', score: 96, ratio: '9:16' },
                { title: 'Hook 2', score: 92, ratio: '9:16' },
                { title: 'Hook 3', score: 89, ratio: '9:16' },
              ].map((item, i) => (
                <div key={i} className="aspect-[9/16] rounded-xl bg-dark-950 border border-brand-500/30 p-2 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-amber-300 font-bold">★ {item.score}</span>
                    <span className="text-slate-400">{item.ratio}</span>
                  </div>
                  <Smartphone className="w-6 h-6 text-brand-400 self-center" />
                  <span className="text-[10px] font-bold text-center text-white truncate">{item.title}</span>
                </div>
              ))}
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> AI automatically identifies the most viral moments
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Animated kinetic subtitles styled in seconds
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Multi-channel distribution on TikTok, IG Reels, & Shorts
              </li>
            </ul>
          </div>
        </div>

        {/* Supported content types badge row */}
        <div className="mt-14 pt-8 border-t border-slate-900 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Supports All Video Creators & Formats:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {contentTypes.map((type, i) => (
              <span
                key={i}
                className="px-3.5 py-1.5 rounded-full bg-dark-900 border border-slate-800 text-xs font-medium text-slate-300"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
