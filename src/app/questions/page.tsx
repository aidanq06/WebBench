import { Navbar } from "@/components/landing/Navbar";
import { TaskPreviewGrid } from "@/components/landing/TaskPreviewGrid";
import { PageStagger, PageStaggerItem } from "@/components/layout/PageStagger";
import { QUESTIONS } from "@/lib/benchmark/questions";

export const metadata = {
  title: "Questions — WebBench",
  description: "Browse the WebBench MMLU question bank.",
};

export default function QuestionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <PageStagger className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-8 py-12">
        <PageStaggerItem className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-medium tracking-tight">
            question <span className="text-muted-foreground">bank</span>
          </h1>
          <p className="font-mono text-[10px] text-[--fg-subtle]">
            {QUESTIONS.length} questions · MMLU · cs · engineering · math · science
          </p>
        </PageStaggerItem>
        <PageStaggerItem>
          <TaskPreviewGrid />
        </PageStaggerItem>
      </PageStagger>
    </div>
  );
}
