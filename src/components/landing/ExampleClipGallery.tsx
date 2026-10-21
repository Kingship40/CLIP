import React, { useState } from 'react';
import { SAMPLE_VIDEOS, SampleVideo } from '../../utils/videoHelpers';
import { formatDuration } from '../../utils/formatters';
import { Play, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Link } from 'react-router-dom';

export const ExampleClipGallery: React.FC = () => {
  const [activeSample, setActiveSample] = useState<SampleVideo | null>(null);

  return (
    <section id="examples" className="py-20 md:py-28 bg-dark-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Real Output Examples
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
              Curated Sample Projects
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Explore how ClipForge AI extracts atomic short segments from long-form recordings.
            </p>
          </div>

          <Link to="/dashboard">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Demo Studio
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_VIDEOS.map((sample) => (
            <div
              key={sample.id}
              className="bg-dark-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group flex flex-col justify-between"
            >
              <div
                className="relative aspect-video bg-dark-950 cursor-pointer overflow-hidden"
                onClick={() => setActiveSample(sample)}
              >
                <img
                  src={sample.thumbnail}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-dark-950/40 group-hover:bg-dark-950/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                  {formatDuration(sample.duration)}
                </span>
                <span className="absolute top-2 left-2 bg-brand-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                  {sample.category}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-white text-base group-hover:text-brand-300 transition-colors mb-1.5">
                    {sample.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {sample.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-amber-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    94+ Viral Score
                  </span>

                  <Link to="/dashboard/new">
                    <button className="text-brand-400 hover:text-white font-semibold transition-colors flex items-center gap-1">
                      <span>Clip this video</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Playback Modal */}
      <Modal
        isOpen={!!activeSample}
        onClose={() => setActiveSample(null)}
        title={activeSample?.title}
        maxWidth="2xl"
      >
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
          {activeSample && (
            <video
              src={activeSample.url}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </Modal>
    </section>
  );
};
