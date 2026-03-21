"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type FailReason = "mobile" | "no-webgpu" | null;

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod|android/.test(ua)) return true;
  // screen-width fallback for tablets / small laptops
  if (typeof window !== "undefined" && window.innerWidth < 768) return true;
  return false;
}

function hasWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

function BlockScreen({ reason }: { reason: "mobile" | "no-webgpu" }) {
  const isMobile = reason === "mobile";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <div className="flex max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium tracking-tighter">
            {isMobile ? "desktop required" : "webgpu not supported"}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isMobile
              ? "webbench runs large language models locally using WebGPU, which isn't available on mobile devices. open this page on a desktop computer."
              : "your browser doesn't support WebGPU, which webbench requires to run models locally. try chrome 113+, edge 113+, or safari 17.4+."}
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground/50">
          {isMobile ? (
            <>
              <span>chrome · edge · safari 17.4+</span>
              <span>mac · windows · linux</span>
            </>
          ) : (
            <>
              <span>chrome 113+ · edge 113+</span>
              <span>safari 17.4+ (macos only)</span>
            </>
          )}
        </div>

        <Link
          href="/leaderboard"
          className="self-center text-sm text-muted-foreground/50 transition-colors hover:text-foreground"
        >
          view leaderboard →
        </Link>
      </div>
    </motion.div>
  );
}

export function CompatibilityGate({ children }: { children: React.ReactNode }) {
  const [failReason, setFailReason] = useState<FailReason>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isMobileDevice()) {
      setFailReason("mobile");
    } else if (!hasWebGPU()) {
      setFailReason("no-webgpu");
    }
    setChecked(true);
  }, []);

  // Don't flash content before check completes
  if (!checked) return null;

  if (failReason) return <BlockScreen reason={failReason} />;

  return <>{children}</>;
}
