-- Step 1: Clean up existing demo data
DELETE FROM public.ai_analyses WHERE user_id = '0bfec8b4-1262-4c62-af4d-9ccfacea1491';
DELETE FROM public.subscriptions WHERE user_id = '0bfec8b4-1262-4c62-af4d-9ccfacea1491' AND source = 'demo';

-- Step 2: Insert billing status
INSERT INTO public.billing_status (user_id, stripe_customer_id, status, trial_ends_at, current_period_end)
VALUES ('0bfec8b4-1262-4c62-af4d-9ccfacea1491', 'demo_customer', 'trialing', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days')
ON CONFLICT (user_id) DO UPDATE SET status = 'trialing', trial_ends_at = NOW() + INTERVAL '7 days';

-- Step 3: Insert 15 demo subscriptions
INSERT INTO public.subscriptions (user_id, merchant_name, normalized_merchant, category, amount_avg, amount_last, billing_cycle, next_billing_date, last_billing_date, first_seen_date, is_active, source, detection_confidence)
VALUES
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','Netflix','netflix','streaming',22.99,22.99,'monthly',CURRENT_DATE+12,CURRENT_DATE-18,CURRENT_DATE-730,true,'demo',0.98),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','Spotify Premium','spotify','streaming',10.99,10.99,'monthly',CURRENT_DATE+5,CURRENT_DATE-25,CURRENT_DATE-540,true,'demo',0.97),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','Apple Music','apple_music','streaming',10.99,10.99,'monthly',CURRENT_DATE+8,CURRENT_DATE-22,CURRENT_DATE-180,true,'demo',0.95),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','Disney+','disney_plus','streaming',13.99,13.99,'monthly',CURRENT_DATE+15,CURRENT_DATE-15,CURRENT_DATE-365,true,'demo',0.96),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','HBO Max','hbo_max','streaming',15.99,15.99,'monthly',CURRENT_DATE+3,CURRENT_DATE-27,CURRENT_DATE-200,true,'demo',0.94),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','Adobe Creative Cloud','adobe_cc','saas',54.99,54.99,'monthly',CURRENT_DATE+20,CURRENT_DATE-10,CURRENT_DATE-900,true,'demo',0.99),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','Notion','notion','saas',10.00,10.00,'monthly',CURRENT_DATE+7,CURRENT_DATE-23,CURRENT_DATE-365,true,'demo',0.92),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','ChatGPT Plus','openai','ai',20.00,20.00,'monthly',CURRENT_DATE+11,CURRENT_DATE-19,CURRENT_DATE-300,true,'demo',0.93),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','Peloton App','peloton','fitness',12.99,12.99,'monthly',CURRENT_DATE+2,CURRENT_DATE-28,CURRENT_DATE-450,true,'demo',0.91),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','Planet Fitness','planet_fitness','fitness',24.99,24.99,'monthly',CURRENT_DATE+1,CURRENT_DATE-29,CURRENT_DATE-600,true,'demo',0.88),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','HelloFresh','hellofresh','food',59.94,59.94,'weekly',CURRENT_DATE+2,CURRENT_DATE-5,CURRENT_DATE-120,true,'demo',0.90),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','Dropbox Plus','dropbox','saas',11.99,11.99,'monthly',CURRENT_DATE+18,CURRENT_DATE-12,CURRENT_DATE-1095,true,'demo',0.96),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','iCloud+ 200GB','icloud','saas',2.99,2.99,'monthly',CURRENT_DATE+9,CURRENT_DATE-21,CURRENT_DATE-730,true,'demo',0.97),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','NordVPN','nordvpn','security',12.99,12.99,'monthly',CURRENT_DATE+14,CURRENT_DATE-16,CURRENT_DATE-60,true,'demo',0.89),
('0bfec8b4-1262-4c62-af4d-9ccfacea1491','The New York Times','nytimes','news',17.00,17.00,'monthly',CURRENT_DATE+22,CURRENT_DATE-8,CURRENT_DATE-400,true,'demo',0.94);

