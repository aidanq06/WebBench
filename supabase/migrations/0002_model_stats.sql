-- WebBench: scale-safe per-model aggregation.
-- Aggregation lives in the database so the leaderboard reads ~9 summary rows
-- instead of pulling every run. Run this once in the Supabase SQL editor,
-- after 0001_runs.sql and after seeding.

-- security_invoker keeps the underlying "runs" RLS ("anon read") in force.
create or replace view public.model_stats with (security_invoker = true) as
with base as (
  select
    model_id,
    (array_agg(model_display_name order by completed_at desc))[1] as model_display_name,
    count(*)::int                                                  as run_count,
    round(avg(accuracy)::numeric, 4)                               as avg_accuracy,
    max(accuracy)                                                  as best_accuracy,
    percentile_cont(0.5) within group (order by tokens_per_second) as median_tok_per_sec,
    sum(total_questions)::int                                      as total_questions,
    max(completed_at)                                              as last_run_at
  from public.runs
  group by model_id
),
subj as (
  -- jsonb { subject: avgAccuracy } per model, unnesting each run's subject_scores
  select model_id, jsonb_object_agg(subject, acc) as subject_avgs
  from (
    select
      r.model_id,
      e->>'subject'                                  as subject,
      round(avg((e->>'accuracy')::numeric), 4)       as acc
    from public.runs r, jsonb_array_elements(r.subject_scores) e
    group by r.model_id, e->>'subject'
  ) s
  group by model_id
),
hw as (
  -- jsonb { device_class: count } per model
  select model_id, jsonb_object_agg(dc, n) as hardware_breakdown
  from (
    select model_id, coalesce(device_class, 'unknown') as dc, count(*)::int as n
    from public.runs
    group by model_id, coalesce(device_class, 'unknown')
  ) h
  group by model_id
)
select
  b.*,
  coalesce(subj.subject_avgs, '{}'::jsonb)      as subject_avgs,
  coalesce(hw.hardware_breakdown, '{}'::jsonb)  as hardware_breakdown
from base b
left join subj using (model_id)
left join hw   using (model_id);

grant select on public.model_stats to anon, authenticated;

-- Composite index so paginated per-model run fetches stay fast at any volume.
create index if not exists runs_model_completed_idx
  on public.runs (model_id, completed_at desc);
