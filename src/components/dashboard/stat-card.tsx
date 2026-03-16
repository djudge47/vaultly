import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

// Stat Card
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'rose' | 'emerald' | 'amber';
}

const variantStyles = {
  default: { card: '', icon: 'bg-primary/10 text-primary', value: 'text-foreground' },
  rose: { card: '', icon: 'bg-rose-500/10 text-rose-500', value: 'text-rose-500' },
  emerald: { card: '', icon: 'bg-emerald-500/10 text-emerald-500', value: 'text-emerald-500' },
  amber: { card: '', icon: 'bg-amber-500/10 text-amber-500', value: 'text-amber-500' },
};

export function StatCard({ title, value, subtitle, icon: Icon, variant = 'default' }: StatCardProps) {
  const styles = variantStyles[variant];
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className={cn('text-2xl font-bold font-mono tabular-nums', styles.value)}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl', styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

// Recommendation Badge
interface RecommendationBadgeProps {
  recommendation: 'keep' | 'cancel' | 'downgrade' | string;
  size?: 'sm' | 'md';
}

const recStyles: Record<string, string> = {
  keep: 'bg-emerald-500/10 text-emerald-500',
  downgrade: 'bg-amber-500/10 text-amber-500',
  cancel: 'bg-rose-500/10 text-rose-500',
};

export function RecommendationBadge({ recommendation, size = 'md' }: RecommendationBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium capitalize',
        recStyles[recommendation] ?? 'bg-muted text-muted-foreground',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
      )}
    >
      {recommendation}
    </span>
  );
}

// Score Ring (small inline version for subscription cards)
interface ScoreRingProps {
  score: number;
  color?: string;
  label?: string;
}

export function ScoreRing({ score, color = '#6366F1', label }: ScoreRingProps) {
  const size = 48;
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-bold tabular-nums" style={{ color }}>{score}</span>
      </div>
      {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
    </div>
  );
}
