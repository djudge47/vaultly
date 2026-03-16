import { createClient } from '@/lib/supabase/server';
import { Bell, Clock, TrendingUp } from 'lucide-react';
import { cn, daysUntil, formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';
import type { AlertWithSubscription } from '@/types';

const alertIcons: Record<string, typeof Bell> = {
  renewal_7d: Bell,
  renewal_3d: Bell,
  renewal_1d: Bell,
  trial_48h: Clock,
  trial_24h: Clock,
  price_change: TrendingUp,
};

const alertColors: Record<string, string> = {
  renewal_7d: 'text-primary bg-primary/10',
  renewal_3d: 'text-amber-500 bg-amber-500/10',
  renewal_1d: 'text-rose-500 bg-rose-500/10',
  trial_48h: 'text-amber-500 bg-amber-500/10',
  trial_24h: 'text-rose-500 bg-rose-500/10',
  price_change: 'text-emerald-500 bg-emerald-500/10',
};

export default async function AlertsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rawAlerts } = await supabase
    .from('alerts')
    .select('*, subscription:subscriptions(merchant_name, amount_avg)')
    .eq('user_id', user.id)
    .order('trigger_date', { ascending: false })
    .limit(50);

  const alerts = (rawAlerts ?? []) as AlertWithSubscription[];

  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const thisWeek = alerts.filter(a => {
    const d = new Date(a.trigger_date);
    return d >= now && d <= weekFromNow;
  });
  const later = alerts.filter(a => new Date(a.trigger_date) > weekFromNow);
  const past = alerts.filter(a => new Date(a.trigger_date) < now);

  function AlertCard({ alert }: { alert: AlertWithSubscription }) {
    const Icon = alertIcons[alert.alert_type] ?? Bell;
    const colorClass = alertColors[alert.alert_type] ?? 'text-primary bg-primary/10';
    const days = daysUntil(alert.trigger_date);

    return (
      <div className={cn(
        'flex items-start gap-4 rounded-2xl border bg-card p-4 transition-opacity',
        alert.is_read && 'opacity-60'
      )}>
        <div className={cn('p-2.5 rounded-xl shrink-0', colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{alert.title}</p>
          {alert.message && (
            <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {days === 0 ? 'Today' : days > 0 ? `in ${days} day${days !== 1 ? 's' : ''}` : formatDate(alert.trigger_date)}
          </p>
        </div>
        {!alert.is_read && (
          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
        )}
      </div>
    );
  }

  function Section({ title, items }: { title: string; items: AlertWithSubscription[] }) {
    if (items.length === 0) return null;
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground px-1">{title}</h2>
        {items.map(a => <AlertCard key={a.id} alert={a} />)}
      </section>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-muted-foreground text-sm mt-1">Stay ahead of your renewals</p>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No alerts yet"
          description="Alerts will appear here when subscriptions are about to renew or trials are ending."
        />
      ) : (
        <div className="space-y-6">
          <Section title="This Week" items={thisWeek} />
          <Section title="Later" items={later} />
          <Section title="Past" items={past} />
        </div>
      )}
    </div>
  );
}
