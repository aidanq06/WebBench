export interface ModelOption {
  id: string;
  displayName: string;
  parameterCount: string;
  estimatedSizeMB: number;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "Qwen3-0.6B-q4f16_1-MLC",
    displayName: "qwen 3 0.6b",
    parameterCount: "0.6B",
    estimatedSizeMB: 400,
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    displayName: "llama 3.2 1b",
    parameterCount: "1B",
    estimatedSizeMB: 720,
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    displayName: "qwen 2.5 1.5b",
    parameterCount: "1.5B",
    estimatedSizeMB: 950,
  },
  {
    id: "Qwen3-1.7B-q4f16_1-MLC",
    displayName: "qwen 3 1.7b",
    parameterCount: "1.7B",
    estimatedSizeMB: 1050,
  },
  {
    id: "gemma-2-2b-it-q4f16_1-MLC",
    displayName: "gemma 2 2b",
    parameterCount: "2B",
    estimatedSizeMB: 1300,
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    displayName: "llama 3.2 3b",
    parameterCount: "3B",
    estimatedSizeMB: 1800,
  },
  {
    id: "Qwen3-4B-q4f16_1-MLC",
    displayName: "qwen 3 4b",
    parameterCount: "4B",
    estimatedSizeMB: 2500,
  },
  {
    id: "Qwen2.5-7B-Instruct-q4f16_1-MLC",
    displayName: "qwen 2.5 7b",
    parameterCount: "7B",
    estimatedSizeMB: 4200,
  },
  {
    id: "Qwen3-8B-q4f16_1-MLC",
    displayName: "qwen 3 8b",
    parameterCount: "8B",
    estimatedSizeMB: 4900,
  },
];
