import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { apiVersion: '2026-02-25.clover', typescript: true });
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export async function createStripeCustomer(email: string, name?: string) {
  return getStripe().customers.create({ email, name: name ?? undefined });
}

export async function createCheckoutSession({
  customerId, priceId, successUrl, cancelUrl, userId,
}: {
  customerId: string; priceId: string; successUrl: string; cancelUrl: string; userId: string;
}) {
  return getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    allow_promotion_codes: true,
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return getStripe().billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
}

export function constructWebhookEvent(payload: string | Buffer, sig: string) {
  return getStripe().webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
}
