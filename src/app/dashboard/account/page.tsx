'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/inputs';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { CreditCard, Building2, Shield, LogOut, Trash2, Loader2 } from 'lucide-react';
import type { Profile, BillingStatus, PlaidItem } from '@/types';

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [plaidItems, setPlaidItems] = useState<PlaidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, billingRes, plaidRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('billing_status').select('*').eq('user_id', user.id).single(),
        supabase.from('plaid_items').select('*').eq('user_id', user.id).eq('status', 'active'),
      ]);

      setProfile(profileRes.data as Profile);
      setBilling(billingRes.data as BillingStatus);
      setPlaidItems((plaidRes.data ?? []) as PlaidItem[]);
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
    } catch {
      toast.error('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    toast.error('Account deletion is handled via the billing portal for safety.');
  }

  const statusColors: Record<string, string> = {
    trialing: 'bg-primary/10 text-primary',
    active: 'bg-emerald-500/10 text-emerald-500',
    canceled: 'bg-rose-500/10 text-rose-500',
    past_due: 'bg-amber-500/10 text-amber-500',
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl border bg-card p-6 space-y-3">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and billing</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Profile
        </h2>
        <div className="space-y-2 text-sm">
          {profile?.full_name && (
            <div><span className="text-muted-foreground">Name: </span><span className="font-medium">{profile.full_name}</span></div>
          )}
          <div><span className="text-muted-foreground">Email: </span><span className="font-medium">{profile?.email}</span></div>
        </div>
      </div>

      {/* Billing */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" /> Plan
        </h2>
        {billing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Vaultly Pro</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[billing.status] ?? 'bg-muted text-muted-foreground'}`}>
                {billing.status}
              </span>
            </div>
            {billing.trial_ends_at && billing.status === 'trialing' && (
              <p className="text-sm text-muted-foreground">
                Trial ends: <strong className="text-foreground">{formatDate(billing.trial_ends_at)}</strong>
              </p>
            )}
            {billing.current_period_end && billing.status === 'active' && (
              <p className="text-sm text-muted-foreground">
                Next billing: <strong className="text-foreground">{formatDate(billing.current_period_end)}</strong>
              </p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Manage Subscription
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No billing record found.</p>
        )}
      </div>

      {/* Connected Banks */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> Connected Banks
        </h2>
        {plaidItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No banks connected yet.</p>
        ) : (
          <div className="space-y-2">
            {plaidItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{item.institution_name ?? 'Unknown Bank'}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.status} · Synced {item.last_synced_at ? formatDate(item.last_synced_at) : 'never'}
                  </p>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">Connected</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security */}
      <div className="rounded-2xl border bg-card p-6 space-y-2">
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Security
        </h2>
        <p className="text-sm text-muted-foreground">
          Your bank credentials are never stored. Access tokens are encrypted with AES-256-GCM. All data is secured with row-level security.
        </p>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-rose-500/20 bg-card p-6 space-y-3">
        <h2 className="font-semibold text-rose-500">Danger Zone</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleDeleteAccount}>
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
