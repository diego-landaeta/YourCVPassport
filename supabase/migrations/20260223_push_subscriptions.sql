-- ─────────────────────────────────────────────────────────────
-- Push Subscriptions for Web Push Notifications
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text        NOT NULL,
  p256dh      text        NOT NULL,
  auth        text        NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,

  UNIQUE (user_id, endpoint)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
  ON public.push_subscriptions (user_id);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own subscriptions
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all (needed for Edge Function to send pushes)
CREATE POLICY "Service role can read all subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  TO service_role
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- NOTE: To send push notifications from the server, deploy the
-- Supabase Edge Function at supabase/functions/send-push/index.ts
-- and set these secrets:
--   supabase secrets set VAPID_PUBLIC_KEY=<your_key>
--   supabase secrets set VAPID_PRIVATE_KEY=<your_key>
--   supabase secrets set VAPID_SUBJECT=mailto:admin@yourcvpassport.com
--
-- Generate VAPID keys with: npx web-push generate-vapid-keys
-- Add public key to .env.local: VITE_VAPID_PUBLIC_KEY=<public_key>
-- ─────────────────────────────────────────────────────────────
