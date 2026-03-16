import { NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendPaymentFailed } from '@/lib/resend';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // If no webhook secret configured, skip signature verification (dev only)
    if (!process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET === 'whsec_REPLACE_AFTER_CREATING_WEBHOOK') {
      event = JSON.parse(body) as Stripe.Event;
    } else {
      event = constructWebhookEvent(body, sig);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscription = session.subscription as string;

      if (userId && subscription) {
        const stripe = (await import('@/lib/stripe')).stripe;
        const sub = await stripe.subscriptions.retrieve(subscription);
        await supabase.from('billing_status').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription,
          status: sub.status,
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await supabase
        .from('billing_status')
        .update({
          stripe_subscription_id: sub.id,
          status: sub.status,
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from('billing_status')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', sub.customer as string);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase
        .from('billing_status')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', invoice.customer as string);

      // Get user email and send notification
      const { data: billing } = await supabase
        .from('billing_status')
        .select('user_id')
        .eq('stripe_customer_id', invoice.customer as string)
        .single();

      if (billing) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', billing.user_id)
          .single();
        if (profile?.email) {
          await sendPaymentFailed(profile.email).catch(console.error);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
