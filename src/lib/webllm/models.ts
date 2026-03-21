export interface ModelOption {
  id: string;
  displayName: string;
  parameterCount: string;
  estimatedSizeMB: number;
  minVramMB: number; // estimated minimum GPU memory needed (model + KV cache headroom)
}

export function modelLogo(modelId: string): string | null {
  const id = modelId.toLowerCase();
  if (id.includes("smollm"))                          return "/logos/huggingface.png";
  if (id.includes("deepseek"))                        return "/logos/deepseek.png";
  if (id.includes("gemma") || id.includes("google"))  return "/logos/google.png";
  if (id.includes("llama") || id.includes("meta"))    return "/logos/meta.png";
  if (id.includes("phi") || id.includes("microsoft")) return "/logos/microsoft.png";
  if (id.includes("mistral"))                         return "/logos/mistral.png";
  if (id.includes("qwen"))                            return "/logos/qwen.png";
  return null;
}


export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "Qwen3-0.6B-q4f16_1-MLC",
    displayName: "qwen3 0.6b",
    parameterCount: "0.6B",
    estimatedSizeMB: 400,
    minVramMB: 600,
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    displayName: "llama 3.2 1b",
    parameterCount: "1B",
    estimatedSizeMB: 720,
    minVramMB: 1050,
  },
  {
    id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    displayName: "smollm2 1.7b",
    parameterCount: "1.7B",
    estimatedSizeMB: 1100,
    minVramMB: 1550,
  },
  {
    id: "gemma-2-2b-it-q4f16_1-MLC",
    displayName: "gemma 2 2b",
    parameterCount: "2B",
    estimatedSizeMB: 1300,
    minVramMB: 1850,
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    displayName: "llama 3.2 3b",
    parameterCount: "3B",
    estimatedSizeMB: 1800,
    minVramMB: 2550,
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    displayName: "phi 3.5 mini",
    parameterCount: "3.8B",
    estimatedSizeMB: 2200,
    minVramMB: 3100,
  },
  {
    id: "Qwen3-4B-q4f16_1-MLC",
    displayName: "qwen3 4b",
    parameterCount: "4B",
    estimatedSizeMB: 2500,
    minVramMB: 3550,
  },
  {
    id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
    displayName: "mistral 7b",
    parameterCount: "7B",
    estimatedSizeMB: 4300,
    minVramMB: 6050,
  },
  {
    id: "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC",
    displayName: "deepseek r1 8b",
    parameterCount: "8B",
    estimatedSizeMB: 5000,
    minVramMB: 7000,
  },
];
