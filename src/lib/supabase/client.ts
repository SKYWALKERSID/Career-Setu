import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return null or log warning in development/demo mode when env vars are unconfigured
    console.warn('Supabase URL or Anon Key missing in environment variables. Falling back to local/demo configuration.');
  }

  browserClient = createBrowserClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder-anon-key'
  );

  return browserClient;
}
