import Link from 'next/link';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

const features = [
  'AI subscription scoring (Keep / Cancel / Downgrade)',
  'Leak Score dashboard',
  'Smart renewal alerts (7, 3, 1 day)',
  'Cancel & negotiation scripts',
  'Phone & chat scripts',
  'Plaid bank connection',
  'Savings tracking vault',
  'Cancel anytime',
];

const faqs = [
  {
    q: 'Is my data safe?',
    a: 'Yes. We use AES-256-GCM encryption for all tokens. Your bank credentials are never stored — we use read-only Plaid access.',
  },
  {
    q: 'How does the trial work?',
    a: 'You get 7 days free. No charge until the trial ends. Cancel anytime before then and you pay nothing.',
  },
  {
    q: 'What banks are supported?',
    a: 'Over 12,000 US financial institutions via Plaid — including Chase, Bank of America, Wells Fargo, and most credit unions.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account page or the billing portal at any time. No questions asked.',
  },
  {
    q: 'How does AI scoring work?',
    a: 'Claude AI analyzes each subscription based on cost, category, usage signals, and overlaps with other subscriptions to give a Value Score and Waste Risk score.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-16 space-y-12">
        {/* Pricing Card */}
        <div className="rounded-2xl border-2 border-primary bg-card p-8 text-center space-y-6 shadow-xl shadow-primary/10">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider">One Plan. Everything Included.</p>
            <h1 className="text-4xl font-black mt-2">Vaultly Pro</h1>
          </div>
          <div>
            <span className="text-6xl font-black">$9.99</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="space-y-3 text-left">
            {features.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/auth/sign-up" className="block">
            <Button size="lg" className="w-full text-base">
              Start 7-Day Free Trial →
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">Cancel anytime · No credit card required upfront</p>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map(faq => (
              <div key={faq.q} className="rounded-2xl border bg-card p-5 space-y-2">
                <h3 className="font-semibold text-sm">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
