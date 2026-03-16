import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

function normalizeMerchant(name: string): string {
  return name.toLowerCase().replace(/\s+(inc|llc|ltd|corp|co)\.?$/i, '').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function detectBillingCycle(dates: string[]): { cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'; avgDays: number } {
  if (dates.length < 2) return { cycle: 'monthly', avgDays: 30 };
  const sorted = [...dates].sort();
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push((new Date(sorted[i]).getTime() - new Date(sorted[i-1]).getTime()) / (1000 * 60 * 60 * 24));
  }
  const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  if (avg >= 6 && avg <= 8) return { cycle: 'weekly', avgDays: 7 };
  if (avg >= 25 && avg <= 35) return { cycle: 'monthly', avgDays: 30 };
  if (avg >= 85 && avg <= 95) return { cycle: 'quarterly', avgDays: 90 };
  if (avg >= 355 && avg <= 375) return { cycle: 'yearly', avgDays: 365 };
  return { cycle: 'monthly', avgDays: avg };
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSupabase = createAdminClient();

    const { data: transactions } = await adminSupabase
      .from('transactions')
      .select('merchant_name, name, amount, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (!transactions?.length) return NextResponse.json({ detected: 0 });

    const groups = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const merchantName = tx.merchant_name ?? tx.name;
      if (!merchantName) continue;
      const key = normalizeMerchant(merchantName);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tx);
    }

    let detected = 0;

    for (const [, txs] of groups) {
      if (txs.length < 2) continue;
      const dates = txs.map(t => t.date);
      const { cycle, avgDays } = detectBillingCycle(dates);
      const amounts = txs.map(t => Number(t.amount));
      const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
      const maxDev = Math.max(...amounts.map(a => Math.abs(a - avgAmount) / avgAmount));
      if (maxDev > 0.15) continue;

      const lastDate = new Date(Math.max(...txs.map(t => new Date(t.date).getTime())));
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + avgDays);

      const merchantName = txs[0].merchant_name ?? txs[0].name ?? 'Unknown';

      const { error } = await adminSupabase.from('subscriptions').upsert({
        user_id: user.id,
        name: merchantName,
        merchant_name: merchantName,
        amount: avgAmount,
        billing_interval: cycle,
        next_billing_date: nextDate.toISOString().split('T')[0],
        last_billing_date: lastDate.toISOString().split('T')[0],
        status: 'active',
        confidence: Math.min(0.5 + txs.length * 0.1, 0.99),
        transaction_count: txs.length,
      }, { onConflict: 'user_id,name', ignoreDuplicates: false });

      if (!error) detected++;
    }

    return NextResponse.json({ detected });
  } catch (error) {
    console.error('Detection error:', error);
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*, ai_analysis:ai_analyses(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('amount', { ascending: false });

    return NextResponse.json({ subscriptions: subscriptions ?? [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
