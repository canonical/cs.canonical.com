import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import type { IStore } from "./types";

import type { IUser } from "@/services/api/types/users";

export const useStore = create<IStore>()(
  devtools(
    persist(
      (set) => ({
        selectedProject: null,
        user: {} as IUser,
        setSelectedProject: (s) => set({ selectedProject: s }),
        setUser: (u) => set({ user: u }),
      }),
      {
        name: "store",
      },
    ),
  ),
);
