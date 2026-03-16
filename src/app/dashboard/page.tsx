import { createClient } from '@/lib/supabase/server';
import { LeakScoreRing } from '@/components/dashboard/leak-score-ring';
import { StatCard } from '@/components/dashboard/stat-card';
import { SubscriptionCard } from '@/components/subscriptions/subscription-card';
import { SkeletonList } from '@/components/shared/empty-state';
import { formatCurrency } from '@/lib/utils';
import { TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { SubscriptionWithAnalysis } from '@/types';

async function getDashboardData(userId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawSubscriptions } = await (supabase as any)
    .from('subscriptions')
    .select('*, ai_analysis:ai_analyses(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('amount_avg', { ascending: false });

  const subscriptions = (rawSubscriptions ?? []) as any[];

  const subs: SubscriptionWithAnalysis[] = subscriptions.map((s: any) => ({
    ...s,
    ai_analysis: Array.isArray(s.ai_analysis) ? s.ai_analysis[0] ?? null : s.ai_analysis,
  })) as unknown as SubscriptionWithAnalysis[];

  const totalMonthlySpend = subs.reduce((s, sub) => s + Number(sub.amount_avg), 0);
  const wasteSubs = subs.filter(s => s.ai_analysis?.recommendation !== 'keep');
  const monthlyWaste = wasteSubs.reduce((s, sub) => s + Number(sub.amount_avg), 0);
  const annualSavings = wasteSubs.reduce(
    (s, sub) => s + Number(sub.ai_analysis?.potential_annual_savings ?? Number(sub.amount_avg) * 12), 0
  );
  const leakScore = totalMonthlySpend > 0 ? Math.round((monthlyWaste / totalMonthlySpend) * 100) : 0;

  const attentionSubs = subs
    .filter(s => s.ai_analysis?.recommendation === 'cancel' || s.ai_analysis?.recommendation === 'downgrade')
    .sort((a, b) => Number(b.ai_analysis?.waste_risk ?? 0) - Number(a.ai_analysis?.waste_risk ?? 0))
    .slice(0, 5);

  return { subs, leakScore, totalMonthlySpend, monthlyWaste, annualSavings, attentionSubs };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { subs, leakScore, totalMonthlySpend, monthlyWaste, annualSavings, attentionSubs } =
    await getDashboardData(user.id);

  const hasData = subs.length > 0;
  const hasAnalysis = subs.some(s => s.ai_analysis);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your subscription health at a glance</p>
      </div>

      {!hasData ? (
        // Empty state — no subscriptions yet
        <div className="rounded-2xl border bg-card p-12 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-primary/10">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-semibold">Connect your bank to get started</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Vaultly will scan your transactions and find all your recurring subscriptions automatically.
          </p>
          <Link href="/onboarding">
            <Button size="lg">Connect Bank Account →</Button>
          </Link>
        </div>
      ) : !hasAnalysis ? (
        // Has data but no AI analysis yet
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-8 text-center space-y-3">
            <div className="flex justify-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
            <p className="font-medium">Analyzing your {subs.length} subscriptions...</p>
            <p className="text-sm text-muted-foreground">AI is scoring each subscription. This takes ~30 seconds.</p>
          </div>
          <SkeletonList count={3} />
        </div>
      ) : (
        <>
          {/* Leak Score Ring */}
          <div className="flex justify-center py-4">
            <LeakScoreRing score={leakScore} />
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Monthly Waste"
              value={formatCurrency(monthlyWaste)}
              subtitle="From non-Keep subs"
              icon={TrendingDown}
              variant="rose"
            />
            <StatCard
              title="Annual Savings"
              value={formatCurrency(annualSavings)}
              subtitle="If you act now"
              icon={DollarSign}
              variant="emerald"
            />
          </div>

          {/* Needs Attention */}
          {attentionSubs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base">Needs Attention</h2>
                <Link href="/dashboard/subscriptions" className="text-sm text-primary hover:underline">
                  View all →
                </Link>
              </div>
              <div className="space-y-2">
                {attentionSubs.map(sub => (
                  <SubscriptionCard key={sub.id} subscription={sub} />
                ))}
              </div>
            </section>
          )}

          {/* Summary row */}
          <div className="rounded-2xl border bg-card p-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{subs.length} subscriptions tracked</span>
            <span className="font-mono font-medium">{formatCurrency(totalMonthlySpend)}/mo total</span>
          </div>
        </>
      )}
    </div>
  );
}
