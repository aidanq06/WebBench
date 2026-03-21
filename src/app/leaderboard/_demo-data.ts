/**
 * DEMO DATA — remove this file and set DEMO_MODE = false in page.tsx to use real DB data.
 */

import type { ModelAggregate, RecentRow } from "./leaderboard-client";

// score = Math.round(achieved / (total * 4) * 1000)
// achieved = easyCorrect*1 + medCorrect*2 + hardCorrect*4

function run(
  id: string,
  modelId: string,
  displayName: string,
  e: [number, number], // [correct, total] easy
  m: [number, number], // medium
  h: [number, number], // hard
  subjectAccs: [number, number, number, number], // cs, eng, math, science accuracy 0-1
  tps: number,
  hoursAgo: number,
): {
  id: string; modelId: string; displayName: string;
  correctCount: number; totalQuestions: number; accuracy: number; score: number;
  tps: number; subjectAccs: [number, number, number, number];
  easyC: number; easyT: number; medC: number; medT: number; hardC: number; hardT: number;
  completedAt: string;
} {
  const totalQ = e[1] + m[1] + h[1];
  const correct = e[0] + m[0] + h[0];
  const achieved = e[0] * 1 + m[0] * 2 + h[0] * 4;
  const score = Math.round((achieved / (totalQ * 4)) * 1000);
  const completedAt = new Date(Date.now() - hoursAgo * 3600_000).toISOString();
  return { id, modelId, displayName, correctCount: correct, totalQuestions: totalQ,
    accuracy: correct / totalQ, score, tps, subjectAccs,
    easyC: e[0], easyT: e[1], medC: m[0], medT: m[1], hardC: h[0], hardT: h[1], completedAt };
}

const RUNS = [
  // deepseek r1 8b
  run("demo-ds-1", "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC", "deepseek r1 8b", [4,5],[6,7],[7,8],[0.87,0.82,0.91,0.85], 22.4, 2),
  run("demo-ds-2", "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC", "deepseek r1 8b", [5,6],[6,7],[6,7],[0.80,0.86,0.88,0.83], 21.8, 8),
  run("demo-ds-3", "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC", "deepseek r1 8b", [6,6],[6,6],[8,8],[0.92,0.88,0.95,0.90], 23.1, 19),
  // mistral 7b
  run("demo-mis-1", "Mistral-7B-Instruct-v0.3-q4f16_1-MLC", "mistral 7b", [5,5],[6,8],[5,7],[0.78,0.71,0.80,0.76], 28.3, 3),
  run("demo-mis-2", "Mistral-7B-Instruct-v0.3-q4f16_1-MLC", "mistral 7b", [5,6],[6,7],[6,7],[0.75,0.74,0.82,0.79], 27.9, 12),
  run("demo-mis-3", "Mistral-7B-Instruct-v0.3-q4f16_1-MLC", "mistral 7b", [5,5],[7,7],[6,8],[0.81,0.76,0.78,0.74], 29.1, 27),
  // qwen3 4b
  run("demo-q4-1", "Qwen3-4B-q4f16_1-MLC", "qwen3 4b", [5,5],[5,7],[5,8],[0.72,0.68,0.76,0.70], 41.2, 1),
  run("demo-q4-2", "Qwen3-4B-q4f16_1-MLC", "qwen3 4b", [5,6],[6,8],[5,6],[0.68,0.70,0.74,0.72], 40.8, 6),
  run("demo-q4-3", "Qwen3-4B-q4f16_1-MLC", "qwen3 4b", [5,5],[5,7],[5,8],[0.74,0.66,0.78,0.68], 42.0, 16),
  // phi 3.5 mini
  run("demo-phi-1", "Phi-3.5-mini-instruct-q4f16_1-MLC", "phi 3.5 mini", [5,6],[5,7],[5,7],[0.70,0.65,0.72,0.68], 47.6, 4),
  run("demo-phi-2", "Phi-3.5-mini-instruct-q4f16_1-MLC", "phi 3.5 mini", [4,5],[6,8],[4,7],[0.64,0.68,0.70,0.66], 46.9, 14),
  run("demo-phi-3", "Phi-3.5-mini-instruct-q4f16_1-MLC", "phi 3.5 mini", [5,6],[5,7],[5,7],[0.70,0.65,0.72,0.68], 48.2, 30),
  // llama 3.2 3b
  run("demo-ll3-1", "Llama-3.2-3B-Instruct-q4f16_1-MLC", "llama 3.2 3b", [5,6],[5,7],[4,7],[0.62,0.58,0.64,0.60], 55.4, 5),
  run("demo-ll3-2", "Llama-3.2-3B-Instruct-q4f16_1-MLC", "llama 3.2 3b", [5,5],[5,8],[3,7],[0.55,0.60,0.62,0.58], 54.8, 20),
  run("demo-ll3-3", "Llama-3.2-3B-Instruct-q4f16_1-MLC", "llama 3.2 3b", [4,5],[5,7],[5,8],[0.65,0.60,0.66,0.62], 56.1, 42),
  // gemma 2 2b
  run("demo-gem-1", "gemma-2-2b-it-q4f16_1-MLC", "gemma 2 2b", [5,6],[4,7],[3,7],[0.52,0.55,0.58,0.50], 62.7, 7),
  run("demo-gem-2", "gemma-2-2b-it-q4f16_1-MLC", "gemma 2 2b", [5,5],[5,8],[3,7],[0.58,0.52,0.56,0.54], 61.9, 22),
  run("demo-gem-3", "gemma-2-2b-it-q4f16_1-MLC", "gemma 2 2b", [4,6],[4,7],[3,7],[0.50,0.54,0.56,0.52], 63.4, 48),
  // smollm2 1.7b
  run("demo-sm-1", "SmolLM2-1.7B-Instruct-q4f16_1-MLC", "smollm2 1.7b", [5,6],[3,7],[3,7],[0.46,0.44,0.50,0.48], 71.3, 9),
  run("demo-sm-2", "SmolLM2-1.7B-Instruct-q4f16_1-MLC", "smollm2 1.7b", [4,5],[4,8],[2,7],[0.42,0.46,0.48,0.44], 70.8, 28),
  run("demo-sm-3", "SmolLM2-1.7B-Instruct-q4f16_1-MLC", "smollm2 1.7b", [5,6],[4,7],[3,7],[0.48,0.44,0.50,0.46], 72.0, 55),
  // qwen3 0.6b
  run("demo-q06-1", "Qwen3-0.6B-q4f16_1-MLC", "qwen3 0.6b", [5,6],[3,7],[2,7],[0.38,0.40,0.42,0.36], 98.4, 10),
  run("demo-q06-2", "Qwen3-0.6B-q4f16_1-MLC", "qwen3 0.6b", [4,5],[3,8],[2,7],[0.36,0.38,0.40,0.38], 97.6, 32),
  run("demo-q06-3", "Qwen3-0.6B-q4f16_1-MLC", "qwen3 0.6b", [5,6],[3,7],[2,7],[0.40,0.38,0.42,0.36], 99.1, 60),
  // llama 3.2 1b
  run("demo-ll1-1", "Llama-3.2-1B-Instruct-q4f16_1-MLC", "llama 3.2 1b", [4,6],[3,7],[2,7],[0.34,0.36,0.38,0.32], 84.2, 11),
  run("demo-ll1-2", "Llama-3.2-1B-Instruct-q4f16_1-MLC", "llama 3.2 1b", [4,5],[3,8],[1,7],[0.30,0.34,0.36,0.32], 83.7, 36),
  run("demo-ll1-3", "Llama-3.2-1B-Instruct-q4f16_1-MLC", "llama 3.2 1b", [5,6],[3,7],[2,7],[0.36,0.36,0.40,0.34], 85.0, 62),
];