-- Step 4: Insert AI analyses
INSERT INTO public.ai_analyses (user_id, subscription_id, value_score, waste_risk, recommendation, reasoning, potential_annual_savings, model_version)
SELECT s.user_id, s.id,
  CASE s.normalized_merchant
    WHEN 'netflix' THEN 72 WHEN 'spotify' THEN 80 WHEN 'apple_music' THEN 35
    WHEN 'disney_plus' THEN 55 WHEN 'hbo_max' THEN 40 WHEN 'adobe_cc' THEN 85
    WHEN 'notion' THEN 70 WHEN 'openai' THEN 88 WHEN 'peloton' THEN 30
    WHEN 'planet_fitness' THEN 25 WHEN 'hellofresh' THEN 45 WHEN 'dropbox' THEN 38
    WHEN 'icloud' THEN 90 WHEN 'nordvpn' THEN 55 WHEN 'nytimes' THEN 42
  END,
  CASE s.normalized_merchant
    WHEN 'netflix' THEN 28 WHEN 'spotify' THEN 20 WHEN 'apple_music' THEN 75
    WHEN 'disney_plus' THEN 50 WHEN 'hbo_max' THEN 70 WHEN 'adobe_cc' THEN 15
    WHEN 'notion' THEN 30 WHEN 'openai' THEN 12 WHEN 'peloton' THEN 80
    WHEN 'planet_fitness' THEN 85 WHEN 'hellofresh' THEN 55 WHEN 'dropbox' THEN 72
    WHEN 'icloud' THEN 10 WHEN 'nordvpn' THEN 48 WHEN 'nytimes' THEN 65
  END,
  CASE s.normalized_merchant
    WHEN 'netflix' THEN 'keep' WHEN 'spotify' THEN 'keep' WHEN 'apple_music' THEN 'cancel'
    WHEN 'disney_plus' THEN 'downgrade' WHEN 'hbo_max' THEN 'cancel' WHEN 'adobe_cc' THEN 'keep'
    WHEN 'notion' THEN 'keep' WHEN 'openai' THEN 'keep' WHEN 'peloton' THEN 'cancel'
    WHEN 'planet_fitness' THEN 'cancel' WHEN 'hellofresh' THEN 'downgrade' WHEN 'dropbox' THEN 'cancel'
    WHEN 'icloud' THEN 'keep' WHEN 'nordvpn' THEN 'downgrade' WHEN 'nytimes' THEN 'cancel'
  END,
  CASE s.normalized_merchant
    WHEN 'netflix' THEN 'Netflix is your most-watched streaming service with strong value for the price.'
    WHEN 'spotify' THEN 'Spotify gets daily use as your primary music service - worth keeping.'
    WHEN 'apple_music' THEN 'You already pay for Spotify Premium. Apple Music is a redundant cost at $131/year.'
    WHEN 'disney_plus' THEN 'Disney+ has good content but the ad-supported tier would cut your cost in half.'
    WHEN 'hbo_max' THEN 'HBO Max overlaps heavily with Netflix. Consider rotating instead of keeping both.'
    WHEN 'adobe_cc' THEN 'Adobe Creative Cloud is a professional tool with high daily usage value.'
    WHEN 'notion' THEN 'Notion is actively used for productivity - reasonable cost for the value delivered.'
    WHEN 'openai' THEN 'ChatGPT Plus delivers exceptional value for AI-assisted work at $20/month.'
    WHEN 'peloton' THEN 'Peloton App shows low engagement. Free YouTube workouts cover the same content.'
    WHEN 'planet_fitness' THEN 'Gym membership shows very low usage. Cancel or pause to save $300/year.'
    WHEN 'hellofresh' THEN 'HelloFresh is expensive weekly. Downgrading to 2 meals saves $300/year.'
    WHEN 'dropbox' THEN 'iCloud already covers your storage needs. Dropbox Plus is fully redundant.'
    WHEN 'icloud' THEN 'iCloud at $2.99/month is exceptional value for Apple ecosystem storage.'
    WHEN 'nordvpn' THEN 'VPN is useful but switching to an annual plan saves 60% immediately.'
    WHEN 'nytimes' THEN 'Low readership detected. Cancel and use the 10 free articles per month instead.'
  END,
  CASE s.normalized_merchant
    WHEN 'apple_music' THEN 131.88 WHEN 'hbo_max' THEN 191.88
    WHEN 'peloton' THEN 155.88 WHEN 'planet_fitness' THEN 299.88
    WHEN 'dropbox' THEN 143.88 WHEN 'nytimes' THEN 204.00
    WHEN 'disney_plus' THEN 48.00 WHEN 'hellofresh' THEN 299.70
    WHEN 'nordvpn' THEN 77.94 ELSE 0
  END,
  'demo-data'
FROM public.subscriptions s
WHERE s.user_id = '0bfec8b4-1262-4c62-af4d-9ccfacea1491' AND s.source = 'demo';
