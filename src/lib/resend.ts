import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = new Resend(resendApiKey && resendApiKey !== 're_skip' ? resendApiKey : 're_placeholder_key');

const FROM = process.env.RESEND_FROM_EMAIL ?? 'alerts@vaultly.app';

async function safeSend(payload: Parameters<typeof resend.emails.send>[0]) {
  if (!resendApiKey || resendApiKey === 're_skip' || resendApiKey === 're_placeholder_key') {
    console.log('Resend not configured — skipping email:', payload.subject);
    return;
  }
  return resend.emails.send(payload);
}

export async function sendWelcomeEmail(to: string, name?: string) {
  return safeSend({
    from: FROM,
    to,
    subject: 'Welcome to Vaultly 🔐',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#6366F1">Welcome to Vaultly${name ? `, ${name}` : ''}!</h1>
      <p>Your 7-day free trial has started. Connect your bank account to discover your subscriptions.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/onboarding" style="display:inline-block;background:#6366F1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Get Started →</a>
    </div>`,
  });
}

export async function sendRenewalAlert(to: string, merchantName: string, amount: number, daysUntil: number, nextBillingDate: string) {
  return safeSend({
    from: FROM,
    to,
    subject: `⏰ ${merchantName} renews in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>${merchantName} Renewal Reminder</h2>
      <p><strong>${merchantName}</strong> will charge <strong>$${amount.toFixed(2)}</strong> on ${nextBillingDate}.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscriptions" style="display:inline-block;background:#6366F1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">View Subscription →</a>
    </div>`,
  });
}

export async function sendTrialEndingSoon(to: string, trialEndsAt: string) {
  return safeSend({
    from: FROM,
    to,
    subject: '⚠️ Your Vaultly trial ends in 2 days',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#F59E0B">Trial Ending Soon</h2>
      <p>Your Vaultly free trial ends on <strong>${trialEndsAt}</strong>.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account" style="display:inline-block;background:#6366F1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Manage Billing →</a>
    </div>`,
  });
}

export async function sendPaymentFailed(to: string) {
  return safeSend({
    from: FROM,
    to,
    subject: '❌ Payment failed — update your payment method',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#F43F5E">Payment Failed</h2>
      <p>We were unable to process your Vaultly subscription payment.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account" style="display:inline-block;background:#F43F5E;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Update Payment Method →</a>
    </div>`,
  });
}
