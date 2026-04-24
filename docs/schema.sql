-- Run this in your Supabase SQL editor or against your local Postgres instance

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clips (uploaded video/audio files)
create table if not exists clips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,
  original_name text not null,
  storage_path text not null,
  size_bytes bigint,
  duration_seconds float,
  created_at timestamptz default now()
);

-- Processing & export jobs
create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade,
  type text not null,           -- silence-trim | subtitles | sync | tracking | export-xml | export-video
  status text not null default 'queued',   -- queued | processing | done | failed
  progress int default 0,
  payload jsonb,
  output_path text,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscriptions
create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free',    -- free | pro
  minutes_used float not null default 0,
  minutes_limit float not null default 30,
  lemonsqueezy_subscription_id text,
  lemonsqueezy_customer_id text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create a free subscription row when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.subscriptions (user_id, tier, minutes_used, minutes_limit)
  values (new.id, 'free', 0, 30);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security
alter table projects enable row level security;
alter table clips enable row level security;
alter table jobs enable row level security;
alter table subscriptions enable row level security;

create policy "Users own their projects" on projects for all using (auth.uid() = user_id);
create policy "Users own their clips" on clips for all using (auth.uid() = user_id);
create policy "Users own their jobs" on jobs for all using (auth.uid() = user_id);
create policy "Users own their subscription" on subscriptions for all using (auth.uid() = user_id);

-- Storage buckets (run in Supabase dashboard or via CLI)
-- insert into storage.buckets (id, name, public) values ('raw-uploads', 'raw-uploads', false);
-- insert into storage.buckets (id, name, public) values ('exports', 'exports', false);
