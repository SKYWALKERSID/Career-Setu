import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns the environment-aware base URL of the application.
 * Automatically resolves Vercel deployment URLs in production,
 * NEXT_PUBLIC_SITE_URL if defined, window.location.origin in client browsers,
 * or defaults to http://localhost:3000 during local development.
 */
export function getURL() {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    'http://localhost:3000';

  // Make sure to include `https://` when using Vercel environment variables
  url = url.includes('http') ? url : `https://${url}`;
  // Remove trailing slash if present
  url = url.charAt(url.length - 1) === '/' ? url.slice(0, -1) : url;

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return url;
}
