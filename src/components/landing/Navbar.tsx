import Link from "next/link";
import { TerminalIcon } from "lucide-react";
import { CacheSettings } from "./CacheSettings";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <TerminalIcon className="h-4 w-4" />
          <span>webbench</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm max-sm:hidden">
          <Link href="/benchmark" className="text-muted-foreground hover:text-foreground">
            run
          </Link>
          <Link href="/questions" className="text-muted-foreground hover:text-foreground">
            question set
          </Link>
          <a
            href="https://aidanquach.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            about
          </a>
          <a
            href="https://github.com/aidanq06/WebBench"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            github
          </a>
          <CacheSettings />
        </nav>
      </div>
    </header>
  );
}
