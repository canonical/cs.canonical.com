import type { TView } from "@/services/api/types/views";

let staleTime = process.env.NODE_ENV === "production" ? 300000 : 30000;

export const VIEW_OWNED = "owned";
export const VIEW_REVIEWED = "reviewed";
export const VIEW_TREE = "tree";
export const VIEW_TABLE = "table";

const config = {
  projects: ["canonical.com", "ubuntu.com", "cn.ubuntu.com", "jp.ubuntu.com"],
  views: [VIEW_OWNED, VIEW_REVIEWED, VIEW_TREE, VIEW_TABLE] as TView[],
  api: {
    path: "/",
    FETCH_OPTIONS: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      optimisticResults: false,
      staleTime: staleTime,
      cacheTime: staleTime,
    },
  },
  ghLink: (project: string) => `https://github.com/canonical/${project}/tree/main/templates`,
  copyStyleGuideLink: "https://docs.google.com/document/d/1AX-kSNztuAmShEoohe8L3LNLRnSKF7I0qkZGNeoGOok/edit?tab=t.0",
  jiraTaskLink: "https://warthogs.atlassian.net/browse/",
};

export default config;
