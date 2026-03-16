import Link from 'next/link';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import {
  Sparkles, ShieldCheck, Bell, FileText,
  Clock, TrendingUp, Lock, CheckCircle2, ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    { icon: Sparkles, title: 'AI Scoring', description: 'Every subscription gets a Value Score and Waste Risk score, powered by Claude.' },
    { icon: Bell, title: 'Smart Alerts', description: 'Get notified 7, 3, and 1 day before renewals so you\'re never surprised.' },
    { icon: FileText, title: 'Cancel Scripts', description: 'Copy-paste cancellation emails, negotiation scripts, phone scripts, and chat messages.' },
    { icon: Clock, title: 'Trial Radar', description: 'Never forget a free trial. We track when they convert to paid.' },
    { icon: TrendingUp, title: 'Savings Vault', description: 'Track every dollar saved when you cancel or downgrade a subscription.' },
    { icon: ShieldCheck, title: 'Bank-Level Security', description: 'AES-256 encryption. Your credentials are never stored. Powered by Plaid.' },
  ];

  const howItWorks = [
    { step: '01', title: 'Connect Your Bank', description: 'Securely link your bank via Plaid. Read-only access. We never store credentials.' },
    { step: '02', title: 'See Your Leak Score', description: 'AI analyzes every recurring charge and calculates your personal Leak Score.' },
    { step: '03', title: 'Take Action', description: 'Get Keep / Cancel / Downgrade recommendations with ready-to-use scripts.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/auth/sign-in"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/auth/sign-up"><Button size="sm">Start Free Trial</Button></Link>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI-Powered Subscription Intelligence
        </div>
        <h1 className="text-5xl sm:text-6xl font-black leading-tight tracking-tight">
          Stop Leaking Money on{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Forgotten Subscriptions
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Vaultly connects to your bank, finds every subscription, and uses AI to tell you exactly which ones to keep, cancel, or downgrade — with scripts ready to copy.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/sign-up"><Button size="lg" className="gap-2 px-8 text-base">Start Your Free Trial <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link href="/pricing"><Button variant="ghost" size="lg" className="text-muted-foreground">See pricing</Button></Link>
        </div>
        <p className="text-xs text-muted-foreground">7-day free trial · $9.99/mo after · Cancel anytime</p>
        <div className="max-w-sm mx-auto mt-4">
          <div className="rounded-2xl border bg-card p-6 text-center space-y-3 shadow-xl">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Example Leak Score</p>
            <div className="relative inline-flex items-center justify-center">
              <svg width="160" height="160" className="-rotate-90">
                <circle cx="80" cy="80" r="68" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                <circle cx="80" cy="80" r="68" fill="none" stroke="#F43F5E" strokeWidth="10" strokeDasharray="427 427" strokeDashoffset="128" strokeLinecap="round" />
              </svg>
              <div className="absolute text-center">
                <span className="text-5xl font-black text-rose-500">70</span>
                <p className="text-xs text-muted-foreground mt-0.5">Leak Score</p>
              </div>
            </div>
            <p className="text-lg font-bold text-rose-500">$247/mo potential savings</p>
            <p className="text-xs text-muted-foreground">Across 15 subscriptions found</p>
          </div>
        </div>
      </section>

      <section className="bg-card border-y border-border py-20">
        <div className="max-w-5xl mx-auto px-4 space-y-12">
          <div className="text-center"><h2 className="text-3xl font-bold">How It Works</h2><p className="text-muted-foreground mt-2">Three steps to stop the leak</p></div>
          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map(item => (
              <div key={item.step} className="rounded-2xl border bg-background p-6 space-y-3">
                <span className="text-4xl font-black text-primary/20">{item.step}</span>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 space-y-12">
          <div className="text-center"><h2 className="text-3xl font-bold">Everything you need</h2><p className="text-muted-foreground mt-2">Intelligence, not just a list</p></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border bg-card p-6 space-y-3 hover:border-primary/40 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card border-y border-border py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
            {[{ icon: Lock, label: 'Bank-level encryption' }, { icon: ShieldCheck, label: 'We never store your credentials' }, { icon: CheckCircle2, label: 'Powered by Plaid' }].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10"><Icon className="h-5 w-5 text-emerald-500" /></div>
                <span className="font-medium text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 text-center px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-black">Ready to plug the leaks?</h2>
          <p className="text-muted-foreground">Join thousands saving money every month with Vaultly.</p>
          <Link href="/auth/sign-up"><Button size="lg" className="px-10 text-base">Start Your Free Trial <ArrowRight className="h-4 w-4" /></Button></Link>
          <p className="text-xs text-muted-foreground">7-day free trial · No credit card required upfront</p>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo size="sm" />
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/auth/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
          <p>© {new Date().getFullYear()} Vaultly</p>
        </div>
      </footer>
    </div>
  );
}
