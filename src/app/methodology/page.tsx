import { Navbar } from "@/components/landing/Navbar";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { SerifTitle } from "@/components/ui/SerifTitle";
import { PageStagger, PageStaggerItem } from "@/components/layout/PageStagger";

export const metadata = {
  title: "Methodology — WebBench",
  description: "How WebBench tests language models in your browser.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-[10px] uppercase tracking-widest text-[--fg-subtle]">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-4 border-b border-[--border] py-2.5 last:border-b-0">
      <span className="font-mono text-[10px] uppercase tracking-widest text-[--fg-subtle]">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <PageStagger className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-8 py-12">

        <PageStaggerItem className="flex flex-col gap-3">
          <SerifTitle className="text-4xl">methodology</SerifTitle>
          <p className="text-sm text-muted-foreground">
            How WebBench tests small language models — entirely in your browser,
            with nothing leaving your device. The goal isn&apos;t to make the model look
            good. It&apos;s to show you what it actually does.
          </p>
        </PageStaggerItem>

        <PageStaggerItem className="flex flex-col gap-12">

          <SectionDivider />

          <Section title="what we measure">
            <p>
              One number: <span className="text-foreground">multiple-choice accuracy</span> on
              MMLU-style questions. Fraction of questions answered correctly, reported with a
              95% Wilson confidence interval so you can see how noisy a small run really is.
            </p>
            <p>
              No calibration score. No behavior score. No archetype classification. Earlier
              versions of WebBench had all of those — they were elaborate plumbing on top of
              numbers that didn&apos;t help readers understand what they were looking at. They
              dressed up weak models. Accuracy and the raw output are what matter.
            </p>
          </Section>

          <SectionDivider />

          <Section title="what we show">
            <p>
              Every word the model wrote, unedited. No grammar constraints, no token-by-token
              steering, no template forcing. We send the question, the model streams text back,
              we display it.
            </p>
            <p>
              Small browser-runnable models (0.5B–8B parameters) often hallucinate, loop, hedge,
              and copy boilerplate from the few-shot examples. That&apos;s genuinely interesting and
              the whole point of running these locally. The site is built so you can see it —
              every report shows the full raw output of every question.
            </p>
          </Section>

          <SectionDivider />

          <Section title="how we ask">
            <p>
              Each question is preceded by five solved examples from the same MMLU subject —
              the canonical 5-shot evaluation protocol. The model is told:
            </p>
            <div className="border border-[--border] p-4 font-mono text-xs text-foreground">
              You are taking a multiple-choice exam. Each question has four options labeled
              A, B, C, and D. Exactly one is correct. Reason briefly, then end your response
              with a line in the form <span className="text-muted-foreground">ANSWER: X</span> where
              X is the chosen letter.
            </div>
            <p>
              Temperature is 0.1 so the same question on the same model gives roughly the same
              answer between runs. Max 400 tokens per question — enough room to reason without
              letting runaway loops eat the budget.
            </p>
            <div className="flex flex-col gap-0 mt-2">
              <MetricRow label="subjects" value="cs · engineering · math · science" />
              <MetricRow label="difficulty" value="easy · medium · hard (balanced)" />
              <MetricRow label="format" value="4-choice multiple choice" />
              <MetricRow label="protocol" value="5-shot in-context examples per question" />
              <MetricRow label="temperature" value="0.1" />
              <MetricRow label="max tokens" value="400 per question" />
            </div>
          </Section>

          <SectionDivider />

          <Section title="how we parse the answer">
            <p>
              The model is asked to end with <span className="text-foreground">ANSWER: X</span>,
              but small models often don&apos;t — they trail off, hedge, paraphrase, or just write
              &ldquo;the answer is C&rdquo; in prose. Rather than penalize bad format-following
              (which would be measuring instruction-following, not knowledge), the extractor
              walks five tiers in order; the first hit wins:
            </p>
            <div className="flex flex-col gap-0 mt-2">
              <MetricRow label="1. explicit format" value="matches ANSWER: X, **X**, \boxed{X}" />
              <MetricRow label="2. phrased commitment" value='"the answer is X", "I choose X", "therefore X"' />
              <MetricRow label="3. quoted the choice" value="model restated one choice's text distinctly more than the others" />
              <MetricRow label="4. weighted letter vote" value="late mentions of A/B/C/D weighted heavier; needs a clear margin" />
              <MetricRow label="5. no answer found" value="counts as incorrect — honest about model failure" />
            </div>
            <p>
              Each question in the report shows which tier produced its answer, so the parsing
              is fully transparent. A run where most answers come from tier 4 is meaningfully
              different from one where they all come from tier 1.
            </p>
          </Section>

          <SectionDivider />

          <Section title="accuracy and confidence intervals">
            <p>
              Accuracy is the fraction of questions answered correctly. Because run sizes are
              small (3–10 questions), raw accuracy has high variance. WebBench reports a 95%
              Wilson score confidence interval, which is better-behaved at extreme values
              (0% or 100% correct) than the naive proportion.
            </p>
            <p>
              A run of 3 questions can produce a CI as wide as ±50%. Ten questions narrows it
              considerably. Take a single small run as a signal, not a measurement.
            </p>
          </Section>

          <SectionDivider />

          <Section title="privacy and execution">
            <p>
              Inference runs entirely in your browser using{" "}
              <span className="text-foreground">WebLLM</span> and WebGPU. The model weights are
              downloaded directly to your device and cached by the browser — the model itself
              never runs on a server, and all computation happens locally on your GPU.
            </p>
            <p>
              When a run finishes, its results are anonymously shared to the public{" "}
              <span className="text-foreground">results</span> page so the community leaderboard
              reflects real runs. That includes the score, the raw model output for each question,
              and basic hardware info (GPU, browser, OS). There&apos;s no account, no login, and no
              personal identifier attached — a run can&apos;t be traced back to you. A copy is also
              kept in your browser&apos;s localStorage for your own history.
            </p>
          </Section>

          <SectionDivider />

          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              Questions sourced from the{" "}
              <a
                href="https://github.com/hendrycks/test"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 transition-colors hover:text-muted-foreground"
              >
                MMLU benchmark
              </a>{" "}
              (Hendrycks et al., 2021). In-browser inference via{" "}
              <a
                href="https://github.com/mlc-ai/web-llm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 transition-colors hover:text-muted-foreground"
              >
                WebLLM
              </a>{" "}
              (MLC AI). Published baselines from official papers — not directly comparable due
              to question set differences.
            </p>
          </div>

        </PageStaggerItem>

      </PageStagger>
    </div>
  );
}
