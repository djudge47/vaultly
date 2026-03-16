import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createAdminClient } from '@/lib/supabase/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/pricing', '/auth/sign-in', '/auth/sign-up', '/auth/callback'];

// Routes that require auth but NOT an active billing status
const AUTH_ONLY_ROUTES = ['/onboarding'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith('/auth/'))) {
    return await updateSession(request).then(r => r.supabaseResponse);
  }

  // Run Supabase session refresh
  const { supabaseResponse, user } = await updateSession(request);

  // Not authenticated → redirect to sign-in
  if (!user) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Auth-only routes (onboarding) — don't check billing
  if (AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // Dashboard routes — check billing status
  if (pathname.startsWith('/dashboard')) {
    // In demo mode, skip billing check entirely
    if (process.env.DEMO_MODE === 'true') {
      return supabaseResponse;
    }

    try {
      const adminSupabase = createAdminClient();
      const { data: billingData, error } = await adminSupabase
        .from('billing_status')
        .select('status, trial_ends_at, current_period_end')
        .eq('user_id', user.id)
        .single();

      // If table doesn't exist or any DB error — allow through (schema not set up yet)
      if (error) {
        console.error('Billing check error (allowing through):', error.message);
        return supabaseResponse;
      }

      const billing = billingData as {
        status: string;
        trial_ends_at: string | null;
        current_period_end: string | null;
      } | null;

      // No billing record yet — allow through (will be created on next signup)
      if (!billing) {
        return supabaseResponse;
      }

      const now = new Date();

      // Allow active subscriptions
      if (billing.status === 'active') return supabaseResponse;

      // Allow active trials
      if (billing.status === 'trialing' && billing.trial_ends_at) {
        const trialEnd = new Date(billing.trial_ends_at);
        if (trialEnd > now) return supabaseResponse;
        return NextResponse.redirect(new URL('/pricing?reason=trial-expired', request.url));
      }

      // Blocked statuses
      if (['canceled', 'past_due', 'unpaid', 'incomplete'].includes(billing.status)) {
        return NextResponse.redirect(new URL(`/pricing?reason=${billing.status}`, request.url));
      }

      // Unknown status — allow through
      return supabaseResponse;

    } catch (error) {
      console.error('Middleware error (allowing through):', error);
      return supabaseResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
