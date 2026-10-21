import React from 'react';
import { ProcessingJob, Project } from '../../types';
import { formatDuration } from '../../utils/formatters';
import { CheckCircle2, Loader2, AlertCircle, XCircle, Film, Sparkles, Server } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface ProcessingProgressProps {
  project: Project;
  job: ProcessingJob;
  onCancel: () => void;
  onRetry?: () => void;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  project,
  job,
  onCancel,
  onRetry,
}) => {
  const currentStage = job.stages[job.currentStageIndex] || job.stages[0];

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* Video Summary Card */}
      <div className="bg-dark-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:w-36 aspect-video rounded-xl overflow-hidden bg-dark-950 border border-slate-800 shrink-0">
          {project.sourceVideo.thumbnailUrl ? (
            <img
              src={project.sourceVideo.thumbnailUrl}
              alt="Source preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Film className="w-8 h-8" />
            </div>
          )}
          <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
            {formatDuration(project.sourceVideo.duration)}
          </span>
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <Badge variant="brand" size="sm">
              Processing Job
            </Badge>
            <span className="text-[11px] text-slate-400">
              Target: {project.config.clipCount === 'custom' ? project.config.customClipCount : project.config.clipCount} Clips ({project.config.aspectRatio})
            </span>
          </div>

          <h2 className="text-lg font-bold text-white truncate">{project.name}</h2>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            Source: {project.sourceVideo.name} • {project.config.contentType} • {project.config.targetDuration}s
          </p>
        </div>

        <div className="shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            leftIcon={<XCircle className="w-4 h-4 text-rose-400" />}
          >
            Cancel Pipeline
          </Button>
        </div>
      </div>

      {/* Main Progress Ring & Bar */}
      <div className="bg-dark-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-ping" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                {currentStage?.title || 'Processing Video'}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              {currentStage?.description || 'Evaluating video segments and generating clips...'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-300 font-mono">
              {job.progress}%
            </span>
            <p className="text-[11px] text-slate-400">Overall Pipeline</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-dark-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 ease-out shadow-glow-brand"
            style={{ width: `${Math.max(4, job.progress)}%` }}
          />
        </div>

        {/* Multi-stage Stepper */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Pipeline Stages (6 of 6)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {job.stages.map((stage, idx) => {
              const isCompleted = stage.status === 'completed';
              const isInProgress = stage.status === 'in_progress';
              const isPending = stage.status === 'pending';
              const isFailed = stage.status === 'failed';

              return (
                <div
                  key={stage.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                    isInProgress
                      ? 'bg-brand-500/10 border-brand-500/40 text-white'
                      : isCompleted
                      ? 'bg-dark-950/50 border-emerald-500/20 text-slate-300'
                      : isFailed
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-dark-950/20 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isInProgress && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isFailed && <AlertCircle className="w-4 h-4 text-rose-400" />}
                    {isPending && (
                      <span className="w-4 h-4 rounded-full border border-slate-700 text-[10px] flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 text-xs">
                    <span
                      className={`font-semibold block ${
                        isInProgress ? 'text-brand-300' : isCompleted ? 'text-slate-200' : ''
                      }`}
                    >
                      {stage.title}
                    </span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">
                      {stage.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Demo Notice Banner */}
        <div className="p-3.5 rounded-xl bg-dark-950 border border-brand-500/20 flex items-start gap-3 text-xs text-slate-400">
          <Server className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-200">Simulation Mode:</strong> Processing stages are simulated client-side for demonstration. When a production backend (FastAPI/FFmpeg) is connected, these steps communicate with asynchronous Celery/Redis workers.
          </div>
        </div>
      </div>
    </div>
  );
};
