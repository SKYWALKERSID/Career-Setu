import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 100
  barClassName?: string;
}

export function Progress({ className, value = 0, barClassName, ...props }: ProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100', className)}
      {...props}
    >
      <div
        className={cn('h-full bg-brand-600 transition-all duration-300 ease-in-out', barClassName)}
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}
