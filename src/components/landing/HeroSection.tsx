import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import {
  Sparkles,
  ArrowRight,
  Play,
  Scissors,
  CheckCircle2,
  TrendingUp,
  Type,
  Maximize2,
  Video,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-brand-500/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Headline & Supporting Text */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-semibold uppercase tracking-wider animate-in fade-in duration-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Video Clipping Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Turn Long Videos Into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-300">
              Scroll-Stopping Shorts.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Transform podcasts, interviews, tutorials, and long-form videos into ready-to-share short clips with an AI-powered clipping workflow.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/dashboard/new">
              <Button
                size="lg"
                variant="primary"
                leftIcon={<Sparkles className="w-5 h-5 text-white" />}
                className="shadow-glow-brand"
              >
                Start clipping free
              </Button>
            </Link>

            <a href="#workflow">
              <Button size="lg" variant="secondary" leftIcon={<Play className="w-4 h-4 fill-current ml-0.5" />}>
                See how it works
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Automatic 9:16 vertical reframing
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Kinetic animated captions
            </span>
          </div>
        </div>

        {/* Polished Visual Mockup of the Clipping Workspace */}
        <div className="mt-14 sm:mt-18 relative rounded-2xl p-2 bg-gradient-to-b from-slate-700/50 via-slate-800/30 to-dark-900 border border-slate-700/60 shadow-2xl backdrop-blur-xl">
          <div className="rounded-xl bg-dark-950 border border-slate-800 overflow-hidden shadow-2xl">
            {/* Top Workspace Bar */}
            <div className="h-11 bg-dark-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-slate-400 font-mono text-[11px] ml-2">
                  clipforge.ai/studio/proj_demo_ai_podcast
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium text-[10px] border border-emerald-500/20">
                  4 Clips Extracted
                </span>
              </div>
            </div>

            {/* Inner Studio Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Left Column: Source Video & Timeline */}
              <div className="lg:col-span-7 p-4 sm:p-6 space-y-4 bg-dark-950">
                <div className="relative aspect-video rounded-xl bg-dark-900 border border-slate-800 overflow-hidden shadow-lg group">
                  <img
                    src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=900&auto=format&fit=crop&q=80"
                    alt="Podcast Interview"
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-dark-950/30 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                  </div>
                  {/* Aspect Ratio Box indicator */}
                  <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-md text-[11px] font-mono text-white flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-brand-400" />
                    <span>Auto 9:16 Center Tracking</span>
                  </div>
                </div>

                {/* Simulated Timeline */}
                <div className="p-3 bg-dark-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-white">Full Timeline (03:05)</span>
                    <span className="text-brand-300 font-mono">Cut: 00:12 – 00:46</span>
                  </div>
                  <div className="h-6 bg-dark-950 rounded-lg border border-slate-800 relative overflow-hidden flex items-center">
                    <div className="absolute left-[8%] w-[25%] h-full bg-brand-500/30 border-x-2 border-brand-400" />
                    <div className="absolute left-[45%] w-[22%] h-full bg-cyan-500/30 border-x-2 border-cyan-400" />
                    <div className="absolute left-[72%] w-[20%] h-full bg-purple-500/30 border-x-2 border-purple-400" />
                  </div>
                </div>
              </div>

              {/* Right Column: Vertical Short Preview + Clips Panel */}
              <div className="lg:col-span-5 p-4 sm:p-6 bg-dark-900/60 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generated Clips (4)</span>
                  </span>
                  <span className="text-[11px] text-brand-400">TikTok & Reels Ready</span>
                </div>

                {/* Vertical Clip Preview with Dynamic Subtitle */}
                <div className="relative aspect-[9/16] max-h-72 w-44 mx-auto rounded-xl overflow-hidden bg-black border border-slate-700 shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80"
                    alt="Vertical preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-amber-300">
                    96 Hook Score
                  </div>

                  {/* Kinetic Subtitle Box */}
                  <div className="absolute bottom-6 inset-x-2 text-center pointer-events-none">
                    <span className="inline-block px-2.5 py-1 rounded bg-black/90 text-amber-300 font-black text-xs uppercase tracking-wide border border-white/20">
                      Why 99% of creators will switch
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-semibold text-white">Why 99% Creators Will Switch</h5>
                    <p className="text-[11px] text-slate-400">00:34 • Hormozi Captions • 9:16</p>
                  </div>
                  <Link to="/dashboard">
                    <button className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow">
                      Edit
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
