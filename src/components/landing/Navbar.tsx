import Link from "next/link";
import { CacheSettings } from "./CacheSettings";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[--border] bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-8">
        <Link href="/" className="text-sm font-medium tracking-tight text-foreground">
          webbench
        </Link>

        <nav className="flex items-center gap-6 text-sm max-sm:hidden">
          <Link href="/benchmark" className="text-[--fg-subtle] transition-colors hover:text-foreground">
            run
          </Link>
          <Link href="/results" className="text-[--fg-subtle] transition-colors hover:text-foreground">
            results
          </Link>
          <Link href="/methodology" className="text-[--fg-subtle] transition-colors hover:text-foreground">
            methodology
          </Link>
          <Link href="/questions" className="text-[--fg-subtle] transition-colors hover:text-foreground">
            questions
          </Link>
          <a
            href="https://github.com/aidanq06/WebBench"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[--fg-subtle] transition-colors hover:text-foreground"
          >
            github ↗
          </a>
          <CacheSettings />
        </nav>
      </div>
    </header>
  );
}
