import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

const DEMO_SUBSCRIPTIONS = [
  { merchant_name: 'Netflix', normalized_merchant: 'netflix', category: 'streaming', amount_avg: 22.99, amount_last: 22.99, billing_cycle: 'monthly', days_until_next: 12, days_since_last: 18, days_since_first: 730 },
  { merchant_name: 'Spotify Premium', normalized_merchant: 'spotify', category: 'streaming', amount_avg: 10.99, amount_last: 10.99, billing_cycle: 'monthly', days_until_next: 5, days_since_last: 25, days_since_first: 540 },
  { merchant_name: 'Apple Music', normalized_merchant: 'apple_music', category: 'streaming', amount_avg: 10.99, amount_last: 10.99, billing_cycle: 'monthly', days_until_next: 8, days_since_last: 22, days_since_first: 180 },
  { merchant_name: 'Disney+', normalized_merchant: 'disney_plus', category: 'streaming', amount_avg: 13.99, amount_last: 13.99, billing_cycle: 'monthly', days_until_next: 15, days_since_last: 15, days_since_first: 365 },
  { merchant_name: 'HBO Max', normalized_merchant: 'hbo_max', category: 'streaming', amount_avg: 15.99, amount_last: 15.99, billing_cycle: 'monthly', days_until_next: 3, days_since_last: 27, days_since_first: 200 },
  { merchant_name: 'Adobe Creative Cloud', normalized_merchant: 'adobe_cc', category: 'saas', amount_avg: 54.99, amount_last: 54.99, billing_cycle: 'monthly', days_until_next: 20, days_since_last: 10, days_since_first: 900 },
  { merchant_name: 'Notion', normalized_merchant: 'notion', category: 'saas', amount_avg: 10.00, amount_last: 10.00, billing_cycle: 'monthly', days_until_next: 7, days_since_last: 23, days_since_first: 365 },
  { merchant_name: 'ChatGPT Plus', normalized_merchant: 'openai', category: 'ai', amount_avg: 20.00, amount_last: 20.00, billing_cycle: 'monthly', days_until_next: 11, days_since_last: 19, days_since_first: 300 },
  { merchant_name: 'Peloton App', normalized_merchant: 'peloton', category: 'fitness', amount_avg: 12.99, amount_last: 12.99, billing_cycle: 'monthly', days_until_next: 2, days_since_last: 28, days_since_first: 450 },
  { merchant_name: 'Planet Fitness', normalized_merchant: 'planet_fitness', category: 'fitness', amount_avg: 24.99, amount_last: 24.99, billing_cycle: 'monthly', days_until_next: 1, days_since_last: 29, days_since_first: 600 },
  { merchant_name: 'HelloFresh', normalized_merchant: 'hellofresh', category: 'food', amount_avg: 59.94, amount_last: 59.94, billing_cycle: 'weekly', days_until_next: 2, days_since_last: 5, days_since_first: 120 },
  { merchant_name: 'Dropbox Plus', normalized_merchant: 'dropbox', category: 'saas', amount_avg: 11.99, amount_last: 11.99, billing_cycle: 'monthly', days_until_next: 18, days_since_last: 12, days_since_first: 1095 },
  { merchant_name: 'iCloud+ 200GB', normalized_merchant: 'icloud', category: 'saas', amount_avg: 2.99, amount_last: 2.99, billing_cycle: 'monthly', days_until_next: 9, days_since_last: 21, days_since_first: 730 },
  { merchant_name: 'NordVPN', normalized_merchant: 'nordvpn', category: 'security', amount_avg: 12.99, amount_last: 12.99, billing_cycle: 'monthly', days_until_next: 14, days_since_last: 16, days_since_first: 60 },
  { merchant_name: 'The New York Times', normalized_merchant: 'nytimes', category: 'news', amount_avg: 17.00, amount_last: 17.00, billing_cycle: 'monthly', days_until_next: 22, days_since_last: 8, days_since_first: 400 },
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function subtractDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSupabase = createAdminClient();

    // Delete existing demo subscriptions for this user first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminSupabase as any)
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'demo');

    // Insert demo subscriptions
    const rows = DEMO_SUBSCRIPTIONS.map(sub => ({
      user_id: user.id,
      merchant_name: sub.merchant_name,
      normalized_merchant: sub.normalized_merchant,
      category: sub.category,
      amount_avg: sub.amount_avg,
      amount_last: sub.amount_last,
      billing_cycle: sub.billing_cycle,
      next_billing_date: addDays(sub.days_until_next),
      last_billing_date: subtractDays(sub.days_since_last),
      first_seen_date: subtractDays(sub.days_since_first),
      is_active: true,
      source: 'demo',
      detection_confidence: 0.95,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase as any)
      .from('subscriptions')
      .insert(rows);

    if (error) {
      console.error('Demo data insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inserted: rows.length });
  } catch (error) {
    console.error('Demo data error:', error);
    return NextResponse.json({ error: 'Failed to load demo data' }, { status: 500 });
  }
}
