// ============================================================
// VAULTLY — APP-WIDE TYPE DEFINITIONS
// ============================================================

export type BillingStatus = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  alert_preferences: AlertPreferences;
  created_at: string;
  updated_at: string;
};

export type AlertPreferences = {
  renewal_7d: boolean;
  renewal_3d: boolean;
  renewal_1d: boolean;
  trial_48h: boolean;
  trial_24h: boolean;
  price_change: boolean;
  channel_email: boolean;
  channel_push: boolean;
};

export type PlaidItem = {
  id: string;
  user_id: string;
  plaid_item_id: string;
  plaid_access_token_encrypted: string;
  institution_id: string | null;
  institution_name: string | null;
  cursor: string | null;
  status: 'active' | 'error' | 'disconnected';
  error_code: string | null;
  last_synced_at: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  plaid_item_id: string | null;
  plaid_transaction_id: string | null;
  merchant_name: string | null;
  merchant_id: string | null;
  amount: number;
  currency: string;
  date: string;
  category: string[] | null;
  is_recurring: boolean;
  recurring_group_id: string | null;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  merchant_name: string;
  merchant_logo_url: string | null;
  normalized_merchant: string | null;
  category: string | null;
  amount_avg: number;
  amount_last: number | null;
  currency: string;
  billing_cycle: 'monthly' | 'weekly' | 'annual' | 'quarterly';
  next_billing_date: string | null;
  last_billing_date: string | null;
  first_seen_date: string | null;
  is_active: boolean;
  source: string;
  detection_confidence: number | null;
  created_at: string;
  updated_at: string;
};

export type AiAnalysis = {
  id: string;
  user_id: string;
  subscription_id: string;
  value_score: number | null;
  waste_risk: number | null;
  recommendation: 'keep' | 'cancel' | 'downgrade' | null;
  reasoning: string | null;
  potential_annual_savings: number | null;
  cancellation_email: string | null;
  negotiation_email: string | null;
  phone_script: string | null;
  chat_script: string | null;
  model_version: string | null;
  created_at: string;
};

export type SubscriptionWithAnalysis = Subscription & {
  ai_analysis?: AiAnalysis | null;
};

export type Alert = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  trial_event_id: string | null;
  alert_type: 'renewal_7d' | 'renewal_3d' | 'renewal_1d' | 'trial_48h' | 'trial_24h' | 'price_change';
  title: string;
  message: string | null;
  trigger_date: string;
  is_sent: boolean;
  sent_at: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type AlertWithSubscription = Alert & {
  subscription?: Subscription | null;
};

export type SavingsEvent = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  event_type: string;
  monthly_savings: number;
  annual_savings: number | null;
  notes: string | null;
  confirmed_at: string;
  created_at: string;
};

export type UserContext = {
  totalMonthlySpend: number;
  subscriptionCount: number;
  sameCategorySubs: string[];
};

export type LeakScoreData = {
  leakScore: number;
  totalMonthlySpend: number;
  monthlyWaste: number;
  potentialAnnualSavings: number;
  subscriptionCount: number;
  cancelCount: number;
  downgradeCount: number;
  keepCount: number;
};
