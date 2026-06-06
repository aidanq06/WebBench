-- WebBench: fresh schema for anonymous community runs.
-- Run this once in the Supabase SQL editor.

drop table if exists public.reports cascade;
drop table if exists public.runs cascade;

create table public.runs (
  id uuid primary key,
  model_id text not null,
  model_display_name text not null,
  suite_id text not null,
  score int not null check (score between 0 and 100),
  accuracy numeric not null,
  correct_count int not null,
  total_questions int not null,
  avg_time_ms int not null,
  tokens_per_second numeric not null,
  subject_scores jsonb not null,
  difficulty_scores jsonb not null,
  question_results jsonb not null,
  gpu_vendor text,
  gpu_device text,
  device_class text,
  cpu_threads int,
  browser text,
  os text,
  webgpu_backend text,
  completed_at timestamptz not null default now(),
  inserted_at timestamptz not null default now()
);

create index runs_model_id_idx on public.runs (model_id);
create index runs_completed_at_idx on public.runs (completed_at desc);
create index runs_score_idx on public.runs (score desc);

alter table public.runs enable row level security;

-- Fully anonymous. Anyone with the anon key can read or insert.
create policy "anon read" on public.runs for select using (true);
create policy "anon insert" on public.runs for insert with check (true);
