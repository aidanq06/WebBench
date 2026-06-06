# webbench

benchmarks small language models (0.6B–8B) on MMLU-style multiple-choice questions, entirely in the browser. the model is downloaded to your device and runs on your GPU through WebLLM and WebGPU — no server-side inference, no API keys.

you get an accuracy score with a 95% Wilson confidence interval, the full raw output for every question, and a shareable report. runs are anonymously added to a public results page.

## stack

next.js, react, tailwind, framer motion, zustand, @mlc-ai/web-llm, supabase.

questions from the [MMLU benchmark](https://github.com/hendrycks/test) (Hendrycks et al., 2021). in-browser inference via [WebLLM](https://github.com/mlc-ai/web-llm).
