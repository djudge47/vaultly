import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { RecommendationBadge, ScoreRing } from '@/components/dashboard/stat-card';
import { formatCurrency } from '@/lib/utils';
import type { SubscriptionWithAnalysis } from '@/types';

interface SubscriptionCardProps {
  subscription: SubscriptionWithAnalysis;
}

function MerchantIcon({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function SubscriptionCard({ subscription: sub }: SubscriptionCardProps) {
  const analysis = Array.isArray(sub.ai_analysis) ? sub.ai_analysis[0] : sub.ai_analysis;

  return (
    <Link href={`/dashboard/subscriptions/${sub.id}`}>
      <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer">
        <MerchantIcon name={sub.merchant_name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{sub.merchant_name}</span>
            {sub.category && (
              <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded-full">
                {sub.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-mono text-muted-foreground">
              {formatCurrency(Number(sub.amount_avg))}/mo
            </span>
            {analysis?.recommendation && (
              <RecommendationBadge recommendation={analysis.recommendation} size="sm" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {analysis?.value_score != null && (
            <ScoreRing score={analysis.value_score} color="#6366F1" label="Value" />
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}
