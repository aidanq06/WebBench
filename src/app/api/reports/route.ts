import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BenchmarkReport } from "@/types/report";
import { SCORING } from "@/lib/benchmark/scoring-config";

// ── Rate limiter ───────────────────────────────────────────────────────────────
// Simple in-memory IP-based rate limit. Resets on deploy — acceptable for MVP.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const ipMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Input validation ───────────────────────────────────────────────────────────
function validateReport(r: unknown): r is BenchmarkReport {
  if (!r || typeof r !== "object") return false;
  const report = r as Record<string, unknown>;
  if (typeof report.runId !== "string" || report.runId.length > 128) return false;
  if (typeof report.modelId !== "string" || report.modelId.length > 256) return false;
  if (typeof report.totalQuestions !== "number" || report.totalQuestions < 1 || report.totalQuestions > 100) return false;
  if (typeof report.correctCount !== "number" || report.correctCount < 0) return false;
  if (typeof report.overallAccuracy !== "number") return false;
  if (!Array.isArray(report.questionResults) || report.questionResults.length > 50) return false;
  if (typeof report.score !== "number" || report.score < 0 || report.score > 1000) return false;
  return true;
}

// ── Handler ────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!validateReport(body)) {
    return NextResponse.json({ error: "invalid report" }, { status: 400 });
  }

  const report = body;

  // Reject runs that didn't meet the minimum completion threshold
  const intendedCount = parseInt(report.suiteId, 10);
  if (!isNaN(intendedCount) && report.totalQuestions < intendedCount * SCORING.minCompletionRatio) {
    return NextResponse.json({ error: "incomplete run" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .insert({
      id: report.runId,
      model_id: report.modelId,
      model_display_name: report.modelDisplayName,
      suite_id: report.suiteId,
      accuracy: report.overallAccuracy,
      correct_count: report.correctCount,
      total_questions: report.totalQuestions,
      avg_time_ms: report.avgTimeMs,
      tokens_per_second: report.tokensPerSecond,
      efficiency_score: report.efficiencyScore,
      score: report.score,
      gpu_vendor: report.hardware?.gpuVendor,
      gpu_device: report.hardware?.gpuDevice,
      device_class: report.hardware?.deviceClass,
      cpu_threads: report.hardware?.cpuThreads,
      browser: report.hardware?.browser,
      os: report.hardware?.os,
      webgpu_backend: report.hardware?.webgpuBackend,
      subject_scores: report.subjectScores,
      difficulty_scores: report.difficultyScores,
      question_results: report.questionResults,
      completed_at: report.completedAt,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "failed to save report" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
