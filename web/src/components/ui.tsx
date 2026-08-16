'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '@web/lib/cn';

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-surface-card p-4 shadow-card',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
}) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary-600',
    secondary:
      'bg-secondary/15 text-secondary-600 dark:text-emerald-300 hover:bg-secondary/25',
    ghost:
      'bg-transparent border border-line text-ink hover:bg-surface',
    danger: 'bg-danger text-white hover:bg-red-600',
    warning:
      'bg-accent/20 text-amber-800 dark:text-amber-200 hover:bg-accent/30',
  }[variant];

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50',
        styles,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  error,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      {label ? (
        <span className="text-sm font-medium text-ink">{label}</span>
      ) : null}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-xl border border-line bg-surface-input px-3 py-2.5 text-ink placeholder:text-ink-muted',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-ink-secondary">{description}</p>
      ) : null}
    </Card>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-danger/40 bg-red-50 dark:bg-red-950/40">
      <h2 className="text-base font-semibold text-danger">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-ink-secondary">{description}</p>
      ) : null}
      {onRetry ? (
        <Button className="mt-3" type="button" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </Card>
  );
}

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl bg-line/70 dark:bg-slate-700"
        />
      ))}
    </div>
  );
}

export function StatusBadge({
  label,
  tone = 'muted',
}: {
  label: string;
  tone?: 'primary' | 'secondary' | 'accent' | 'error' | 'muted';
}) {
  const tones = {
    primary: 'bg-blue-50 text-blue-700 dark:bg-[#1E3A5F] dark:text-blue-200',
    secondary:
      'bg-emerald-50 text-emerald-700 dark:bg-[#14532D] dark:text-emerald-200',
    accent: 'bg-amber-50 text-amber-800 dark:bg-[#422006] dark:text-amber-200',
    error: 'bg-red-50 text-red-700 dark:bg-[#450A0A] dark:text-red-200',
    muted: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  };
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
      )}
    >
      {label}
    </span>
  );
}
