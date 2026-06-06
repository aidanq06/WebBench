"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// "no-webgpu"  = browser doesn't expose navigator.gpu at all
// "no-adapter" = WebGPU API exists but requestAdapter() returned null (no compatible GPU / drivers)
// "mobile"     = detected mobile device
type FailReason = "mobile" | "no-webgpu" | "no-adapter" | null;

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod|android/.test(ua)) return true;
  if (typeof window !== "undefined" && window.innerWidth < 768) return true;
  return false;
}

async function checkWebGPU(): Promise<"ok" | "no-webgpu" | "no-adapter"> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return "no-webgpu";
  try {
    const gpu = (navigator as { gpu?: { requestAdapter?: () => Promise<unknown> } }).gpu;
    const adapter = await gpu?.requestAdapter?.();
    return adapter ? "ok" : "no-adapter";
  } catch {
    return "no-adapter";
  }
}

const BLOCK_COPY: Record<
  Exclude<FailReason, null>,
  { title: string; body: string; hints: string[] }
> = {
  mobile: {
    title: "desktop required",
    body: "webbench runs large language models locally using WebGPU, which isn't available on mobile devices. open this page on a desktop computer.",
    hints: ["chrome · edge · safari 17.4+", "mac · windows · linux"],
  },
  "no-webgpu": {
    title: "webgpu not supported",
    body: "your browser doesn't support WebGPU, which webbench requires to run models locally. try chrome 113+, edge 113+, or safari 17.4+.",
    hints: ["chrome 113+ · edge 113+", "safari 17.4+ (macos only)"],
  },
  "no-adapter": {
    title: "no compatible gpu found",
    body: "your browser supports WebGPU but hardware acceleration is likely disabled — a common fix for screen sharing apps like Netflix. re-enable it in your browser settings and relaunch.",
    hints: [
      "chrome · edge: settings → system → use graphics acceleration",
      "then fully relaunch the browser",
      "safari: enabled by default — try updating macOS",
    ],
  },
};

function BlockScreen({ reason }: { reason: Exclude<FailReason, null> }) {
  const { title, body, hints } = BLOCK_COPY[reason];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <div className="flex max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium tracking-tighter">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground/50">
          {hints.map((h) => <span key={h}>{h}</span>)}
        </div>
        <Link
          href="/results"
          className="self-center text-sm text-muted-foreground/50 transition-colors hover:text-foreground"
        >
          browse results →
        </Link>
      </div>
    </motion.div>
  );
}

export function CompatibilityGate({
  children,
  bypass = false,
}: {
  children: React.ReactNode;
  bypass?: boolean;
}) {
  const [failReason, setFailReason] = useState<FailReason>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (bypass) { setChecked(true); return; }

    if (isMobileDevice()) {
      setFailReason("mobile");
      setChecked(true);
      return;
    }

    // Async probe: actually request a GPU adapter, not just check the API exists
    checkWebGPU().then((result) => {
      if (result !== "ok") setFailReason(result);
      setChecked(true);
    });
  }, [bypass]);

  // Don't flash content before async check completes
  if (!checked) return null;

  if (failReason) return <BlockScreen reason={failReason} />;

  return <>{children}</>;
}
