import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('amount, recommendation, annual_savings_potential')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const subs = subscriptions ?? [];
    const totalMonthlySpend = subs.reduce((s, sub) => s + Number(sub.amount), 0);
    const wasteSubs = subs.filter(s => s.recommendation !== 'keep' && s.recommendation !== null);
    const monthlyWaste = wasteSubs.reduce((s, sub) => s + Number(sub.amount), 0);
    const annualSavings = wasteSubs.reduce((s, sub) => s + Number(sub.annual_savings_potential ?? Number(sub.amount) * 12), 0);
    const leakScore = totalMonthlySpend > 0 ? Math.round((monthlyWaste / totalMonthlySpend) * 100) : 0;

    return NextResponse.json({
      leakScore,
      totalMonthlySpend,
      monthlyWaste,
      potentialAnnualSavings: annualSavings,
      subscriptionCount: subs.length,
      cancelCount: subs.filter(s => s.recommendation === 'cancel').length,
      downgradeCount: subs.filter(s => s.recommendation === 'downgrade').length,
      keepCount: subs.filter(s => s.recommendation === 'keep').length,
    });
  } catch (error) {
    console.error('Leak score error:', error);
    return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 });
  }
}
