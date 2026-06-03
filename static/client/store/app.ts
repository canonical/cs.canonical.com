import { create } from "zustand";

import type { IPanelsStore, PanelKey } from "./types";

export const usePanelsStore = create<IPanelsStore>((set, get) => ({
  productsPanelVisible: false,
  copyUpdatePanelVisible: false,
  pageRefreshPanelVisible: false,
  reportBugPanelVisible: false,
  requestFeaturePanelVisible: false,
  requestRemovalPanelVisible: false,
  editPageDetailsPanelVisible: false,
  newWebpagePanelVisible: false,

  togglePanel: (panelKey: PanelKey) => {
    const currentState = get();

    const isCurrentlyVisible = currentState[panelKey];

    const newState = {
      productsPanelVisible: false,
      copyUpdatePanelVisible: false,
      pageRefreshPanelVisible: false,
      reportBugPanelVisible: false,
      requestFeaturePanelVisible: false,
      requestRemovalPanelVisible: false,
      editPageDetailsPanelVisible: false,
      newWebpagePanelVisible: false,
      [panelKey]: !isCurrentlyVisible,
    };

    set(newState);
  },

  toggleProductsPanel: () => get().togglePanel("productsPanelVisible"),
  toggleCopyUpdatePanel: () => get().togglePanel("copyUpdatePanelVisible"),
  togglePageRefreshPanel: () => get().togglePanel("pageRefreshPanelVisible"),
  toggleReportBugPanel: () => get().togglePanel("reportBugPanelVisible"),
  toggleRequestFeaturePanel: () => get().togglePanel("requestFeaturePanelVisible"),
  toggleRequestRemovalPanel: () => get().togglePanel("requestRemovalPanelVisible"),
  toggleEditPageDetailsPanel: () => get().togglePanel("editPageDetailsPanelVisible"),
  toggleNewWebpagePanel: () => get().togglePanel("newWebpagePanelVisible"),
}));
