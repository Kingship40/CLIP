import React from 'react';
import { Button } from './Button';
import { Video, AlertCircle } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed rounded-2xl"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl border flex items-center justify-center text-brand-500 mb-4 shadow-inner"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
        }}
      >
        {icon || <Video className="w-7 h-7" />}
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-xs sm:text-sm max-w-md mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="secondary" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20">
      <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h4>
      <p className="text-xs text-rose-600 dark:text-rose-300 max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border)',
          }}
        />
      ))}
    </div>
  );
};
