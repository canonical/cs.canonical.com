import type { TView } from "@/services/api/types/views";

let staleTime = process.env.NODE_ENV === "production" ? 300000 : 30000;

export const VIEW_OWNED = "owned";
export const VIEW_REVIEWED = "reviewed";
export const VIEW_TREE = "tree";
export const VIEW_TABLE = "table";

const config = {
  projects: ["canonical.com", "ubuntu.com", "cn.ubuntu.com", "jp.ubuntu.com"],
  views: [VIEW_OWNED, VIEW_REVIEWED, VIEW_TREE, VIEW_TABLE] as TView[],
  tooltips: {
    ownerDef: "Owners request the page and must approve the page for it to go live.",
    reviewerDef: "Reviewers can contribute to page content, but they can't approve the page to go live.",
    copyUpdates: [
      "Text changes to existing sections",
      "Adding a section that is a copy of an existing section, with different text",
      "Removing a section",
      "Replacing or removing logos or images",
    ],
    pageRefreshes: ["Changing or adding to the page layout", "Modifications that change the layout"],
  },
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
