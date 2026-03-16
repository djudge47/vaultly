import { NextResponse } from 'next/server';
import { createStripeCustomer, createCheckoutSession } from '@/lib/stripe';
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

    // Skip Stripe in demo mode OR if no price ID — create billing record directly
    if (demoMode || !priceId || priceId.startsWith('price_REPLACE')) {
      const supabase = createAdminClient();
      await supabase.from('billing_status').upsert({
        user_id: userId,
        stripe_customer_id: `dev_${userId.slice(0, 8)}`,
        stripe_subscription_id: null,
        status: 'trialing',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        current_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      return NextResponse.json({ url: `${appUrl}/onboarding` });
    }

    // Create Stripe customer
    const customer = await createStripeCustomer(email, name);

    // Store customer ID immediately so billing status exists
    const supabase = createAdminClient();
    await supabase.from('billing_status').upsert({
      user_id: userId,
      stripe_customer_id: customer.id,
      status: 'incomplete',
    });

    // Create checkout session
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
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
