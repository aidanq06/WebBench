// seed-runs.mjs — COMPLETE restart of the public.runs data.
//
// This wipes every existing run, then repopulates the table from scratch with a
// large, realistic, anonymous community dataset across all 9 models.
//
//   node --env-file=.env.local scripts/seed-runs.mjs
//
// Requires the SERVICE-ROLE key (not the anon key) so it can actually delete
// rows — the public RLS policies only allow select/insert, so the anon key can
// never wipe. Add this line to .env.local (grab it from the Supabase dashboard →
// Settings → API → "service_role" secret):
//
//   SUPABASE_SERVICE_ROLE_KEY=eyJ...
//
// The service-role key bypasses RLS. Keep it out of the browser / git.

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error(
    "\nMissing env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
      "The service-role key is required to wipe rows (anon can't delete). Find it in\n" +
      "Supabase → Settings → API → service_role secret, then add:\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=eyJ...\n",
  );
  process.exit(1);
}

const supabase = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

// ── Model targets: per-model run count (intentionally uneven) + accuracy band ──
// accuracy ≈ what each quantized model realistically scores on MMLU-style MCQs.
const MODELS = [
  { id: "Qwen3-0.6B-q4f16_1-MLC",                   name: "qwen3 0.6b",     accuracy: 0.37, tpsMin: 80, tpsMax: 130, runCount: 72 },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",         name: "llama 3.2 1b",   accuracy: 0.44, tpsMin: 55, tpsMax: 95,  runCount: 61 },
  { id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",         name: "smollm2 1.7b",   accuracy: 0.42, tpsMin: 48, tpsMax: 72,  runCount: 44 },
  { id: "gemma-2-2b-it-q4f16_1-MLC",                 name: "gemma 2 2b",     accuracy: 0.52, tpsMin: 42, tpsMax: 64,  runCount: 23 },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",         name: "llama 3.2 3b",   accuracy: 0.58, tpsMin: 34, tpsMax: 52,  runCount: 49 },
  { id: "Phi-3.5-mini-instruct-q4f16_1-MLC",         name: "phi 3.5 mini",   accuracy: 0.64, tpsMin: 30, tpsMax: 46,  runCount: 37 },
  { id: "Qwen3-4B-q4f16_1-MLC",                      name: "qwen3 4b",       accuracy: 0.66, tpsMin: 26, tpsMax: 40,  runCount: 31 },
  { id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",      name: "mistral 7b",     accuracy: 0.63, tpsMin: 17, tpsMax: 28,  runCount: 40 },
  { id: "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC",  name: "deepseek r1 8b", accuracy: 0.70, tpsMin: 14, tpsMax: 22,  runCount: 28 },
];

const SUBJECTS = ["cs", "engineering", "math", "science"];

// Hardware profiles — round-robined across rows for realistic variety.
const HARDWARE_PROFILES = [
  { gpu_vendor: "apple",   gpu_device: "apple m3 pro",      device_class: "apple-silicon", browser: "chrome",  os: "macos",   webgpu_backend: "metal",  cpu_threads: 12 },
  { gpu_vendor: "apple",   gpu_device: "apple m2",          device_class: "apple-silicon", browser: "safari",  os: "macos",   webgpu_backend: "metal",  cpu_threads: 8 },
  { gpu_vendor: "apple",   gpu_device: "apple m1",          device_class: "apple-silicon", browser: "chrome",  os: "macos",   webgpu_backend: "metal",  cpu_threads: 8 },
  { gpu_vendor: "apple",   gpu_device: "apple m4 max",      device_class: "apple-silicon", browser: "chrome",  os: "macos",   webgpu_backend: "metal",  cpu_threads: 16 },
  { gpu_vendor: "nvidia",  gpu_device: "rtx 4070",          device_class: "nvidia",        browser: "chrome",  os: "windows", webgpu_backend: "dx12",   cpu_threads: 24 },
  { gpu_vendor: "nvidia",  gpu_device: "rtx 3060",          device_class: "nvidia",        browser: "firefox", os: "windows", webgpu_backend: "dx12",   cpu_threads: 16 },
  { gpu_vendor: "nvidia",  gpu_device: "rtx 4080",          device_class: "nvidia",        browser: "chrome",  os: "linux",   webgpu_backend: "vulkan", cpu_threads: 32 },
  { gpu_vendor: "nvidia",  gpu_device: "rtx 3070",          device_class: "nvidia",        browser: "chrome",  os: "windows", webgpu_backend: "dx12",   cpu_threads: 20 },
  { gpu_vendor: "amd",     gpu_device: "rx 7700 xt",        device_class: "amd",           browser: "chrome",  os: "linux",   webgpu_backend: "vulkan", cpu_threads: 16 },
  { gpu_vendor: "amd",     gpu_device: "radeon 780m",       device_class: "amd",           browser: "firefox", os: "windows", webgpu_backend: "dx12",   cpu_threads: 12 },
  { gpu_vendor: "intel",   gpu_device: "iris xe",           device_class: "intel",         browser: "chrome",  os: "windows", webgpu_backend: "dx12",   cpu_threads: 8 },
  { gpu_vendor: "intel",   gpu_device: "arc a770",          device_class: "intel",         browser: "chrome",  os: "linux",   webgpu_backend: "vulkan", cpu_threads: 16 },
];

const SUITE_SIZES = [3, 5, 10];

// ── Helpers ────────────────────────────────────────────────────────────────
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const RESPONSES_CORRECT = [
  (q, a) => `Let me reason through this. The question concerns ${q}. Working through the options, ${a} is the only one consistent with the standard definition.\n\nANSWER: ${a}`,
  (q, a) => `Looking at the choices carefully, three of them describe related but distinct concepts. Only option ${a} captures the precise meaning.\n\nANSWER: ${a}`,
  (q, a) => `This requires distinguishing between similar terms. After ruling out the alternatives one by one, ${a} is the correct choice.\n\nANSWER: ${a}`,
  (q, a) => `The key insight is that this question tests a specific property. Option ${a} satisfies it; the others fail in different ways.\n\nANSWER: ${a}`,
];

const RESPONSES_WRONG = [
  (q, a, w) => `My initial instinct is option ${w}. The reasoning here is that ${w} is associated with the concept in question.\n\nANSWER: ${w}`,
  (q, a, w) => `Comparing the options, ${w} stands out as the most likely fit based on the surface phrasing of the question.\n\nANSWER: ${w}`,
  (q, a, w) => `I think ${w} is correct because it covers the typical case described in the question.\n\nANSWER: ${w}`,
  (q, a, w) => `The answer should be ${w} — that's the textbook association for this term.\n\nANSWER: ${w}`,
];

const RESPONSES_NO_ANSWER = [
  () => `This is a tricky question. There are a few different ways to interpret it depending on which textbook you reference. I would need more context to commit confidently.`,
  () => `Let me think... actually, each of these has merit depending on the framing. The question is ambiguous as stated and I don't want to guess.`,
];

const EXTRACT_SOURCES = ["explicit", "explicit", "explicit", "explicit", "affirmation", "affirmation", "voting", "choice-text"];

function distributeCorrect(total, accuracy) {
  const noise = rand(-0.45, 0.45);
  return clamp(Math.round(total * accuracy + noise), 0, total);
}

function generateRun(model, completedAt, hardware) {
  const totalQuestions = pick(SUITE_SIZES);

  // Per-run accuracy jitter around the model baseline.
  const jitter = rand(-0.14, 0.14);
  const acc = clamp(model.accuracy + jitter, 0.05, 0.97);

  // Subject scores — each subject's accuracy drifts independently.
  const subjectScores = SUBJECTS.map((subject) => {
    const subAcc = clamp(acc + rand(-0.18, 0.18), 0, 1);
    const subTotal = Math.max(1, Math.floor(totalQuestions / 4));
    const correct = distributeCorrect(subTotal, subAcc);
    return { subject, correct, total: subTotal, accuracy: correct / subTotal };
  });

  // Build difficulty buckets to roughly match the question count.
  const easyTotal = Math.max(1, Math.floor(totalQuestions * 0.3));
  const hardTotal = Math.max(1, Math.floor(totalQuestions * 0.3));
  const mediumTotal = totalQuestions - easyTotal - hardTotal;
  const easyCorrect = distributeCorrect(easyTotal, clamp(acc * rand(1.1, 1.35), 0, 1));
  const mediumCorrect = distributeCorrect(mediumTotal, clamp(acc * rand(0.9, 1.1), 0, 1));
  const hardCorrect = distributeCorrect(hardTotal, clamp(acc * rand(0.55, 0.85), 0, 1));

  const correctCount = easyCorrect + mediumCorrect + hardCorrect;
  const overallAccuracy = correctCount / totalQuestions;
  const score = Math.round(overallAccuracy * 100);

  const difficultyScores = [
    { difficulty: "easy",   correct: easyCorrect,   total: easyTotal,   accuracy: easyCorrect / easyTotal },
    { difficulty: "medium", correct: mediumCorrect, total: mediumTotal, accuracy: mediumCorrect / mediumTotal },
    { difficulty: "hard",   correct: hardCorrect,   total: hardTotal,   accuracy: hardCorrect / hardTotal },
  ];

  // Synthetic per-question results matching the slim QuestionResult shape.
  const layout = [
    ...Array(easyTotal).fill("easy"),
    ...Array(mediumTotal).fill("medium"),
    ...Array(hardTotal).fill("hard"),
  ];
  const targets = { easy: easyCorrect, medium: mediumCorrect, hard: hardCorrect };
  const placed = { easy: 0, medium: 0, hard: 0 };

  const tps = parseFloat((rand(model.tpsMin, model.tpsMax)).toFixed(1));
  const questionResults = layout.map((difficulty, i) => {
    const subject = SUBJECTS[i % SUBJECTS.length];
    const isCorrect = placed[difficulty] < targets[difficulty];
    placed[difficulty]++;
    const letters = ["A", "B", "C", "D"];
    const expectedAnswer = pick(letters);
    const extractedAnswer = isCorrect
      ? expectedAnswer
      : pick(letters.filter((l) => l !== expectedAnswer));

    // Occasionally emit a "no answer" result on wrong cases for realism.
    const isNoAnswer = !isCorrect && Math.random() < 0.07;
    const finalLetter = isNoAnswer ? "" : extractedAnswer;
    const extractionSource = isNoAnswer ? "none" : pick(EXTRACT_SOURCES);

    let modelResponse;
    if (isNoAnswer) {
      modelResponse = pick(RESPONSES_NO_ANSWER)();
    } else if (isCorrect) {
      modelResponse = pick(RESPONSES_CORRECT)(`a ${subject} ${difficulty} item`, expectedAnswer);
    } else {
      modelResponse = pick(RESPONSES_WRONG)(`a ${subject} ${difficulty} item`, expectedAnswer, extractedAnswer);
    }

    // Time per question: derive from token rate + roughly the response length.
    const tokens = Math.max(40, Math.round(modelResponse.length / 4));
    const timeTakenMs = Math.round((tokens / tps) * 1000 + rand(200, 900));

    return {
      questionId: `seed-${model.name.replace(/\s+/g, "-")}-${randomUUID().slice(0, 8)}-q${i}`,
      subject,
      difficulty,
      correct: isCorrect && !isNoAnswer,
      modelResponse,
      extractedAnswer: finalLetter,
      extractionSource,
      expectedAnswer,
      timeTakenMs,
    };
  });

  const avgTimeMs = Math.round(
    questionResults.reduce((s, q) => s + q.timeTakenMs, 0) / questionResults.length,
  );

  return {
    id: randomUUID(),
    model_id: model.id,
    model_display_name: model.name,
    suite_id: String(totalQuestions),
    score,
    accuracy: overallAccuracy,
    correct_count: correctCount,
    total_questions: totalQuestions,
    avg_time_ms: avgTimeMs,
    tokens_per_second: tps,
    subject_scores: subjectScores,
    difficulty_scores: difficultyScores,
    question_results: questionResults,
    gpu_vendor: hardware.gpu_vendor,
    gpu_device: hardware.gpu_device,
    device_class: hardware.device_class,
    cpu_threads: hardware.cpu_threads,
    browser: hardware.browser,
    os: hardware.os,
    webgpu_backend: hardware.webgpu_backend,
    completed_at: completedAt,
  };
}

// ── 1. Wipe everything ──────────────────────────────────────────────────────
console.log("Wiping ALL existing rows from public.runs...");
const { error: wipeError, count: wiped } = await supabase
  .from("runs")
  .delete({ count: "exact" })
  .not("id", "is", null); // matches every row
if (wipeError) {
  console.error("Wipe failed:", wipeError.message);
  process.exit(1);
}
console.log(`Wiped ${wiped ?? 0} rows. Generating fresh data...\n`);

// ── 2. Repopulate ───────────────────────────────────────────────────────────
let total = 0;
let hwIdx = 0;
const now = Date.now();
const SPAN_DAYS = 75;

for (const model of MODELS) {
  const rows = [];
  for (let i = 0; i < model.runCount; i++) {
    const hardware = HARDWARE_PROFILES[hwIdx++ % HARDWARE_PROFILES.length];
    const daysAgo = rand(0, SPAN_DAYS);
    const completedAt = new Date(now - daysAgo * 86400000 - randInt(0, 3600000)).toISOString();
    rows.push(generateRun(model, completedAt, hardware));
  }
  const { error } = await supabase.from("runs").insert(rows);
  if (error) {
    console.error(`${model.name}: FAILED — ${error.message}`);
    continue;
  }
  const scores = rows.map((r) => r.score).sort((a, b) => a - b);
  const median = scores[scores.length >> 1];
  console.log(`${model.name.padEnd(20)} ${String(rows.length).padStart(3)} runs · median ${median}%`);
  total += rows.length;
}

console.log(`\nDone: ${total} rows inserted into public.runs.`);
