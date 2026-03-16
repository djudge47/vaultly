import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// Normalize merchant names for grouping
function normalizeMerchant(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(inc|llc|ltd|corp|co)\.?$/i, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Detect billing cycle from date gaps
function detectBillingCycle(dates: string[]): { cycle: string; avgDays: number } {
  if (dates.length < 2) return { cycle: 'monthly', avgDays: 30 };

  const sorted = [...dates].sort();
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / (1000 * 60 * 60 * 24);
    gaps.push(diff);
  }
  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

  if (avgGap >= 6 && avgGap <= 8) return { cycle: 'weekly', avgDays: 7 };
  if (avgGap >= 25 && avgGap <= 35) return { cycle: 'monthly', avgDays: 30 };
  if (avgGap >= 85 && avgGap <= 95) return { cycle: 'quarterly', avgDays: 90 };
  if (avgGap >= 355 && avgGap <= 375) return { cycle: 'annual', avgDays: 365 };

  return { cycle: 'monthly', avgDays: avgGap };
}

// Categorize merchant
function categorize(name: string): string {
  const n = name.toLowerCase();
  if (/netflix|hulu|disney|hbo|peacock|paramount|apple.?tv|spotify|apple.?music|tidal|pandora|youtube/.test(n)) return 'streaming';
  if (/adobe|notion|slack|zoom|dropbox|google.?one|microsoft|github|figma|linear|asana/.test(n)) return 'saas';
  if (/gym|peloton|planet.?fitness|beachbody|crunch|orange|noom|strava/.test(n)) return 'fitness';
  if (/hellofresh|blue.?apron|factor|green.?chef|sunbasket/.test(n)) return 'food';
  if (/nordvpn|expressvpn|lastpass|1password|dashlane|identity/.test(n)) return 'security';
  if (/times|post|wsj|bloomberg|atlantic|economist|reuters|nyt/.test(n)) return 'news';
  if (/amazon|walmart|target|costco|instacart|doordash|uber/.test(n)) return 'shopping';
  if (/chatgpt|openai|anthropic|midjourney|dalle|jasper/.test(n)) return 'ai';
  return 'other';
}

// POST /api/subscriptions — detect recurring subscriptions from transactions
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSupabase = createAdminClient();

    // Get all transactions for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: transactions } = await (adminSupabase as any)
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }) as {
        data: Array<{
          merchant_name: string | null;
          amount: number;
          date: string;
        }> | null
      };

    if (!transactions?.length) {
      return NextResponse.json({ detected: 0 });
    }

    // Group by normalized merchant name
    const groups = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      if (!tx.merchant_name) continue;
      const key = normalizeMerchant(tx.merchant_name);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tx);
    }

    let detected = 0;

    for (const [normalized, txs] of groups) {
      if (txs.length < 2) continue;

      const dates = txs.map(t => t.date);
      const { cycle, avgDays } = detectBillingCycle(dates);
      const amounts = txs.map(t => Number(t.amount));

      // Check amount variance ≤ 10%
      const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
      const maxDeviation = Math.max(...amounts.map(a => Math.abs(a - avgAmount) / avgAmount));
      if (maxDeviation > 0.15) continue; // Too much variance — not a subscription

      // Verify timing windows
      const sortedDates = [...dates].sort();
      const gaps: number[] = [];
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) / (1000 * 60 * 60 * 24);
        gaps.push(diff);
      }

      const validCycle = gaps.every(g => {
        if (cycle === 'weekly') return g >= 5 && g <= 10;
        if (cycle === 'monthly') return g >= 22 && g <= 38;
        if (cycle === 'quarterly') return g >= 80 && g <= 100;
        if (cycle === 'annual') return g >= 350 && g <= 380;
        return true;
      });

      if (!validCycle && cycle !== 'monthly') continue;

      // Calculate next billing date
      const lastDate = new Date(Math.max(...txs.map(t => new Date(t.date).getTime())));
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + avgDays);

      const merchantName = txs[0].merchant_name!;
      const confidence = Math.min(0.5 + txs.length * 0.1, 0.99);

      // Upsert subscription
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (adminSupabase as any)
        .from('subscriptions')
        .upsert(
          {
            user_id: user.id,
            merchant_name: merchantName,
            normalized_merchant: normalized,
            category: categorize(merchantName),
            amount_avg: avgAmount,
            amount_last: amounts[0],
            billing_cycle: cycle,
            next_billing_date: nextDate.toISOString().split('T')[0],
            last_billing_date: lastDate.toISOString().split('T')[0],
            first_seen_date: sortedDates[0],
            is_active: true,
            source: 'plaid',
            detection_confidence: confidence,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,normalized_merchant',
            ignoreDuplicates: false,
          }
        );

      if (!error) detected++;
    }

    return NextResponse.json({ detected });
  } catch (error) {
    console.error('Detection error:', error);
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
  }
}

// GET /api/subscriptions — list all subscriptions for the user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        ai_analysis:ai_analyses(*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('amount_avg', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ subscriptions: subscriptions ?? [] });
  } catch (error) {
    console.error('List subscriptions error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
