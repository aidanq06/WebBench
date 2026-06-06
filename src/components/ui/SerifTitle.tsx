import { cn } from "@/lib/utils";

interface SerifTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export function SerifTitle({ children, className, as: Tag = "h1" }: SerifTitleProps) {
  return (
    <Tag className={cn("font-serif font-medium tracking-tight", className)}>
      {children}
    </Tag>
  );
}
