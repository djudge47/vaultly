import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

const DEMO_SUBSCRIPTIONS = [
  { name: 'Netflix', merchant_name: 'Netflix', category: 'streaming', amount: 22.99, billing_interval: 'monthly' as const, days_until: 12, days_since: 18, days_old: 730 },
  { name: 'Spotify Premium', merchant_name: 'Spotify', category: 'streaming', amount: 10.99, billing_interval: 'monthly' as const, days_until: 5, days_since: 25, days_old: 540 },
  { name: 'Apple Music', merchant_name: 'Apple Music', category: 'streaming', amount: 10.99, billing_interval: 'monthly' as const, days_until: 8, days_since: 22, days_old: 180 },
  { name: 'Disney+', merchant_name: 'Disney+', category: 'streaming', amount: 13.99, billing_interval: 'monthly' as const, days_until: 15, days_since: 15, days_old: 365 },
  { name: 'HBO Max', merchant_name: 'HBO Max', category: 'streaming', amount: 15.99, billing_interval: 'monthly' as const, days_until: 3, days_since: 27, days_old: 200 },
  { name: 'Adobe Creative Cloud', merchant_name: 'Adobe', category: 'saas', amount: 54.99, billing_interval: 'monthly' as const, days_until: 20, days_since: 10, days_old: 900 },
  { name: 'Notion', merchant_name: 'Notion', category: 'saas', amount: 10.00, billing_interval: 'monthly' as const, days_until: 7, days_since: 23, days_old: 365 },
  { name: 'ChatGPT Plus', merchant_name: 'OpenAI', category: 'ai', amount: 20.00, billing_interval: 'monthly' as const, days_until: 11, days_since: 19, days_old: 300 },
  { name: 'Peloton App', merchant_name: 'Peloton', category: 'fitness', amount: 12.99, billing_interval: 'monthly' as const, days_until: 2, days_since: 28, days_old: 450 },
  { name: 'Planet Fitness', merchant_name: 'Planet Fitness', category: 'fitness', amount: 24.99, billing_interval: 'monthly' as const, days_until: 1, days_since: 29, days_old: 600 },
  { name: 'HelloFresh', merchant_name: 'HelloFresh', category: 'food', amount: 59.94, billing_interval: 'weekly' as const, days_until: 2, days_since: 5, days_old: 120 },
  { name: 'Dropbox Plus', merchant_name: 'Dropbox', category: 'saas', amount: 11.99, billing_interval: 'monthly' as const, days_until: 18, days_since: 12, days_old: 1095 },
  { name: 'iCloud+ 200GB', merchant_name: 'Apple', category: 'saas', amount: 2.99, billing_interval: 'monthly' as const, days_until: 9, days_since: 21, days_old: 730 },
  { name: 'NordVPN', merchant_name: 'NordVPN', category: 'security', amount: 12.99, billing_interval: 'monthly' as const, days_until: 14, days_since: 16, days_old: 60 },
  { name: 'The New York Times', merchant_name: 'NYT', category: 'news', amount: 17.00, billing_interval: 'monthly' as const, days_until: 22, days_since: 8, days_old: 400 },
];

function addDays(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; }
function subDays(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSupabase = createAdminClient();

    // Delete existing demo subscriptions
    await adminSupabase.from('subscriptions').delete().eq('user_id', user.id);

    const rows = DEMO_SUBSCRIPTIONS.map(sub => ({
      user_id: user.id,
      name: sub.name,
      merchant_name: sub.merchant_name,
      category: sub.category,
      amount: sub.amount,
      billing_interval: sub.billing_interval,
      next_billing_date: addDays(sub.days_until),
      last_billing_date: subDays(sub.days_since),
      status: 'active' as const,
      confidence: 0.95,
    }));

    const { error } = await adminSupabase.from('subscriptions').insert(rows);
    if (error) throw error;

    // Ensure trial billing status
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await adminSupabase.from('profiles').update({
      subscription_status: 'trialing',
      trial_ends_at: trialEnd,
      current_period_end: trialEnd,
      bank_connected: true,
    }).eq('id', user.id);

    return NextResponse.json({ inserted: rows.length });
  } catch (error) {
    console.error('Demo data error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
