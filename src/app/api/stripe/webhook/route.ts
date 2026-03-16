import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || secret === 'whsec_skip') {
      event = JSON.parse(body) as Stripe.Event;
    } else {
      const { constructWebhookEvent } = await import('@/lib/stripe');
      event = constructWebhookEvent(body, sig);
    }
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        const { stripe } = await import('@/lib/stripe');
        const sub = await stripe.subscriptions.retrieve(session.subscription as string) as unknown as { status: string; trial_end: number | null; current_period_end: number };
        await supabase.from('profiles').update({
          stripe_customer_id: session.customer as string,
          subscription_id: session.subscription as string,
          subscription_status: sub.status as 'trialing' | 'active',
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('id', userId);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription & { current_period_end: number; trial_end: number | null };
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', sub.customer as string).single();
      if (profile) {
        await supabase.from('profiles').update({
          subscription_id: sub.id,
          subscription_status: sub.status as SubscriptionStatus,
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('id', profile.id);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', sub.customer as string).single();
      if (profile) {
        await supabase.from('profiles').update({ subscription_status: 'cancelled' }).eq('id', profile.id);
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const { data: profile } = await supabase.from('profiles').select('id, email').eq('stripe_customer_id', invoice.customer as string).single();
      if (profile) {
        await supabase.from('profiles').update({ subscription_status: 'past_due' }).eq('id', profile.id);
        const { sendPaymentFailed } = await import('@/lib/resend');
        if (profile.email) await sendPaymentFailed(profile.email).catch(console.error);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'inactive';
