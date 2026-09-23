import * as React from 'react';

export interface LoadingStateProps {
  message?: string;
  label?: string;
}

export function LoadingState({ message = 'Loading content...', label }: LoadingStateProps) {
  const displayMessage = label || message;
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 mb-3" />
      <p className="text-sm font-medium text-slate-600">{displayMessage}</p>
    </div>
  );
}
