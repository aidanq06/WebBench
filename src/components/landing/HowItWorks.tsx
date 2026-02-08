const steps = [
  {
    num: "01",
    title: "select a model",
    desc: "choose a small llm that runs locally in your browser via webgpu",
  },
  {
    num: "02",
    title: "run the suite",
    desc: "the agent attempts 8 tasks inside a simulated customer support portal",
  },
  {
    num: "03",
    title: "get your report",
    desc: "see success rate, efficiency, and a full action replay for every task",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <h2 className="text-lg font-medium tracking-tight">how it works</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col gap-2 border p-6">
              <span className="text-xs text-muted-foreground">{s.num}</span>
              <span className="text-sm font-medium">{s.title}</span>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
