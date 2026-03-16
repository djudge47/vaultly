import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: alerts } = await supabase
      .from('alerts')
      .select('*, subscription:subscriptions(name, amount)')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('scheduled_for', { ascending: false })
      .limit(50);

    return NextResponse.json({ alerts: alerts ?? [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase.from('profiles').select('email, alert_email, alert_renewal_days').eq('id', user.id).single();
    const { data: subscriptions } = await adminSupabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').not('next_billing_date', 'is', null);

    let created = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const sub of subscriptions ?? []) {
      if (!sub.next_billing_date) continue;
      const billingDate = new Date(sub.next_billing_date);
      const daysUntil = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const alertDays = profile?.alert_renewal_days ?? [7, 3, 1];

      if (!alertDays.includes(daysUntil)) continue;

      const { data: existing } = await adminSupabase.from('alerts').select('id').eq('user_id', user.id).eq('subscription_id', sub.id).eq('scheduled_for', billingDate.toISOString()).single();
      if (existing) continue;

      await adminSupabase.from('alerts').insert({
        user_id: user.id,
        subscription_id: sub.id,
        type: 'renewal',
        channel: 'in_app',
        title: `${sub.name} renews in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
        message: `$${Number(sub.amount).toFixed(2)} will be charged on ${sub.next_billing_date}`,
        scheduled_for: billingDate.toISOString(),
      });

      created++;
    }

    return NextResponse.json({ created });
  } catch (error) {
    console.error('Alert generation error:', error);
    return NextResponse.json({ error: 'Failed to generate alerts' }, { status: 500 });
  }
}
