-- ============================================================
-- VAULTLY — SEED DATA (DEMO MODE)
-- Run AFTER creating a test user via the Supabase Auth UI or signup flow.
-- Replace 'DEMO_USER_ID' with the actual auth.users UUID.
-- ============================================================

-- Demo subscriptions (15 realistic ones)
INSERT INTO public.subscriptions (id, user_id, merchant_name, normalized_merchant, category, amount_avg, amount_last, billing_cycle, next_billing_date, last_billing_date, first_seen_date, is_active, source, detection_confidence) VALUES
  (gen_random_uuid(), 'DEMO_USER_ID', 'Netflix', 'netflix', 'streaming', 22.99, 22.99, 'monthly', CURRENT_DATE + 12, CURRENT_DATE - 18, CURRENT_DATE - 730, true, 'plaid', 0.98),
  (gen_random_uuid(), 'DEMO_USER_ID', 'Spotify Premium', 'spotify', 'streaming', 10.99, 10.99, 'monthly', CURRENT_DATE + 5, CURRENT_DATE - 25, CURRENT_DATE - 540, true, 'plaid', 0.97),
  (gen_random_uuid(), 'DEMO_USER_ID', 'Apple Music', 'apple_music', 'streaming', 10.99, 10.99, 'monthly', CURRENT_DATE + 8, CURRENT_DATE - 22, CURRENT_DATE - 180, true, 'plaid', 0.95),
  (gen_random_uuid(), 'DEMO_USER_ID', 'Disney+', 'disney_plus', 'streaming', 13.99, 13.99, 'monthly', CURRENT_DATE + 15, CURRENT_DATE - 15, CURRENT_DATE - 365, true, 'plaid', 0.96),
  (gen_random_uuid(), 'DEMO_USER_ID', 'HBO Max', 'hbo_max', 'streaming', 15.99, 15.99, 'monthly', CURRENT_DATE + 3, CURRENT_DATE - 27, CURRENT_DATE - 200, true, 'plaid', 0.94),
  (gen_random_uuid(), 'DEMO_USER_ID', 'Adobe Creative Cloud', 'adobe_cc', 'saas', 54.99, 54.99, 'monthly', CURRENT_DATE + 20, CURRENT_DATE - 10, CURRENT_DATE - 900, true, 'plaid', 0.99),
  (gen_random_uuid(), 'DEMO_USER_ID', 'Notion', 'notion', 'saas', 10.00, 10.00, 'monthly', CURRENT_DATE + 7, CURRENT_DATE - 23, CURRENT_DATE - 365, true, 'plaid', 0.92),
  (gen_random_uuid(), 'DEMO_USER_ID', 'ChatGPT Plus', 'openai', 'saas', 20.00, 20.00, 'monthly', CURRENT_DATE + 11, CURRENT_DATE - 19, CURRENT_DATE - 300, true, 'plaid', 0.93),
  (gen_random_uuid(), 'DEMO_USER_ID', 'Peloton App', 'peloton', 'fitness', 12.99, 12.99, 'monthly', CURRENT_DATE + 2, CURRENT_DATE - 28, CURRENT_DATE - 450, true, 'plaid', 0.91),
  (gen_random_uuid(), 'DEMO_USER_ID', 'Planet Fitness', 'planet_fitness', 'fitness', 24.99, 24.99, 'monthly', CURRENT_DATE + 1, CURRENT_DATE - 29, CURRENT_DATE - 600, true, 'plaid', 0.88),
  (gen_random_uuid(), 'DEMO_USER_ID', 'HelloFresh', 'hellofresh', 'food', 59.94, 59.94, 'weekly', CURRENT_DATE + 2, CURRENT_DATE - 5, CURRENT_DATE - 120, true, 'plaid', 0.90),
  (gen_random_uuid(), 'DEMO_USER_ID', 'Dropbox Plus', 'dropbox', 'saas', 11.99, 11.99, 'monthly', CURRENT_DATE + 18, CURRENT_DATE - 12, CURRENT_DATE - 1095, true, 'plaid', 0.96),
  (gen_random_uuid(), 'DEMO_USER_ID', 'iCloud+ 200GB', 'icloud', 'saas', 2.99, 2.99, 'monthly', CURRENT_DATE + 9, CURRENT_DATE - 21, CURRENT_DATE - 730, true, 'plaid', 0.97),
  (gen_random_uuid(), 'DEMO_USER_ID', 'NordVPN', 'nordvpn', 'security', 12.99, 12.99, 'monthly', CURRENT_DATE + 14, CURRENT_DATE - 16, CURRENT_DATE - 60, true, 'plaid', 0.89),
  (gen_random_uuid(), 'DEMO_USER_ID', 'The New York Times', 'nytimes', 'news', 17.00, 17.00, 'monthly', CURRENT_DATE + 22, CURRENT_DATE - 8, CURRENT_DATE - 400, true, 'plaid', 0.94);

-- Note: After inserting subscriptions, visit /dashboard to trigger AI analysis
-- or run /api/ai/analyze to generate scores for all subscriptions.
