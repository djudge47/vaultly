import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createAdminClient } from '@/lib/supabase/server';

const PUBLIC_ROUTES = ['/', '/pricing', '/auth/sign-in', '/auth/sign-up', '/auth/callback'];
const AUTH_ONLY_ROUTES = ['/onboarding'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith('/auth/'))) {
    return await updateSession(request).then(r => r.supabaseResponse);
  }

  const { supabaseResponse, user } = await updateSession(request);

  if (!user) {
    const url = new URL('/auth/sign-in', request.url);
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
    return supabaseResponse;
  }

  if (pathname.startsWith('/dashboard')) {
    // Demo mode — skip billing check
    if (process.env.DEMO_MODE === 'true') return supabaseResponse;

    try {
      const adminSupabase = createAdminClient();
      const { data: profile, error } = await adminSupabase
        .from('profiles')
        .select('subscription_status, trial_ends_at, current_period_end')
        .eq('id', user.id)
        .single();

      if (error || !profile) return supabaseResponse;

      const now = new Date();
      const { subscription_status, trial_ends_at } = profile;

      if (subscription_status === 'active') return supabaseResponse;
      if (subscription_status === 'trialing' && trial_ends_at && new Date(trial_ends_at) > now) return supabaseResponse;
      if (['cancelled', 'past_due', 'inactive'].includes(subscription_status ?? '')) {
        return NextResponse.redirect(new URL(`/pricing?reason=${subscription_status}`, request.url));
      }
    } catch {
      return supabaseResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
