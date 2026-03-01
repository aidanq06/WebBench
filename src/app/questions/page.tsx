import { Navbar } from "@/components/landing/Navbar";
import { TaskPreviewGrid } from "@/components/landing/TaskPreviewGrid";

export default function QuestionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <TaskPreviewGrid />
      </main>
    </div>
  );
}
