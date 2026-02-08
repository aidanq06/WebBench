import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TaskPreviewGrid } from "@/components/landing/TaskPreviewGrid";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <HowItWorks />
        <TaskPreviewGrid />
        <footer className="border-t px-6 py-6">
          <div className="mx-auto max-w-7xl text-xs text-muted-foreground">
            webbench — open source ai agent benchmark
          </div>
        </footer>
      </main>
    </div>
  );
}
