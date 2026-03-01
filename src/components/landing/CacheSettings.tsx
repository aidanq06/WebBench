"use client";

import { useState, useEffect, useRef } from "react";
import { Settings } from "lucide-react";

function fmt(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kb`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} mb`;
}

export function CacheSettings() {
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<number | null>(null);
  const [cleared, setCleared] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function loadUsage() {
    if (!navigator.storage?.estimate) return;
    const est = await navigator.storage.estimate();
    setUsage(est.usage ?? 0);
  }

  useEffect(() => {
    if (open) {
      setCleared(false);
      loadUsage();
    }
  }, [open]);

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleClear() {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    sessionStorage.clear();
    setCleared(true);
    setUsage(0);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label="settings"
      >
        <Settings className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 border bg-background shadow-sm">
          <div className="flex flex-col gap-3 p-4">
            <div className="text-xs text-muted-foreground">storage</div>
            <div className="text-sm">
              {usage === null ? (
                <span className="text-muted-foreground">calculating…</span>
              ) : (
                <span>{fmt(usage)} used</span>
              )}
            </div>
            <div className="border-t pt-3">
              {cleared ? (
                <span className="text-xs text-muted-foreground">cleared</span>
              ) : (
                <button
                  onClick={handleClear}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  clear all cache
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
