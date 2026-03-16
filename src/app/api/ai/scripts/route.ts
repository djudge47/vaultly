import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateScripts } from '@/lib/ai';
import type { Subscription, AiAnalysis } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subscriptionId } = await request.json();
    if (!subscriptionId) return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });

    const adminSupabase = createAdminClient();

    const { data: sub } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    const { data: analysis } = await adminSupabase
      .from('ai_analyses')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .single();

    const subForAI = {
      ...sub,
      merchant_name: sub.name,
      amount_avg: sub.amount,
      billing_cycle: sub.billing_interval,
    } as unknown as Subscription;

    const analysisForAI = analysis ? {
      recommendation: analysis.recommendation,
      reasoning: analysis.reasoning,
    } as Partial<AiAnalysis> : {};

    const scripts = await generateScripts(subForAI, analysisForAI);

    await adminSupabase.from('ai_analyses').update({
      cancellation_email: scripts.cancellation_email ?? null,
      negotiation_email: scripts.negotiation_email ?? null,
      phone_script: scripts.phone_script ?? null,
      chat_script: scripts.chat_script ?? null,
    }).eq('subscription_id', subscriptionId);

    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'generate_scripts',
      resource_type: 'subscription',
      resource_id: subscriptionId,
    });

    return NextResponse.json({ scripts });
  } catch (error) {
    console.error('Generate scripts error:', error);
    return NextResponse.json({ error: 'Script generation failed' }, { status: 500 });
  }
}
