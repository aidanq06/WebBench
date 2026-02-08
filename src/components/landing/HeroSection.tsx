import Link from "next/link";

export function HeroSection() {
  return (
    <section className="flex flex-col items-center gap-6 px-6 pt-24 pb-12 text-center">
      <h1 className="max-w-3xl text-3xl font-medium tracking-tighter sm:text-6xl">
        webbench: a benchmark for ai agents in browser environments
      </h1>
      <p className="max-w-xl text-sm text-muted-foreground sm:text-lg">
        run a standardized task suite against a local llm entirely in your
        browser. no api keys, no server, no setup. powered by webgpu.
      </p>
      <Link
        href="/benchmark"
        className="mt-4 border bg-primary px-8 py-3 text-sm text-primary-foreground hover:bg-primary/90"
      >
        run benchmark
      </Link>
    </section>
  );
}
