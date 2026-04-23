import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FullSiteView from "./FullSiteView";

import type { IPage, IPagesResponse } from "@/services/api/types/pages";
import { PageStatus } from "@/services/api/types/pages";
import { useViewsStore } from "@/store/views";

vi.mock("@/services/api/hooks/projects", () => ({
  useProjects: vi.fn(),
}));

vi.mock("@/components/RequestCopydocPanel/RequestCopydocPanel", () => ({
  default: ({ webpage }: { webpage?: IPage }) => (
    <div data-testid="copydoc-panel" data-webpage={webpage?.name ?? ""} />
  ),
}));

vi.mock("@/components/RequestRemovalPanel", () => ({
  default: ({ webpage }: { webpage?: IPage }) => (
    <div data-testid="removal-panel" data-webpage={webpage?.name ?? ""} />
  ),
}));

vi.mock("@/components/RequestTaskModal/RequestTaskModal", () => ({
  default: ({ webpage, changeType }: { webpage?: IPage; changeType?: number }) => (
    <div data-testid="task-modal" data-webpage={webpage?.name ?? ""} data-change-type={changeType} />
  ),
}));

import { useProjects } from "@/services/api/hooks/projects";

const makePage = (overrides: Partial<IPage> = {}): IPage => ({
  id: 1,
  name: "page-1",
  title: "Page 1",
  copy_doc_link: "",
  owner: { name: "Alice", email: "alice@example.com" } as IPage["owner"],
  reviewers: [],
  status: PageStatus.AVAILABLE,
  jira_tasks: [],
  children: [],
  products: [],
  url: "/page-1",
  project: { created_at: "", id: 1, name: "canonical.com", updated_at: "" },
  ext: ".html",
  ...overrides,
});

const makeProject = (page: IPage): IPagesResponse["data"] => ({
  name: "canonical.com",
  templates: {
    ...makePage({ name: "root", url: "/", ext: ".dir" }),
    children: [page],
  },
});

function renderWith(page: IPage) {
  (useProjects as ReturnType<typeof vi.fn>).mockReturnValue({
    data: [makeProject(page)],
    isLoading: false,
    isFilterApplied: false,
    unfilteredProjects: [makeProject(page)],
  });
  useViewsStore.setState({ activeProject: "canonical.com" });

  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FullSiteView />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("FullSiteView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the active project's page rows", () => {
    renderWith(makePage({ url: "/page-1" }));
    expect(screen.getByRole("button", { name: /\/page-1/ })).toBeInTheDocument();
  });
});
