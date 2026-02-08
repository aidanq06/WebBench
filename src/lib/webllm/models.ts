export interface ModelOption {
  id: string;
  displayName: string;
  parameterCount: string;
  estimatedSizeMB: number;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    displayName: "qwen 2.5 0.5b",
    parameterCount: "0.5B",
    estimatedSizeMB: 380,
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    displayName: "llama 3.2 1b",
    parameterCount: "1B",
    estimatedSizeMB: 720,
  },
];
