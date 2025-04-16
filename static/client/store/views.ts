import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import type { TView } from "@/services/api/types/views";

export const useViewsStore = create<any>()(
  devtools(
    persist(
      (set) => ({
        view: null,
        filters: null,
        setView: (s: TView) => set({ view: s }),
      }),
      {
        name: "viewsStore",
      },
    ),
  ),
);
