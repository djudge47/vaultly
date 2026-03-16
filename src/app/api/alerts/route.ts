import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRenewalAlert } from '@/lib/resend';

// GET all alerts for user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: alerts } = await supabase
      .from('alerts')
      .select('*, subscription:subscriptions(merchant_name, amount_avg)')
      .eq('user_id', user.id)
      .order('trigger_date', { ascending: false })
      .limit(50);

    return NextResponse.json({ alerts: alerts ?? [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

// POST — generate alerts for upcoming renewals
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSupabase = createAdminClient();

    // Get user profile (for alert preferences + email)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileData } = await (adminSupabase as any)
      .from('profiles')
      .select('email, alert_preferences')
      .eq('id', user.id)
      .single();

    const profile = profileData as { email: string; alert_preferences: Record<string, boolean> } | null;
    const prefs = (profile?.alert_preferences as Record<string, boolean>) ?? {};

    // Get active subscriptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions } = await (adminSupabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('next_billing_date', 'is', null);

    let created = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const sub of subscriptions ?? []) {
      if (!sub.next_billing_date) continue;
      const billingDate = new Date(sub.next_billing_date);
      const daysUntil = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const alertDays: Array<{ days: number; type: string; prefKey: string }> = [
        { days: 7, type: 'renewal_7d', prefKey: 'renewal_7d' },
        { days: 3, type: 'renewal_3d', prefKey: 'renewal_3d' },
        { days: 1, type: 'renewal_1d', prefKey: 'renewal_1d' },
      ];

      for (const { days, type, prefKey } of alertDays) {
        if (daysUntil !== days) continue;
        if (prefs[prefKey] === false) continue;

        // Check if alert already exists
        const { data: existing } = await adminSupabase
          .from('alerts')
          .select('id')
          .eq('user_id', user.id)
          .eq('subscription_id', sub.id)
          .eq('alert_type', type)
          .eq('trigger_date', sub.next_billing_date)
          .single();

        if (existing) continue;

        const title = `${sub.merchant_name} renews in ${days} day${days !== 1 ? 's' : ''}`;
        const message = `$${Number(sub.amount_avg).toFixed(2)} will be charged on ${sub.next_billing_date}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminSupabase as any).from('alerts').insert({
          user_id: user.id,
          subscription_id: sub.id,
          alert_type: type,
          title,
          message,
          trigger_date: sub.next_billing_date,
          is_sent: false,
        });

        // Send email if enabled
        if (prefs.channel_email !== false && profile?.email) {
          await sendRenewalAlert(
            profile.email,
            sub.merchant_name,
            Number(sub.amount_avg),
            days,
            sub.next_billing_date
          ).catch(console.error);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (adminSupabase as any)
            .from('alerts')
            .update({ is_sent: true, sent_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('subscription_id', sub.id)
            .eq('alert_type', type);
        }

        created++;
      }
    }

    return NextResponse.json({ created });
  } catch (error) {
    console.error('Alert generation error:', error);
    return NextResponse.json({ error: 'Failed to generate alerts' }, { status: 500 });
  }
}
