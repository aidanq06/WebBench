import { cn } from "@/lib/utils";

interface SectionDividerProps {
  label?: string;
  className?: string;
}

export function SectionDivider({ label, className }: SectionDividerProps) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-4 my-12", className)}>
        <div className="flex-1 border-t border-[--border]" />
        <span className="text-xs text-[--fg-subtle] font-mono uppercase tracking-widest">
          {label}
        </span>
        <div className="flex-1 border-t border-[--border]" />
      </div>
    );
  }
  return <div className={cn("border-t border-[--border] my-12", className)} />;
}
