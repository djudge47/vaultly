'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/inputs';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { CreditCard, Building2, Shield, LogOut, Loader2 } from 'lucide-react';

export default function AccountPage() {
  const [profile, setProfile] = useState<any>(null);
  const [plaidItems, setPlaidItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [profileRes, plaidRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('plaid_items').select('*').eq('user_id', user.id).eq('status', 'active'),
      ]);
      setProfile(profileRes.data);
      setPlaidItems(plaidRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else toast.error('Could not open billing portal');
    } catch { toast.error('Failed to open billing portal'); }
    finally { setPortalLoading(false); }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const statusColors: Record<string, string> = {
    trialing: 'bg-primary/10 text-primary',
    active: 'bg-emerald-500/10 text-emerald-500',
    cancelled: 'bg-rose-500/10 text-rose-500',
    past_due: 'bg-amber-500/10 text-amber-500',
    inactive: 'bg-muted text-muted-foreground',
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {[1,2,3].map(i => <div key={i} className="rounded-2xl border bg-card p-6 space-y-3"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-4 w-full" /></div>)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and billing</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Profile</h2>
        <div className="space-y-2 text-sm">
          {profile?.full_name && <div><span className="text-muted-foreground">Name: </span><span className="font-medium">{profile.full_name}</span></div>}
          <div><span className="text-muted-foreground">Email: </span><span className="font-medium">{profile?.email}</span></div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Plan</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Vaultly Pro</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[profile?.subscription_status] ?? 'bg-muted text-muted-foreground'}`}>
              {profile?.subscription_status ?? 'inactive'}
            </span>
          </div>
          {profile?.trial_ends_at && profile?.subscription_status === 'trialing' && (
            <p className="text-sm text-muted-foreground">Trial ends: <strong className="text-foreground">{formatDate(profile.trial_ends_at)}</strong></p>
          )}
          {profile?.current_period_end && profile?.subscription_status === 'active' && (
            <p className="text-sm text-muted-foreground">Next billing: <strong className="text-foreground">{formatDate(profile.current_period_end)}</strong></p>
          )}
          <Button variant="outline" className="w-full" onClick={handleManageBilling} disabled={portalLoading}>
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Manage Subscription
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Connected Banks</h2>
        {plaidItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No banks connected yet.</p>
        ) : (
          <div className="space-y-2">
            {plaidItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{item.institution_name ?? 'Unknown Bank'}</p>
                  <p className="text-xs text-muted-foreground">Synced {item.last_synced_at ? formatDate(item.last_synced_at) : 'never'}</p>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">Connected</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-2">
        <h2 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Security</h2>
        <p className="text-sm text-muted-foreground">Your bank credentials are never stored. Access tokens are encrypted with AES-256-GCM.</p>
      </div>

      <div className="rounded-2xl border border-rose-500/20 bg-card p-6 space-y-3">
        <h2 className="font-semibold text-rose-500">Danger Zone</h2>
        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
