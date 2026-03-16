import Anthropic from '@anthropic-ai/sdk';
import type { Subscription, AiAnalysis, UserContext } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeSubscription(
  subscription: Subscription,
  context: UserContext
): Promise<Partial<AiAnalysis>> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a financial advisor AI. Analyze this subscription and provide a recommendation.

SUBSCRIPTION:
- Service: ${subscription.merchant_name}
- Category: ${subscription.category ?? 'unknown'}
- Monthly cost: $${subscription.amount_avg}
- Billing cycle: ${subscription.billing_cycle}
- Active since: ${subscription.first_seen_date ?? 'unknown'}
- Last charge: $${subscription.amount_last ?? subscription.amount_avg}

USER CONTEXT:
- Total monthly subscription spend: $${context.totalMonthlySpend}
- Number of subscriptions: ${context.subscriptionCount}
- Other subscriptions in same category: ${context.sameCategorySubs.join(', ') || 'none'}

Respond in ONLY valid JSON (no markdown, no backticks):
{
  "value_score": <0-100>,
  "waste_risk": <0-100>,
  "recommendation": "keep" | "cancel" | "downgrade",
  "reasoning": "<2-3 sentences>",
  "potential_annual_savings": <number>,
  "next_action": "<one specific action>"
}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  try {
    return JSON.parse(text);
  } catch {
    console.error('Failed to parse AI response:', text);
    return {
      value_score: 50,
      waste_risk: 50,
      recommendation: 'keep',
      reasoning: 'Unable to analyze at this time.',
      potential_annual_savings: 0,
    };
  }
}

export async function generateScripts(
  subscription: Subscription,
  analysis: Partial<AiAnalysis>
): Promise<Partial<AiAnalysis>> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Generate cancellation and negotiation content for this subscription.

SERVICE: ${subscription.merchant_name}
MONTHLY COST: $${subscription.amount_avg}
CATEGORY: ${subscription.category ?? 'unknown'}
RECOMMENDATION: ${analysis.recommendation ?? 'cancel'}
REASONING: ${analysis.reasoning ?? ''}

Respond in ONLY valid JSON (no markdown, no backticks):
{
  "cancellation_email": "<polite, firm cancellation email, 4-6 sentences>",
  "negotiation_email": "<discount/downgrade request referencing loyalty and competitors, 4-6 sentences>",
  "phone_script": "<brief phone script with opening, key points, closing>",
  "chat_script": "<concise live chat message, 2-3 sentences>"
}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  try {
    return JSON.parse(text);
  } catch {
    console.error('Failed to parse AI scripts response:', text);
    return {};
  }
}
