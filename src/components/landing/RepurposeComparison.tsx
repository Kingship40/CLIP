import React from 'react';
import { ArrowRight, Video, Sparkles, Check, Smartphone, X, Flame } from 'lucide-react';

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
    <section className="py-20 bg-[var(--bg-page)] dark:bg-dark-950 border-t border-[var(--border)] dark:border-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-purple-400">
            Content Multiplier
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] dark:text-white mt-2 mb-4 tracking-tight">
            Stop Leaving 90% of Your Video's Value on the Table
          </h2>
          <p className="text-[var(--text-secondary)] dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            One 45-minute recording contains dozens of atomic lessons, funny moments, and contrarian hooks.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
          {/* Before Column (Traditional Workflow) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 shadow-sm transition-all">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
              Traditional Workflow
            </span>
            <h3 className="text-xl font-bold text-[var(--text-primary)] dark:text-white mt-1 mb-4">
              1 Single Long-Form Upload
            </h3>

            <div className="aspect-video w-full rounded-xl bg-[var(--bg-surface-2)] dark:bg-dark-950 border border-[var(--border)] dark:border-slate-800 p-4 flex flex-col items-center justify-center text-center mb-6">
              <Video className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-2" />
              <p className="text-xs text-[var(--text-secondary)] dark:text-slate-400 font-medium">
                45-minute full video uploaded only to YouTube
              </p>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">
                Gets buried by the algorithm after 48 hours
              </span>
            </div>

            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] dark:text-slate-400 font-medium">
              <li className="flex items-center gap-2">
                <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>4–6 hours manually scrubbing timestamps</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Tedious manual subtitle transcription</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Single touchpoint on 1 single platform</span>
              </li>
            </ul>
          </div>

          {/* Center Connector */}
          <div className="lg:col-span-1 flex justify-center py-2">
            <div className="w-10 h-10 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/30 shadow-sm">
              <ArrowRight className="w-5 h-5 rotate-90 lg:rotate-0" />
            </div>
          </div>

          {/* After Column (ClipForge AI) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] dark:bg-dark-900 border-2 border-brand-500/40 dark:border-brand-500/30 shadow-md dark:shadow-glow-brand ring-1 ring-brand-500/10 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                ClipForge AI Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAE8FF] dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 text-[10px] font-bold">
                10x Social Reach
              </span>
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] dark:text-white mt-1 mb-4">
              10–15 Scroll-Stopping Shorts
            </h3>

            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {[
                { title: 'Hook 1', score: 96, ratio: '9:16' },
                { title: 'Hook 2', score: 92, ratio: '9:16' },
                { title: 'Hook 3', score: 89, ratio: '9:16' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="aspect-[9/16] rounded-xl border p-2 flex flex-col justify-between bg-[var(--bg-surface-2)] dark:bg-dark-950 border-[var(--border)] dark:border-slate-800 shadow-sm"
                >
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-amber-600 dark:text-amber-300 font-bold flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> {item.score}
                    </span>
                    <span className="text-[var(--text-muted)] dark:text-slate-500">{item.ratio}</span>
                  </div>
                  <Smartphone className="w-6 h-6 text-brand-600 dark:text-brand-400 self-center" />
                  <span className="text-[10px] font-bold text-center truncate text-[var(--text-primary)] dark:text-white">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>

            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>AI automatically identifies the most viral moments</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Animated kinetic subtitles styled in seconds</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Multi-channel distribution on TikTok, IG Reels, & Shorts</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Supported content types badge row */}
        <div className="mt-14 pt-8 border-t border-[var(--border)] dark:border-slate-900 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-slate-400 mb-4">
            Supports All Video Creators & Formats:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {contentTypes.map((type, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full bg-[var(--bg-surface)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 text-xs font-semibold text-[var(--text-primary)] dark:text-slate-300 shadow-sm hover:border-brand-400 hover:text-brand-600 hover:bg-[#EAE8FF]/50 dark:hover:border-brand-500/40 dark:hover:text-white transition-all duration-200 cursor-default"
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
