"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
  }

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        sign in
      </button>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const username = (user.user_metadata?.user_name ?? user.user_metadata?.name ?? user.email ?? "user") as string;
  const initial = username[0].toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={username} className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-medium">
            {initial}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 flex w-44 flex-col border bg-background shadow-md">
          <div className="border-b px-4 py-3">
            <p className="truncate text-xs font-medium">{username}</p>
          </div>
          <a
            href="/profile"
            className="px-4 py-3 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            my runs
          </a>
          <button
            onClick={signOut}
            className="px-4 py-3 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            sign out
          </button>
        </div>
      )}
    </div>
  );
}
