import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * OAuth + email-confirmation callback handler.
 *
 * Supabase redirects here after:
 *  - Google OAuth
 *  - Email confirmation link
 *
 * After exchanging the code for a session we check the student profile
 * to decide whether to send the user to onboarding or the dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Preserve any downstream redirect the middleware may have added
  const next = searchParams.get('next') ?? '/dashboard';

  // We will build the response after determining destination,
  // but collect cookies during code exchange.
  const cookieCollector: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieCollector.push({ name, value, options });
        },
        remove(name: string, options: CookieOptions) {
          cookieCollector.push({ name, value: '', options });
        },
      },
    }
  );

  const clearSessionAndRedirect = async (errorCode: string) => {
    // Never let a failed OAuth attempt fall back to the previous account.
    await supabase.auth.signOut({ scope: 'local' });
    const response = NextResponse.redirect(`${origin}/signup?error=${errorCode}`);
    cookieCollector.forEach(({ name, value, options }) => {
      response.cookies.set({ name, value, ...options });
    });
    return response;
  };

  if (!code) {
    return clearSessionAndRedirect('missing_code');
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error('[auth/callback] exchangeCodeForSession error:', error?.message);
    return clearSessionAndRedirect('auth_callback_failed');
  }

  const userId = data.session.user.id;

  // Determine if onboarding is complete by checking student_profiles
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  const destination = studentProfile ? next : '/onboarding';

  // Construct final redirect response and attach all session cookies
  const finalResponse = NextResponse.redirect(`${origin}${destination}`);
  cookieCollector.forEach(({ name, value, options }) => {
    finalResponse.cookies.set({ name, value, ...options });
  });

  return finalResponse;
}
