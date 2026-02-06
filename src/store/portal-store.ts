import { create } from "zustand";
import { PortalState } from "@/types/portal";
import { PortalAction, portalReducer } from "@/lib/portal/portal-reducers";
import { INITIAL_PORTAL_STATE } from "@/lib/portal/portal-state";

interface PortalStore {
  portalState: PortalState;
  dispatch: (action: PortalAction) => void;
  reset: () => void;
}

export const usePortalStore = create<PortalStore>((set) => ({
  portalState: INITIAL_PORTAL_STATE,
  dispatch: (action) =>
    set((s) => ({ portalState: portalReducer(s.portalState, action) })),
  reset: () => set({ portalState: { ...INITIAL_PORTAL_STATE } }),
}));