function toModelAggregate(): ModelAggregate[] {
  const byModel = new Map<string, typeof RUNS>();
  for (const r of RUNS) {
    if (!byModel.has(r.modelId)) byModel.set(r.modelId, []);
    byModel.get(r.modelId)!.push(r);
  }

  const result: ModelAggregate[] = [];

  for (const [modelId, rs] of byModel) {
    const runCount = rs.length;
    const avgAccuracy = rs.reduce((s, r) => s + r.accuracy, 0) / runCount;
    const avgScore = Math.round(rs.reduce((s, r) => s + r.score, 0) / runCount);

    const [sa] = [rs.reduce((acc, r) => {
      acc.cs += r.subjectAccs[0]; acc.eng += r.subjectAccs[1];
      acc.math += r.subjectAccs[2]; acc.science += r.subjectAccs[3];
      return acc;
    }, { cs: 0, eng: 0, math: 0, science: 0 })];

    const subjectAvgs = {
      cs: sa.cs / runCount,
      engineering: sa.eng / runCount,
      math: sa.math / runCount,
      science: sa.science / runCount,
    };

    const diffAvg = rs.reduce((acc, r) => {
      acc.easyC += r.easyC; acc.easyT += r.easyT;
      acc.medC += r.medC; acc.medT += r.medT;
      acc.hardC += r.hardC; acc.hardT += r.hardT;
      return acc;
    }, { easyC: 0, easyT: 0, medC: 0, medT: 0, hardC: 0, hardT: 0 });

    const difficultyAvgs = {
      easy: diffAvg.easyC / diffAvg.easyT,
      medium: diffAvg.medC / diffAvg.medT,
      hard: diffAvg.hardC / diffAvg.hardT,
    };

    const recentRuns = rs
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .map((r) => ({
        id: r.id,
        score: r.score,
        correct_count: r.correctCount,
        total_questions: r.totalQuestions,
        tokens_per_second: r.tps,
        completed_at: r.completedAt,
        profiles: null,
      }));

    // look up param count from models list (done in page.tsx, so pass empty here — it gets overridden)
    result.push({
      modelId,
      displayName: rs[0].displayName,
      parameterCount: "",
      runCount,
      avgAccuracy,
      avgScore,
      subjectAvgs,
      difficultyAvgs,
      recentRuns,
    });
  }

  return result.sort((a, b) => b.avgScore - a.avgScore);
}

export const DEMO_MODELS: ModelAggregate[] = toModelAggregate();


export const DEMO_RECENT: RecentRow[] = RUNS
  .slice()
  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  .slice(0, 15)
  .map((r) => ({
    id: r.id,
    model_display_name: r.displayName,
    score: r.score,
    tokens_per_second: r.tps,
    device_class: "apple-silicon",
    completed_at: r.completedAt,
    profiles: null,
  }));
