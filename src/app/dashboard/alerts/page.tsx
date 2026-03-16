import { createClient } from '@/lib/supabase/server';
import { Bell, Clock, TrendingUp } from 'lucide-react';
import { cn, daysUntil, formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';

export default async function AlertsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*, subscription:subscriptions(name, amount)')
    .eq('user_id', user.id)
    .eq('dismissed', false)
    .order('scheduled_for', { ascending: false })
    .limit(50);

  const allAlerts = (alerts ?? []) as any[];

  const now = new Date();
  const weekFromNow = new Date(); weekFromNow.setDate(weekFromNow.getDate() + 7);
  const thisWeek = allAlerts.filter(a => { const d = new Date(a.scheduled_for); return d >= now && d <= weekFromNow; });
  const later = allAlerts.filter(a => new Date(a.scheduled_for) > weekFromNow);
  const past = allAlerts.filter(a => new Date(a.scheduled_for) < now);

  const iconMap: Record<string, typeof Bell> = { renewal: Bell, trial_ending: Clock, price_change: TrendingUp };
  const colorMap: Record<string, string> = {
    renewal: 'text-primary bg-primary/10',
    trial_ending: 'text-amber-500 bg-amber-500/10',
    price_change: 'text-emerald-500 bg-emerald-500/10',
  };

  function AlertCard({ alert }: { alert: any }) {
    const Icon = iconMap[alert.type] ?? Bell;
    const colorClass = colorMap[alert.type] ?? 'text-primary bg-primary/10';
    const days = daysUntil(alert.scheduled_for);
    return (
      <div className="flex items-start gap-4 rounded-2xl border bg-card p-4">
        <div className={cn('p-2.5 rounded-xl shrink-0', colorClass)}><Icon className="h-4 w-4" /></div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{alert.title}</p>
          {alert.message && <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {days === 0 ? 'Today' : days > 0 ? `in ${days} day${days !== 1 ? 's' : ''}` : formatDate(alert.scheduled_for)}
          </p>
        </div>
        {!alert.read_at && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
      </div>
    );
  }

  function Section({ title, items }: { title: string; items: any[] }) {
    if (!items.length) return null;
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
      {allAlerts.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts yet" description="Alerts will appear here when subscriptions are about to renew." />
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
