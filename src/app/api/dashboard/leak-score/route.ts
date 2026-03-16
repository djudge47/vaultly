import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LeakScoreData } from '@/types';

function calculateLeakScore(subscriptions: Array<{
  amount_avg: number;
  ai_analysis?: { recommendation?: string | null; potential_annual_savings?: number | null } | null;
}>): LeakScoreData {
  const totalMonthlySpend = subscriptions.reduce((sum, s) => sum + Number(s.amount_avg), 0);
  const wasteSubscriptions = subscriptions.filter(s => s.ai_analysis?.recommendation !== 'keep');
  const monthlyWaste = wasteSubscriptions.reduce((sum, s) => sum + Number(s.amount_avg), 0);
  const annualSavings = wasteSubscriptions.reduce(
    (sum, s) => sum + Number(s.ai_analysis?.potential_annual_savings ?? Number(s.amount_avg) * 12),
    0
  );

  const leakScore = totalMonthlySpend > 0
    ? Math.round((monthlyWaste / totalMonthlySpend) * 100)
    : 0;

  return {
    leakScore,
    totalMonthlySpend,
    monthlyWaste,
    potentialAnnualSavings: annualSavings,
    subscriptionCount: subscriptions.length,
    cancelCount: subscriptions.filter(s => s.ai_analysis?.recommendation === 'cancel').length,
    downgradeCount: subscriptions.filter(s => s.ai_analysis?.recommendation === 'downgrade').length,
    keepCount: subscriptions.filter(s => s.ai_analysis?.recommendation === 'keep').length,
  };
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
      .eq('is_active', true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSubs = (subscriptions ?? []) as any[];
    const subs = rawSubs.map((s: any) => ({
      ...s,
      ai_analysis: Array.isArray(s.ai_analysis) ? s.ai_analysis[0] ?? null : s.ai_analysis,
    }));

    const data = calculateLeakScore(subs);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Leak score error:', error);
    return NextResponse.json({ error: 'Failed to calculate leak score' }, { status: 500 });
  }
}
