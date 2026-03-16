import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { userId, email, name } = await request.json();
    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const priceId = process.env.STRIPE_PRICE_ID;
    const demoMode = process.env.DEMO_MODE === 'true';

    // Demo mode or no price ID — skip Stripe, create trial directly
    if (demoMode || !priceId || priceId.includes('REPLACE')) {
      const supabase = createAdminClient();
      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: `demo_${userId.slice(0, 8)}`,
          subscription_status: 'trialing',
          trial_ends_at: trialEnd,
          current_period_end: trialEnd,
        })
        .eq('id', userId);
      return NextResponse.json({ url: `${appUrl}/onboarding` });
    }

    // Real Stripe checkout
    const { createStripeCustomer, createCheckoutSession } = await import('@/lib/stripe');
    const customer = await createStripeCustomer(email, name);

    const supabase = createAdminClient();
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      successUrl: `${appUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/pricing`,
      userId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
