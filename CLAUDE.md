# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Next.js, localhost:3000)
npm run build    # production build
npm run lint     # ESLint (flat config, eslint.config.mjs)
```

There are no tests — all verification is done manually in-browser.

## What this is

WebBench runs LLM inference entirely in the browser via WebGPU using the `@mlc-ai/web-llm` library. It benchmarks small language models (0.6B–8B params) on MMLU-style multiple-choice questions, computes accuracy with a 95% Wilson confidence interval, and shows a shareable report including the full raw output of every question. No server-side inference happens; the Next.js server only stores results to Supabase and serves OG images.

## Architecture

### Inference pipeline
- `src/lib/webllm/engine-client.ts` — singleton WebLLM engine running in a Web Worker (`worker.ts`). Exports `loadModel`, `generateStream`, `generateCompletion`, `unloadModel`. The streaming path drains the full stream even after the ANSWER line is found — breaking early leaves the worker mid-generation and hangs the next call.
- `src/lib/webllm/worker.ts` — worker entry point required by WebLLM.
- `src/lib/webllm/models.ts` — `AVAILABLE_MODELS` array, `ModelOption` interface, and `modelLogo()` helper.

### Benchmark execution
- `src/lib/benchmark/qa-runner.ts` — orchestrates a full run: picks questions, builds 5-shot prompts, streams answers, extracts the answer letter, saves to sessionStorage and localStorage, calls `useBenchmarkStore.complete()`. Hands per-question pacing to the UI via the `setWaitingForAdvance`/`triggerAdvance` handshake.
- `src/lib/benchmark/questions.ts` — the question bank (MMLU-style; subjects: cs/engineering/math/science; difficulties: easy/medium/hard).
- `src/lib/benchmark/few-shot-examples.ts` — 5 solved examples per subject prepended to every prompt; each ends with `ANSWER: X`.
- `src/lib/benchmark/answer-extractor.ts` — `extractAnswer()` walks five tiers (explicit format → phrased commitment → quoted choice → weighted letter vote → none) and returns the chosen letter plus its `ExtractSource`.
- `src/lib/benchmark/scorer.ts` — `generateReport()` builds `BenchmarkReport` from `QuestionResult[]`; `wilsonInterval()` computes the 95% Wilson CI. Accuracy and CI only — no behavior score, calibration, or archetype.
- `src/lib/benchmark/scoring-config.ts` — scoring constants (`SCORING.minCompletionRatio = 0.5`, `SCORING.ciZ = 1.96`).
- `src/lib/benchmark/published-baselines.ts` — static MMLU accuracy baselines from published papers (small models + 2024 frontier anchors); used on the report page to contextualize the model's score.
- `src/lib/benchmark/demo-runner.ts` — scripted run for `?demo=true` mode (no model loading). Mirrors the real runner's advance handshake; does not upload to the results page.

### State
- `src/store/benchmark-store.ts` — Zustand store. Single source of truth for the current run phase (`idle | loading-model | running | complete | error`), streaming text, and completed results. `advanceMode` (`auto | manual`) controls whether each question auto-advances after the reveal or waits for `triggerAdvance()`; `setWaitingForAdvance(true, resolver)` is how the runner yields pacing to `BenchmarkProgress`. `abort()` terminates the stream and skips scoring.

### Pages & routing
- `/` — landing (hero + how-it-works).
- `/benchmark` — two-stage idle flow (model select → configure), loading, running (via `BenchmarkProgress`), error. Accepts `?demo=true` to run a scripted demo.
- `/report/[runId]` — report page; loads `BenchmarkReport` from DB, then sessionStorage (`report-{runId}`), then localStorage runs as a fallback.
- `/results` — model leaderboard. Server component reads pre-aggregated per-model stats from the Postgres `model_stats` view via `getModelStats()`; per-model runs are fetched on demand (paginated, opt-in, non-clickable).
- `/methodology` — static explainer.
- `/questions` — static question preview.
- `/api/runs` — `POST` validates and saves a run to Supabase (rate-limited, in-memory); `GET` returns paginated runs for a model (`?model=&offset=&limit=`, returns `{ runs, hasMore }`).
- `/api/og/[runId]` — OG image generation via `@vercel/og`.

### Storage
- `src/lib/storage/local-runs.ts` — saves up to 20 runs to `localStorage` under key `webbench:runs`. Reports are also written to `sessionStorage` keyed `report-{runId}` for the immediate redirect after a run.
- `src/lib/supabase/queries.ts` — `getModelStats()` (reads `model_stats` view), `getRecentRunsForModel(modelId, limit, offset)` (range query, returns `{ runs, hasMore }`), `getRunById()`.
- Supabase migrations live in `supabase/migrations/` (`0002_model_stats.sql` defines the aggregation view). Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. `scripts/seed-runs.mjs` seeds dev data and needs `SUPABASE_SERVICE_ROLE_KEY` (service-role, never committed).

### UI
- Tailwind v4 with custom CSS variables in `globals.css`. `--fg-subtle` is a common dim foreground token.
- Framer Motion for page transitions and benchmark animations; shared variants in `src/lib/motion.ts`.
- UI primitives in `src/components/ui/` and layout helpers in `src/components/layout/`.
- Design language: serif headings, monospace labels, minimal chrome, lowercase everywhere.

## Key types

- `BenchmarkReport` (`src/types/report.ts`) — canonical output of a run: `score` (accuracy as integer 0–100), `confidenceInterval`, `subjectScores`, `difficultyScores`, `questionResults`, `hardware`, `tokensPerSecond`.
- `QuestionResult` (`src/types/task.ts`) — per-question result: `correct`, `modelResponse` (full unedited stream), `extractedAnswer`, `extractionSource`, `expectedAnswer`, `timeTakenMs`.
- `Question` / `Subject` / `Difficulty` (`src/types/agent.ts`).

## WebGPU / browser constraints

- WebLLM requires WebGPU. `CompatibilityGate` (`src/components/benchmark/CompatibilityGate.tsx`) blocks the benchmark UI if `navigator.gpu` is absent or on mobile.
- Hardware detection (`src/lib/hardware/detect.ts`) reads `navigator.gpu.requestAdapter()` for GPU vendor/device and `maxBufferSize` as a VRAM proxy, to warn if the selected model may exceed available VRAM. `navigator.gpu` is accessed via an inline cast (no `@webgpu/types` dependency).
- Models are cached by the browser after first download; subsequent runs of the same model load from cache.
