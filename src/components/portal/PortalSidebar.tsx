"use client";

import { usePortalStore } from "@/store/portal-store";
import { PortalView } from "@/types/portal";
import { cn } from "@/lib/utils";

const navItems: { label: string; view: PortalView }[] = [
  { label: "dashboard", view: { type: "dashboard" } },
  { label: "tickets", view: { type: "ticket-list" } },
  { label: "new ticket", view: { type: "create-ticket" } },
];

export function PortalSidebar() {
  const { portalState, dispatch } = usePortalStore();
  const currentType = portalState.view.type;

  return (
    <nav className="flex w-48 shrink-0 flex-col border-r bg-card" aria-label="portal navigation">
      <div className="border-b px-4 py-3">
        <span className="text-sm font-medium">support portal</span>
      </div>
      {navItems.map((item) => (
        <button
          key={item.label}
          aria-label={item.label}
          data-action={`nav-${item.view.type}`}
          className={cn(
            "px-4 py-2 text-left text-sm hover:bg-accent/50",
            currentType === item.view.type && "bg-accent text-accent-foreground"
          )}
          onClick={() => dispatch({ type: "NAVIGATE", view: item.view })}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
