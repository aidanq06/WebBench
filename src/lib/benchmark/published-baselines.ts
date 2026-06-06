// Published MMLU 5-shot accuracy scores from official papers / leaderboards.
// Used to contextualize WebBench results. Scores are approximate.
export interface Baseline {
  name: string;
  accuracy: number; // 0–1
  source: string;
}

export const PUBLISHED_BASELINES: Baseline[] = [
  // ── frontier anchors (current) ──
  { name: "Claude 3.5 Sonnet", accuracy: 0.887, source: "Anthropic 2024" },
  { name: "GPT-4o",            accuracy: 0.887, source: "OpenAI 2024"    },
  { name: "Llama 3.1 405B",    accuracy: 0.886, source: "Meta 2024"      },
  { name: "Claude 3 Opus",     accuracy: 0.868, source: "Anthropic 2024" },
  { name: "GPT-4",             accuracy: 0.864, source: "OpenAI 2023"    },
  { name: "Gemini 1.5 Pro",    accuracy: 0.859, source: "Google 2024"    },
  { name: "Llama 3.1 70B",     accuracy: 0.860, source: "Meta 2024"      },
  { name: "GPT-3.5 Turbo",     accuracy: 0.700, source: "OpenAI 2023"    },
  // ── small / browser-class references ──
  { name: "Phi-3.5 Mini",      accuracy: 0.690, source: "Microsoft 2024" },
  { name: "Llama 3.1 8B",      accuracy: 0.684, source: "Meta 2024"      },
  { name: "Llama 3.2 3B",      accuracy: 0.634, source: "Meta 2024"      },
  { name: "Mistral 7B",        accuracy: 0.625, source: "Mistral 2023"   },
  { name: "Gemma 2 2B",        accuracy: 0.513, source: "Google 2024"    },
  { name: "Llama 3.2 1B",      accuracy: 0.493, source: "Meta 2024"      },
];

// Returns up to 3 nearest baselines (1 above, 1 below, 1 closest overall)
export function getNearestBaselines(accuracy: number): Baseline[] {
  const sorted = [...PUBLISHED_BASELINES].sort((a, b) => a.accuracy - b.accuracy);
  const above = sorted.filter((b) => b.accuracy >= accuracy);
  const below = sorted.filter((b) => b.accuracy < accuracy).reverse();
  const result: Baseline[] = [];
  if (below[0]) result.push(below[0]);
  if (above[0]) result.push(above[0]);
  if (below[1] && result.length < 3) result.push(below[1]);
  if (above[1] && result.length < 3) result.push(above[1]);
  return result.sort((a, b) => a.accuracy - b.accuracy);
}
