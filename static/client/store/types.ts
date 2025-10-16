import { type IPagesResponse } from "@/services/api/types/pages";
import { type IUser } from "@/services/api/types/users";
import type { IViewFilter, TView } from "@/services/api/types/views";

export interface IStore {
  selectedProject: IPagesResponse["data"] | null;
  user: IUser;
  setSelectedProject: (s: IPagesResponse["data"]) => void;
  setUser: (u: IUser) => void;
}

export interface IViewsStore {
  view: TView;
  filter: IViewFilter;
  setView: (s: TView) => void;
  setFilter: (s: Partial<IViewFilter>) => void;
  expandedProject: string;
  setExpandedProject: (s: IViewsStore["expandedProject"]) => void;
}

export interface IPanelsStore {
  productsPanelVisible: boolean;
  reportBugPanelVisible: boolean;
  requestFeaturePanelVisible: boolean;

  togglePanel: (p: PanelKey) => void;
  toggleProductsPanel: () => void;
  toggleReportBugPanel: () => void;
  toggleRequestFeaturePanel: () => void;
}

export type PanelKey = "productsPanelVisible" | "reportBugPanelVisible" | "requestFeaturePanelVisible";
