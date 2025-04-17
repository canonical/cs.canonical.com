import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import type { IViewsStore } from "./types";

import { VIEW_TABLE } from "@/config";
import type { IViewFilter, TView } from "@/services/api/types/views";

export const useViewsStore = create<IViewsStore>()(
  devtools(
    persist(
      (set) => ({
        view: VIEW_TABLE as TView,
        filter: {
          owners: [],
          reviewers: [],
          products: [],
          query: null,
        } as IViewFilter,
        setView: (s: TView) => set({ view: s }),
        setFilter: (s: Partial<IViewFilter>) =>
          set((state: IViewsStore) => ({
            filter: {
              ...state.filter,
              ...s,
            },
          })),
      }),
      {
        name: "viewsStore",
      },
    ),
  ),
);
