import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FullSiteView from "./FullSiteView";

import { useProjects } from "@/services/api/hooks/projects";
import { PageStatus, type IPage, type IPagesResponse } from "@/services/api/types/pages";
import { useViewsStore } from "@/store/views";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/services/api/hooks/projects", () => ({
  useProjects: vi.fn(),
}));

vi.mock("@/components/RequestCopydocPanel/RequestCopydocPanel", () => ({
  default: ({ webpage }: { webpage?: IPage }) => <div data-testid="copydoc-panel" data-webpage={webpage?.name ?? ""} />,
}));

vi.mock("@/components/RequestRemovalPanel", () => ({
  default: ({ webpage }: { webpage?: IPage }) => <div data-testid="removal-panel" data-webpage={webpage?.name ?? ""} />,
}));

vi.mock("@/components/RequestTaskModal/RequestTaskModal", () => ({
  default: ({ webpage, changeType }: { webpage?: IPage; changeType?: number }) => (
    <div data-change-type={changeType} data-testid="task-modal" data-webpage={webpage?.name ?? ""} />
  ),
}));

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

const makeProject = (children: IPage | IPage[]): IPagesResponse["data"] => ({
  name: "canonical.com",
  templates: {
    ...makePage({ name: "root", url: "/", ext: ".dir" }),
    children: Array.isArray(children) ? children : [children],
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
    mockNavigate.mockReset();
  });

  it("renders the active project's page rows", () => {
    renderWith(makePage({ url: "/page-1" }));
    expect(screen.getByRole("button", { name: "/page-1" })).toBeInTheDocument();
  });

  it("opens the contextual menu for a non-NEW page and shows Copy update, Page refresh, Remove page", async () => {
    const user = userEvent.setup();
    renderWith(makePage({ status: PageStatus.AVAILABLE }));

    await user.click(screen.getByRole("button", { name: /page actions for/i }));

    expect(screen.getByRole("button", { name: /copy update/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /page refresh/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove page/i })).toBeInTheDocument();
  });

  it("clicking Copy update opens the copydoc panel for that row's page", async () => {
    const user = userEvent.setup();
    renderWith(makePage({ name: "page-a", status: PageStatus.AVAILABLE }));

    await user.click(screen.getByRole("button", { name: /page actions for/i }));
    await user.click(screen.getByRole("button", { name: /copy update/i }));

    const panel = await screen.findByTestId("copydoc-panel");
    expect(panel).toHaveAttribute("data-webpage", "page-a");
  });

  it("clicking Page refresh opens the task modal with PAGE_REFRESH for that row's page", async () => {
    const user = userEvent.setup();
    renderWith(makePage({ name: "page-b", status: PageStatus.AVAILABLE }));

    await user.click(screen.getByRole("button", { name: /page actions for/i }));
    await user.click(screen.getByRole("button", { name: /page refresh/i }));

    const modal = await screen.findByTestId("task-modal");
    expect(modal).toHaveAttribute("data-webpage", "page-b");
    expect(modal).toHaveAttribute("data-change-type", "1"); // ChangeRequestType.PAGE_REFRESH
  });

  it("clicking Remove page opens the removal panel for that row's page", async () => {
    const user = userEvent.setup();
    renderWith(makePage({ name: "page-c", status: PageStatus.AVAILABLE }));

    await user.click(screen.getByRole("button", { name: /page actions for/i }));
    await user.click(screen.getByRole("button", { name: /remove page/i }));

    const panel = screen.getByTestId("removal-panel");
    expect(panel).toHaveAttribute("data-webpage", "page-c");
  });

  it("renders all three menu items as disabled when the page is TO_DELETE", async () => {
    const user = userEvent.setup();
    renderWith(makePage({ status: PageStatus.TO_DELETE }));

    await user.click(screen.getByRole("button", { name: /page actions for/i }));

    expect(screen.getByRole("button", { name: /copy update/i })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: /page refresh/i })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: /remove page/i })).toHaveAttribute("aria-disabled", "true");
  });

  it("shows only 'Submit for content review' for NEW pages without jira tasks or content_jira_id", async () => {
    const user = userEvent.setup();
    renderWith(
      makePage({
        name: "new-page",
        status: PageStatus.NEW,
        jira_tasks: [],
        content_jira_id: undefined,
      }),
    );

    await user.click(screen.getByRole("button", { name: /page actions for/i }));

    expect(screen.getByRole("button", { name: /submit for content review/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy update/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /page refresh/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove page/i })).not.toBeInTheDocument();
  });

  it("clicking Submit for content review opens the task modal with NEW_WEBPAGE", async () => {
    const user = userEvent.setup();
    renderWith(
      makePage({
        name: "new-page",
        status: PageStatus.NEW,
        jira_tasks: [],
        content_jira_id: undefined,
      }),
    );

    await user.click(screen.getByRole("button", { name: /page actions for/i }));
    await user.click(screen.getByRole("button", { name: /submit for content review/i }));

    const modal = await screen.findByTestId("task-modal");
    expect(modal).toHaveAttribute("data-webpage", "new-page");
    expect(modal).toHaveAttribute("data-change-type", "2"); // ChangeRequestType.NEW_WEBPAGE
  });

  it("disables the menu trigger for NEW pages that already have jira tasks", () => {
    renderWith(
      makePage({
        status: PageStatus.NEW,
        jira_tasks: [
          {
            created_at: "",
            jira_id: "JIRA-1",
            id: 1,
            name: "t",
            status: "open",
            summary: "s",
          },
        ],
      }),
    );

    expect(screen.getByRole("button", { name: /page actions for/i })).toHaveAttribute("aria-disabled", "true");
  });

  it("disables the menu trigger for NEW pages that have a content_jira_id", () => {
    renderWith(
      makePage({
        status: PageStatus.NEW,
        jira_tasks: [],
        content_jira_id: "CB-1",
      }),
    );

    expect(screen.getByRole("button", { name: /page actions for/i })).toHaveAttribute("aria-disabled", "true");
  });

  describe("view mode toggle", () => {
    it("renders List view by default", () => {
      renderWith(makePage({ url: "/page-1" }));
      expect(screen.getByRole("tab", { name: /list view/i })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: /tree view/i })).toHaveAttribute("aria-selected", "false");
      expect(screen.getByRole("grid")).toBeInTheDocument();
      expect(screen.queryByRole("tree")).not.toBeInTheDocument();
    });

    it("switches to Tree view, hiding FilterandSearch and MainTable", async () => {
      const user = userEvent.setup();
      renderWith(makePage({ url: "/page-1" }));

      await user.click(screen.getByRole("tab", { name: /tree view/i }));

      expect(screen.getByRole("tab", { name: /tree view/i })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tree")).toBeInTheDocument();
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/search by url/i)).not.toBeInTheDocument();
    });
  });
});
