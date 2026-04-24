-- Migration v2: Add Stripe subscription fields
-- Run this in your Supabase SQL editor AFTER schema.sql

-- Add Stripe fields and billing_cycle to subscriptions
alter table subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists billing_cycle text default 'monthly',   -- monthly | yearly
  add column if not exists subscription_status text,               -- active | past_due | cancelled | trialing
  add column if not exists subscription_end_date timestamptz;

-- Update tier check to allow basic
alter table subscriptions
  drop constraint if exists subscriptions_tier_check;

alter table subscriptions
  add constraint subscriptions_tier_check check (tier in ('free', 'basic', 'pro'));

-- Update the auto-create trigger to set minutes_limit from env
-- (minutes_limit stays at 30 for free tier, backend updates it on paid checkout)
