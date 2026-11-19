import React, { useState, useRef } from 'react';
import { UploadCloud, FileVideo, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { formatFileSize } from '../../utils/formatters';

export interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  uploadProgress?: number;
}

const SUPPORTED_FORMATS = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
const SUPPORTED_EXTENSIONS = ['.mp4', '.mov', '.webm', '.mkv'];

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelected,
  isLoading = false,
  uploadProgress = 0,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);

    // Validate size (e.g. 1.5 GB limit for browser handling)
    const MAX_SIZE_BYTES = 1.5 * 1024 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`File is too large (${formatFileSize(file.size)}). Maximum recommended size is 1.5 GB.`);
      return;
    }

    // Validate format
    const hasValidExtension = SUPPORTED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    const hasValidMime = SUPPORTED_FORMATS.includes(file.type);

    if (!hasValidExtension && !hasValidMime) {
      setErrorMessage(
        `Unsupported video format. Please upload MP4, MOV, or WebM files.`
      );
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-sm ${
          isDragOver
            ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-500/10 shadow-glow-brand ring-4 ring-brand-500/10'
            : 'border-[var(--border)] hover:border-brand-500 bg-[var(--bg-surface)] hover:bg-[#F9FAFD] dark:bg-dark-900/60 dark:hover:bg-dark-900/90 dark:border-slate-800'
        } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_EXTENSIONS.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200/80 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400 flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-sm">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2 w-full max-w-xs">
            <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Extracting Video Metadata...</h4>
            <div className="w-full bg-[var(--bg-surface-2)] rounded-full h-2 overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <div
                className="bg-brand-600 dark:bg-brand-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(15, uploadProgress)}%` }}
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Analyzing frame dimensions and audio stream</p>
          </div>
        ) : (
          <>
            <h4 className="text-base sm:text-lg font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Drag & Drop your video file here
            </h4>
            <p className="text-xs sm:text-sm max-w-sm mb-5 leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>
              Upload long podcasts, webinars, keynote presentations, or tutorials to auto-generate shorts.
            </p>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<FileVideo className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Computer
            </Button>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> MP4, MOV, WebM
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Up to 1.5 GB
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 100% Client Privacy
              </span>
            </div>
          </>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="flex-1">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
