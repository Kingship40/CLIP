import React from 'react';
import { VideoMetadata } from '../../types';
import { formatDuration, formatFileSize } from '../../utils/formatters';
import { Film, Maximize2, Clock, HardDrive, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface VideoMetadataPanelProps {
  metadata: VideoMetadata;
  videoUrl?: string;
  onReset: () => void;
}

export const VideoMetadataPanel: React.FC<VideoMetadataPanelProps> = ({
  metadata,
  onReset,
}) => {
  return (
    <div className="bg-[var(--bg-surface)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Thumbnail Frame (Confidential Master Preview) */}
        <div className="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-[var(--bg-surface-2)] dark:bg-dark-950 border border-[var(--border)] dark:border-slate-800 shrink-0 shadow-sm">
          {metadata.thumbnailUrl ? (
            <img
              src={metadata.thumbnailUrl}
              alt="Source video frame"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
              <Film className="w-8 h-8" />
            </div>
          )}
          <span className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
            {formatDuration(metadata.duration)}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="emerald" size="sm" className="flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>Private Backend Ingestion</span>
            </Badge>
            <Badge variant="neutral" size="sm" className="font-semibold">
              {metadata.aspectRatio}
            </Badge>
            <Badge variant="brand" size="sm" className="font-semibold">
              {metadata.width} × {metadata.height}
            </Badge>
          </div>

          <h3 className="text-base font-bold text-[var(--text-primary)] dark:text-white truncate mb-2" title={metadata.fileName}>
            {metadata.fileName}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-[var(--text-secondary)] dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] dark:text-slate-500" />
              <span>Duration: <strong className="text-[var(--text-primary)] dark:text-slate-200">{formatDuration(metadata.duration)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[var(--text-muted)] dark:text-slate-500" />
              <span>Size: <strong className="text-[var(--text-primary)] dark:text-slate-200">{formatFileSize(metadata.fileSize)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[var(--text-muted)] dark:text-slate-500" />
              <span>Type: <strong className="text-[var(--text-primary)] dark:text-slate-200 uppercase">{metadata.fileType.split('/')[1] || 'MP4'}</strong></span>
            </div>
          </div>
        </div>

        {/* Change Video Action */}
        <div className="sm:self-center shrink-0 w-full sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={onReset}
            className="w-full sm:w-auto font-semibold shadow-sm"
          >
            Change Video
          </Button>
        </div>
      </div>
    </div>
  );
};
