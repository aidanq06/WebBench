import { Navbar } from "@/components/landing/Navbar";
import { ModelsClient } from "./models-client";
import { getModelStats } from "@/lib/supabase/queries";

export const metadata = {
  title: "Results — WebBench",
  description: "Community results across browser-runnable LLMs.",
};

// Always rebuild — community data should look live.
export const revalidate = 60;

export default async function ModelsPage() {
  const stats = await getModelStats().catch(() => []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <ModelsClient stats={stats} />
    </div>
  );
}
