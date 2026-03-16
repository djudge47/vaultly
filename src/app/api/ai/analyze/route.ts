import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { analyzeSubscription } from '@/lib/ai';
import type { Subscription } from '@/types';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSupabase = createAdminClient();

    const { data: subscriptions } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (!subscriptions?.length) return NextResponse.json({ analyzed: 0 });

    const totalMonthlySpend = subscriptions.reduce((s, sub) => s + Number(sub.amount), 0);
    const subscriptionCount = subscriptions.length;
    let analyzed = 0;

    for (const sub of subscriptions) {
      // Skip if already analyzed recently
      if (sub.last_analyzed_at) continue;

      const sameCategorySubs = subscriptions
        .filter(s => s.id !== sub.id && s.category === sub.category)
        .map(s => s.name);

      const context = { totalMonthlySpend, subscriptionCount, sameCategorySubs };

      // Map to Subscription type for AI
      const subForAI = {
        ...sub,
        merchant_name: sub.name,
        amount_avg: sub.amount,
        amount_last: sub.amount,
        billing_cycle: sub.billing_interval,
        first_seen_date: sub.detected_at,
      } as unknown as Subscription;

      const result = await analyzeSubscription(subForAI, context);

      await adminSupabase.from('ai_analyses').upsert({
        user_id: user.id,
        subscription_id: sub.id,
        value_score: result.value_score ?? 50,
        waste_risk: result.waste_risk ?? 50,
        recommendation: result.recommendation ?? 'keep',
        reasoning: result.reasoning ?? '',
        annual_savings_potential: result.potential_annual_savings ?? 0,
        model_used: 'claude-sonnet-4-20250514',
      }, { onConflict: 'subscription_id' });

      // Update subscription with scores
      await adminSupabase.from('subscriptions').update({
        value_score: result.value_score ?? 50,
        waste_risk: result.waste_risk ?? 50,
        recommendation: result.recommendation as 'keep' | 'cancel' | 'downgrade' | 'review' ?? 'keep',
        annual_savings_potential: result.potential_annual_savings ?? 0,
        ai_reasoning: result.reasoning ?? '',
        last_analyzed_at: new Date().toISOString(),
      }).eq('id', sub.id);

      analyzed++;
      await new Promise(r => setTimeout(r, 200));
    }

    return NextResponse.json({ analyzed });
  } catch (error) {
    console.error('AI analyze error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
