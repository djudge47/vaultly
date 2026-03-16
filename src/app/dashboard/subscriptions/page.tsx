import { createClient } from '@/lib/supabase/server';
import { SubscriptionCard } from '@/components/subscriptions/subscription-card';
import { EmptyState } from '@/components/shared/empty-state';
import { CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SubscriptionWithAnalysis } from '@/types';

const FILTERS = ['all', 'keep', 'downgrade', 'cancel'] as const;
type Filter = typeof FILTERS[number];

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; sort?: string }>;
}) {
  const { filter = 'all', sort = 'amount' } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawSubs } = await (supabase as any)
    .from('subscriptions')
    .select('*, ai_analysis:ai_analyses(*)')
    .eq('user_id', user.id)
    .eq('is_active', true);

  const subs: SubscriptionWithAnalysis[] = ((rawSubs ?? []) as any[]).map((s: any) => ({
    ...s,
    ai_analysis: Array.isArray(s.ai_analysis) ? s.ai_analysis[0] ?? null : s.ai_analysis,
  })) as unknown as SubscriptionWithAnalysis[];

  const counts = {
    all: subs.length,
    keep: subs.filter(s => s.ai_analysis?.recommendation === 'keep').length,
    downgrade: subs.filter(s => s.ai_analysis?.recommendation === 'downgrade').length,
    cancel: subs.filter(s => s.ai_analysis?.recommendation === 'cancel').length,
  };

  // Filter
  let filtered = filter === 'all'
    ? subs
    : subs.filter(s => s.ai_analysis?.recommendation === filter);

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'waste') return Number(b.ai_analysis?.waste_risk ?? 0) - Number(a.ai_analysis?.waste_risk ?? 0);
    if (sort === 'name') return a.merchant_name.localeCompare(b.merchant_name);
    return Number(b.amount_avg) - Number(a.amount_avg); // default: cost high-low
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-1">{subs.length} active</p>
        </div>
      </div>

      {subs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            Connect your bank account to automatically detect your recurring subscriptions.
          </p>
          <Link href="/onboarding">
            <Button>Connect Bank</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
            {FILTERS.map(f => (
              <Link
                key={f}
                href={`/dashboard/subscriptions?filter=${f}&sort=${sort}`}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
                  filter === f
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f}
                <span className="ml-1.5 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                  {counts[f as Filter]}
                </span>
              </Link>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">Sort:</span>
            {[
              { value: 'amount', label: 'Cost' },
              { value: 'waste', label: 'Waste Risk' },
              { value: 'name', label: 'Name' },
            ].map(s => (
              <Link
                key={s.value}
                href={`/dashboard/subscriptions?filter=${filter}&sort=${s.value}`}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-lg border transition-colors',
                  sort === s.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {s.label}
              </Link>
            ))}
          </div>

          {/* List */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                No subscriptions in this category
              </p>
            ) : (
              filtered.map(sub => <SubscriptionCard key={sub.id} subscription={sub} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
