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

    // Get subscription + existing analysis
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawSub } = await (adminSupabase as any)
      .from('subscriptions')
      .select('*, ai_analysis:ai_analyses(*)')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    const sub = rawSub as (Subscription & { ai_analysis: AiAnalysis[] | null }) | null;

    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    const analysis = Array.isArray(sub.ai_analysis) ? sub.ai_analysis[0] : sub.ai_analysis;

    const scripts = await generateScripts(
      sub as unknown as Subscription,
      (analysis ?? {}) as Partial<AiAnalysis>
    );

    // Update the analysis record with scripts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminSupabase as any)
      .from('ai_analyses')
      .update({
        cancellation_email: scripts.cancellation_email ?? null,
        negotiation_email: scripts.negotiation_email ?? null,
        phone_script: scripts.phone_script ?? null,
        chat_script: scripts.chat_script ?? null,
      })
      .eq('subscription_id', subscriptionId);

    // Log the script generation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminSupabase as any).from('audit_logs').insert({
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
