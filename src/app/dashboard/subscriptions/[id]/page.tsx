import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RecommendationBadge, ScoreRing } from '@/components/dashboard/stat-card';
import { ScriptPanel } from '@/components/subscriptions/script-panel';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';
import type { SubscriptionWithAnalysis } from '@/types';

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: raw } = await (supabase as any)
    .from('subscriptions')
    .select('*, ai_analysis:ai_analyses(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!raw) notFound();

  const sub = {
    ...(raw as any),
    ai_analysis: Array.isArray((raw as any).ai_analysis) ? (raw as any).ai_analysis[0] ?? null : (raw as any).ai_analysis,
  } as unknown as SubscriptionWithAnalysis;

  const analysis = sub.ai_analysis;
  const days = sub.next_billing_date ? daysUntil(sub.next_billing_date) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Back nav */}
      <Link
        href="/dashboard/subscriptions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to subscriptions
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
              {sub.merchant_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{sub.merchant_name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {sub.category && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    <span className="capitalize">{sub.category}</span>
                  </span>
                )}
                {analysis?.recommendation && (
                  <RecommendationBadge recommendation={analysis.recommendation} />
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-mono">{formatCurrency(Number(sub.amount_avg))}</span>
            <p className="text-xs text-muted-foreground capitalize">/{sub.billing_cycle}</p>
          </div>
        </div>

        {/* Billing info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-t border-border pt-4">
          <Calendar className="h-4 w-4" />
          {sub.next_billing_date ? (
            <span>
              Next charge: <strong className="text-foreground">{formatDate(sub.next_billing_date)}</strong>
              {days !== null && days >= 0 && (
                <span className={days <= 3 ? ' text-rose-500 font-medium' : ''}>
                  {' '}({days === 0 ? 'today' : `in ${days} day${days !== 1 ? 's' : ''}`})
                </span>
              )}
            </span>
          ) : (
            <span>No billing date on record</span>
          )}
        </div>
      </div>

      {/* AI Scores */}
      {analysis && (
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">AI Analysis</h2>
          <div className="flex items-center justify-around py-2">
            <div className="text-center space-y-2">
              <ScoreRing score={analysis.value_score ?? 0} color="#6366F1" />
              <p className="text-xs text-muted-foreground">Value Score</p>
            </div>
            <div className="text-center space-y-2">
              <ScoreRing score={analysis.waste_risk ?? 0} color="#F43F5E" />
              <p className="text-xs text-muted-foreground">Waste Risk</p>
            </div>
            {analysis.potential_annual_savings != null && Number(analysis.potential_annual_savings) > 0 && (
              <div className="text-center">
                <p className="text-xl font-bold font-mono text-emerald-500">
                  {formatCurrency(Number(analysis.potential_annual_savings))}
                </p>
                <p className="text-xs text-muted-foreground">Potential Annual Savings</p>
              </div>
            )}
          </div>
          {analysis.reasoning && (
            <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4 leading-relaxed">
              {analysis.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Script Panel */}
      <ScriptPanel
        subscriptionId={sub.id}
        analysis={analysis ?? null}
      />

      {/* Subscription history */}
      <div className="rounded-2xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'First seen', value: sub.first_seen_date ? formatDate(sub.first_seen_date) : '—' },
            { label: 'Last charged', value: sub.last_billing_date ? formatDate(sub.last_billing_date) : '—' },
            { label: 'Billing cycle', value: sub.billing_cycle },
            { label: 'Confidence', value: sub.detection_confidence ? `${Math.round(Number(sub.detection_confidence) * 100)}%` : '—' },
          ].map(row => (
            <div key={row.label}>
              <p className="text-xs text-muted-foreground mb-0.5">{row.label}</p>
              <p className="font-medium capitalize">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
