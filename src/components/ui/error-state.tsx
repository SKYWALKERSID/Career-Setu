import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while processing your request.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-4 border-red-200 text-red-700 hover:bg-red-50">
          Try Again
        </Button>
      )}
    </div>
  );
}
