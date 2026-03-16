'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [bankConnected, setBankConnected] = useState(false);
  const [institutionName, setInstitutionName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [leakScore, setLeakScore] = useState<number | null>(null);
  const [demoMode] = useState(process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || true);

  async function handleConnectBank() {
    if (demoMode) {
      // Demo mode: skip Plaid, load seed data
      setBankConnected(true);
      setInstitutionName('Demo Bank');
      toast.success('Demo bank connected!');
      return;
    }

    // Real Plaid Link
    try {
      const res = await fetch('/api/plaid/create-link-token', { method: 'POST' });
      const { link_token } = await res.json();

      const { openPlaidLink } = await import('@/lib/plaid-link');
      await openPlaidLink(
        link_token,
        async (publicToken: string, metadata: unknown) => {
          const meta = metadata as { institution?: { name?: string; institution_id?: string } };
          const exchangeRes = await fetch('/api/plaid/exchange-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              public_token: publicToken,
              institution_id: meta?.institution?.institution_id,
              institution_name: meta?.institution?.name,
            }),
          });
          const data = await exchangeRes.json();
          setBankConnected(true);
          setInstitutionName(data.institution_name ?? 'Your Bank');
          toast.success('Bank connected!');
        }
      );
    } catch (err) {
      toast.error('Failed to connect bank');
    }
  }

  async function handleDemoData() {
    // In demo mode, trigger seed data load via sync + detect
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setBankConnected(true);
    setInstitutionName('Demo Bank (15 subscriptions loaded)');
    toast.success('Demo data loaded! 15 subscriptions ready.');
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setStep(3);

    try {
      // In real mode: sync → detect → analyze
      // In demo mode: just run AI analysis on seed data
      if (!demoMode) {
        await fetch('/api/plaid/sync', { method: 'POST' });
        await fetch('/api/subscriptions', { method: 'POST' });
      }

      const analyzeRes = await fetch('/api/ai/analyze', { method: 'POST' });
      await analyzeRes.json();

      // Generate alerts
      await fetch('/api/alerts', { method: 'POST' }).catch(() => {});

      // Get leak score
      const scoreRes = await fetch('/api/dashboard/leak-score');
      const scoreData = await scoreRes.json();
      setLeakScore(scoreData.leakScore ?? 0);

      // Mark onboarding complete
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
      }

      setAnalysisComplete(true);
    } catch (err) {
      toast.error('Analysis failed — you can retry from the dashboard');
      setAnalysisComplete(true);
    } finally {
      setAnalyzing(false);
    }
  }

  const steps = [
    { n: 1, label: 'Welcome' },
    { n: 2, label: 'Connect' },
    { n: 3, label: 'Analyze' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                step > s.n
                  ? 'bg-emerald-500 text-white'
                  : step === s.n
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              )}>
                {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:block',
                step === s.n ? 'text-foreground' : 'text-muted-foreground'
              )}>{s.label}</span>
              {i < steps.length - 1 && <div className={cn('h-px w-8 transition-colors', step > s.n ? 'bg-emerald-500' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="rounded-2xl border bg-card p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome to Vaultly!</h1>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                We&apos;ll connect to your bank, find every subscription you&apos;re paying for, and use AI to tell you exactly which ones to keep, cancel, or downgrade.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-left">
              {[
                'Your credentials are never stored',
                'Bank-level 256-bit encryption',
                'Powered by Plaid — trusted by millions',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button className="w-full" size="lg" onClick={() => setStep(2)}>
              Let&apos;s find your subscriptions <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Connect Bank */}
        {step === 2 && (
          <div className="rounded-2xl border bg-card p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className={cn(
                'p-4 rounded-2xl transition-colors',
                bankConnected ? 'bg-emerald-500/10' : 'bg-primary/10'
              )}>
                {bankConnected
                  ? <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  : <Building2 className="h-8 w-8 text-primary" />
                }
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {bankConnected ? 'Bank Connected! 🎉' : 'Connect Your Bank'}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {bankConnected
                  ? `${institutionName} — ready to scan your transactions`
                  : 'Securely connect via Plaid to detect recurring charges'}
              </p>
            </div>

            {!bankConnected ? (
              <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={handleConnectBank}>
                  <Building2 className="h-4 w-4" />
                  Connect Bank Account
                </Button>
                <Button variant="outline" className="w-full" onClick={handleDemoData}>
                  Use Demo Data (skip Plaid)
                </Button>
              </div>
            ) : (
              <Button className="w-full" size="lg" onClick={runAnalysis}>
                Analyze My Subscriptions <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Step 3: Analyzing */}
        {step === 3 && (
          <div className="rounded-2xl border bg-card p-8 text-center space-y-6">
            {!analysisComplete ? (
              <>
                {/* Skeleton ring */}
                <div className="flex justify-center">
                  <div className="relative h-32 w-32">
                    <svg className="h-32 w-32 -rotate-90 animate-spin" style={{ animationDuration: '3s' }}>
                      <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                      <circle
                        cx="64" cy="64" r="56" fill="none"
                        stroke="#6366F1" strokeWidth="8"
                        strokeDasharray="352 352"
                        strokeDashoffset="264"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Analyzing your subscriptions...</h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    AI is scoring each subscription. This takes about 30 seconds.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="p-4 rounded-2xl bg-emerald-500/10">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Analysis Complete!</h2>
                  {leakScore !== null && (
                    <p className="text-3xl font-black text-primary mt-2">{leakScore}</p>
                  )}
                  <p className="text-muted-foreground mt-2 text-sm">
                    Your Leak Score is ready. Let&apos;s see where your money is going.
                  </p>
                </div>
                <Button className="w-full" size="lg" onClick={() => router.push('/dashboard')}>
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
