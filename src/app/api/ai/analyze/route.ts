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

    // Get all active subscriptions without analysis
    const { data: rawSubs } = await adminSupabase
      .from('subscriptions')
      .select('*, ai_analysis:ai_analyses(*)')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const subscriptions = (rawSubs ?? []) as Array<{
      id: string;
      merchant_name: string;
      category: string | null;
      amount_avg: number;
      amount_last: number | null;
      billing_cycle: string;
      first_seen_date: string | null;
      ai_analysis: Array<{ id: string }> | null;
      [key: string]: unknown;
    }>;

    if (!subscriptions?.length) {
      return NextResponse.json({ analyzed: 0 });
    }

    // Build user context
    const totalMonthlySpend = subscriptions.reduce((s, sub) => s + Number(sub.amount_avg), 0);
    const subscriptionCount = subscriptions.length;

    let analyzed = 0;

    for (const sub of subscriptions) {
      // Skip if already analyzed
      if (sub.ai_analysis && Array.isArray(sub.ai_analysis) ? sub.ai_analysis.length > 0 : sub.ai_analysis) continue;

      // Find other subs in same category
      const sameCategorySubs = subscriptions
        .filter(s => s.id !== sub.id && s.category === sub.category)
        .map(s => s.merchant_name);

      const context = { totalMonthlySpend, subscriptionCount, sameCategorySubs };

      const result = await analyzeSubscription(sub as unknown as Subscription, context);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminSupabase as any).from('ai_analyses').upsert({
        user_id: user.id,
        subscription_id: sub.id,
        value_score: result.value_score ?? null,
        waste_risk: result.waste_risk ?? null,
        recommendation: result.recommendation ?? null,
        reasoning: result.reasoning ?? null,
        potential_annual_savings: result.potential_annual_savings ?? null,
        model_version: 'claude-sonnet-4-20250514',
      });

      analyzed++;

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    return NextResponse.json({ analyzed });
  } catch (error) {
    console.error('AI analyze error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
