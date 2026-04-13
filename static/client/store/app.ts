import { create } from "zustand";

import type { IPanelsStore, PanelKey } from "./types";

export const usePanelsStore = create<IPanelsStore>((set, get) => ({
  productsPanelVisible: false,
  reportBugPanelVisible: false,
  requestFeaturePanelVisible: false,
  addChecksumPanelVisible: false,

  togglePanel: (panelKey: PanelKey) => {
    const currentState = get();

    const isCurrentlyVisible = currentState[panelKey];

    const newState = {
      productsPanelVisible: false,
      reportBugPanelVisible: false,
      requestFeaturePanelVisible: false,
      addChecksumPanelVisible: false,

      [panelKey]: !isCurrentlyVisible,
    };

    set(newState);
  },

  toggleProductsPanel: () => get().togglePanel("productsPanelVisible"),
  toggleReportBugPanel: () => get().togglePanel("reportBugPanelVisible"),
  toggleRequestFeaturePanel: () => get().togglePanel("requestFeaturePanelVisible"),
  toggleAddChecksumPanel: () => get().togglePanel("addChecksumPanelVisible"),
}));
