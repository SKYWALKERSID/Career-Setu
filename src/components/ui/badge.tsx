import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'info' | 'verified';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-brand-50 text-brand-700 border-brand-200',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    outline: 'bg-transparent text-slate-700 border-slate-300',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    verified: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
  };

  return (
    <div
      className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors', variants[variant], className)}
      {...props}
    />
  );
}
