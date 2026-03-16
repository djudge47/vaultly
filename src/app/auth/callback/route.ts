import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if billing record already exists (returning user)
      const { data: billing } = await supabase
        .from('billing_status')
        .select('id')
        .eq('user_id', data.user.id)
        .single();

      if (!billing) {
        // New user — create Stripe checkout
        const res = await fetch(`${origin}/api/stripe/create-checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name,
          }),
        });
        const { url } = await res.json();
        if (url) return NextResponse.redirect(url);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=oauth_error`);
}
