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

  if (!code) {
    // No code – redirect to signup with an error hint
    return NextResponse.redirect(`${origin}/signup?error=missing_code`);
  }

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error('[auth/callback] exchangeCodeForSession error:', error?.message);
    const errResponse = NextResponse.redirect(`${origin}/signup?error=auth_callback_failed`);
    cookieCollector.forEach(({ name, value, options }) => {
      errResponse.cookies.set({ name, value, ...options });
    });
    return errResponse;
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
