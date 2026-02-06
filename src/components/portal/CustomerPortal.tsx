"use client";

import { usePortalStore } from "@/store/portal-store";
import { PortalSidebar } from "./PortalSidebar";
import { PortalDashboard } from "./PortalDashboard";
import { TicketList } from "./TicketList";
import { TicketDetail } from "./TicketDetail";
import { UserProfile } from "./UserProfile";
import { CreateTicketForm } from "./CreateTicketForm";
import React from "react";

export const CustomerPortal = React.forwardRef<HTMLDivElement>(
  function CustomerPortal(_, ref) {
    const { portalState } = usePortalStore();
    const view = portalState.view;

    return (
      <div ref={ref} className="flex h-[720px] w-[480px] border bg-background text-foreground">
        <PortalSidebar />
        <main className="flex-1 overflow-y-auto" role="main">
          {view.type === "dashboard" && <PortalDashboard />}
          {view.type === "ticket-list" && <TicketList />}
          {view.type === "ticket-detail" && <TicketDetail ticketId={view.ticketId} />}
          {view.type === "user-profile" && <UserProfile userId={view.userId} />}
          {view.type === "create-ticket" && <CreateTicketForm />}
        </main>
      </div>
    );
  }
);
