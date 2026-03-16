import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPortalSession } from '@/lib/stripe';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: billing } = await (supabase as any)
      .from('billing_status')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single() as { data: { stripe_customer_id: string } | null };

    if (!billing?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing record found' }, { status: 404 });
    }

    const session = await createPortalSession(
      billing.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
