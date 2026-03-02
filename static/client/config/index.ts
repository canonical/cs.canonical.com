import type { TView } from "@/services/api/types/views";

let staleTime = process.env.NODE_ENV === "production" ? 300000 : 30000;

export const VIEW_OWNED = "owned";
export const VIEW_REVIEWED = "reviewed";
export const VIEW_TREE = "tree";
export const VIEW_TABLE = "table";
export const VIEW_REQUESTS = "requests";

export const COPY_UPDATE = "Copy update";
export const PAGE_REFRESH = "Page refresh";
export const NEW_WEBPAGE = "New webpage";
export const NEW_CASE_STUDY = "New case study";
export const BUG_REPORT = "Bug report";
export const NEW_FEATURE_REQUEST = "New feature request";

const config = {
  allProjects: [
    "canonical.com",
    "ubuntu.com",
    "cn.ubuntu.com",
    "jp.ubuntu.com",
    "snapcraft.io",
    "charmhub.io",
    "canonical.design",
    "netplan.io",
  ],
  testProjects: ["canonical.com", "jp.ubuntu.com"],
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
  assetsManagerUrl: "https://assets.ubuntu.com/manager",
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
    mode: "rest", // or "mock"
  },
  ghLink: (project: string) => `https://github.com/canonical/${project}/tree/main/templates`,
  copyStyleGuideLink:
    "https://docs.google.com/document/d/1AX-kSNztuAmShEoohe8L3LNLRnSKF7I0qkZGNeoGOok/edit?tab=t.0#heading=h.utc4w4tdsldu",
  jiraTaskLink: "https://warthogs.atlassian.net/browse/",
  infiniteScroll: {
    initialLoadCount: 50,
    loadMoreCount: 50,
    scrollThreshold: 200,
  },
  requestTypes: [COPY_UPDATE, PAGE_REFRESH, NEW_WEBPAGE, NEW_CASE_STUDY, BUG_REPORT, NEW_FEATURE_REQUEST],
  copyDocTemplateLink:
    "https://docs.google.com/document/d/1EPA_Ea8ShIvyftAc9oVxZYUIMHfAPFF6S5x6FOvLkwM/edit?tab=t.ly9ghy9ilvf#heading=h.krz2ku7u3755",
  copyDocsFolderLink:
    "https://drive.google.com/drive/folders/0B4s80tIYQW4BMjNiMGFmNzQtNDkxZC00YmQ0LWJiZWUtNTk2YThlY2MzZmJh?dmr=1&ec=wgc-drive-%5Bmodule%5D-goto&resourcekey=0-L9UqvqfGkYl3-oZW0oX3Aw",
  brandRequestsLink: "https://warthogs.atlassian.net/jira/software/c/projects/BRND/forms/form/direct/1/10013",
};

export default config;
