-- ============================================================
-- VAULTLY — SUPABASE SCHEMA
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  alert_preferences JSONB DEFAULT '{
    "renewal_7d": true, "renewal_3d": true, "renewal_1d": true,
    "trial_48h": true, "trial_24h": true, "price_change": true,
    "channel_email": true, "channel_push": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. BILLING STATUS
CREATE TABLE IF NOT EXISTS public.billing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. PLAID ITEMS
CREATE TABLE IF NOT EXISTS public.plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plaid_item_id TEXT NOT NULL UNIQUE,
  plaid_access_token_encrypted TEXT NOT NULL,
  institution_id TEXT,
  institution_name TEXT,
  cursor TEXT,
  status TEXT DEFAULT 'active',
  error_code TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plaid_item_id UUID REFERENCES public.plaid_items(id) ON DELETE SET NULL,
  plaid_transaction_id TEXT UNIQUE,
  merchant_name TEXT,
  merchant_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  date DATE NOT NULL,
  category TEXT[],
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_group_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON public.transactions(user_id, merchant_name);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON public.transactions(user_id, is_recurring);

-- 5. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL,
  merchant_logo_url TEXT,
  normalized_merchant TEXT,
  category TEXT,
  amount_avg DECIMAL(10,2) NOT NULL,
  amount_last DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT DEFAULT 'monthly',
  next_billing_date DATE,
  last_billing_date DATE,
  first_seen_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'plaid',
  detection_confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id, is_active);

-- 6. AI ANALYSES
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  value_score INTEGER CHECK (value_score BETWEEN 0 AND 100),
  waste_risk INTEGER CHECK (waste_risk BETWEEN 0 AND 100),
  recommendation TEXT CHECK (recommendation IN ('keep', 'cancel', 'downgrade')),
  reasoning TEXT,
  potential_annual_savings DECIMAL(10,2),
  cancellation_email TEXT,
  negotiation_email TEXT,
  phone_script TEXT,
  chat_script TEXT,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_user ON public.ai_analyses(user_id);

-- 7. GMAIL CONNECTIONS (v1.1)
CREATE TABLE IF NOT EXISTS public.gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gmail_address TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  status TEXT DEFAULT 'active',
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 8. TRIAL EVENTS (v1.1)
CREATE TABLE IF NOT EXISTS public.trial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gmail_connection_id UUID REFERENCES public.gmail_connections(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  trial_start_date DATE,
  trial_end_date DATE,
  end_date_confirmed BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  source_email_subject TEXT,
  source_email_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ALERTS
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  trial_event_id UUID REFERENCES public.trial_events(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  trigger_date DATE NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_date ON public.alerts(user_id, trigger_date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_pending ON public.alerts(is_sent, trigger_date);

-- 10. SAVINGS EVENTS (v1.2)
CREATE TABLE IF NOT EXISTS public.savings_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  monthly_savings DECIMAL(10,2) NOT NULL,
  annual_savings DECIMAL(10,2),
  notes TEXT,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if re-running
DO $$ 
BEGIN
  -- profiles
  DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
  -- billing_status
  DROP POLICY IF EXISTS "Users read own billing" ON public.billing_status;
  -- plaid_items
  DROP POLICY IF EXISTS "Users read own plaid items" ON public.plaid_items;
  -- transactions
  DROP POLICY IF EXISTS "Users read own transactions" ON public.transactions;
  -- subscriptions
  DROP POLICY IF EXISTS "Users read own subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "Users update own subscriptions" ON public.subscriptions;
  -- ai_analyses
  DROP POLICY IF EXISTS "Users read own analyses" ON public.ai_analyses;
  -- gmail_connections
  DROP POLICY IF EXISTS "Users read own gmail" ON public.gmail_connections;
  -- trial_events
  DROP POLICY IF EXISTS "Users read own trials" ON public.trial_events;
  DROP POLICY IF EXISTS "Users update own trials" ON public.trial_events;
  -- alerts
  DROP POLICY IF EXISTS "Users read own alerts" ON public.alerts;
  DROP POLICY IF EXISTS "Users update own alerts" ON public.alerts;
  -- savings_events
  DROP POLICY IF EXISTS "Users read own savings" ON public.savings_events;
  -- audit_logs
  DROP POLICY IF EXISTS "Users read own audit logs" ON public.audit_logs;
END $$;

-- SELECT / UPDATE policies (users access only their own data)
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users read own billing" ON public.billing_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own plaid items" ON public.plaid_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users read own analyses" ON public.ai_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own gmail" ON public.gmail_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own trials" ON public.trial_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own trials" ON public.trial_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users read own alerts" ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own alerts" ON public.alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users read own savings" ON public.savings_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
