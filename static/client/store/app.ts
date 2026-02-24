import { create } from "zustand";

import type { IPanelsStore, PanelKey } from "./types";

export const usePanelsStore = create<IPanelsStore>((set, get) => ({
  productsPanelVisible: false,
  copyUpdatePanelVisible: false,
  reportBugPanelVisible: false,
  requestFeaturePanelVisible: false,

  togglePanel: (panelKey: PanelKey) => {
    const currentState = get();

    const isCurrentlyVisible = currentState[panelKey];

    const newState = {
      productsPanelVisible: false,
      copyUpdatePanelVisible: false,
      reportBugPanelVisible: false,
      requestFeaturePanelVisible: false,

      [panelKey]: !isCurrentlyVisible,
    };

    set(newState);
  },

  toggleProductsPanel: () => get().togglePanel("productsPanelVisible"),
  toggleCopyUpdatePanel: () => get().togglePanel("copyUpdatePanelVisible"),
  toggleReportBugPanel: () => get().togglePanel("reportBugPanelVisible"),
  toggleRequestFeaturePanel: () => get().togglePanel("requestFeaturePanelVisible"),
}));
