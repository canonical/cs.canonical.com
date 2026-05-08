import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FullSiteView from "./FullSiteView";

import { useProjects } from "@/services/api/hooks/projects";
import { PageStatus, type IPage, type IPagesResponse } from "@/services/api/types/pages";
import type { IUser } from "@/services/api/types/users";
import { useStore } from "@/store";
import { useViewsStore } from "@/store/views";

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

function renderWith(pages: IPage | IPage[], user: Partial<IUser> = { email: "alice@example.com" }) {
  (useProjects as ReturnType<typeof vi.fn>).mockReturnValue({
    data: [makeProject(pages)],
    isLoading: false,
    isFilterApplied: false,
    unfilteredProjects: [makeProject(pages)],
  });
  useViewsStore.setState({ activeProject: "canonical.com" });
  useStore.setState({ user: user as IUser });

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
    expect(screen.getByRole("button", { name: "/page-1" })).toBeInTheDocument();
  });

  it("opens the contextual menu for a non-NEW page and shows Copy update, Page refresh, Remove page", async () => {
    const user = userEvent.setup();
    renderWith(makePage({ status: PageStatus.AVAILABLE }));

    await user.click(screen.getByRole("button", { name: /page actions/i }));

    expect(screen.getByRole("button", { name: /copy update/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /page refresh/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove page/i })).toBeInTheDocument();
  });

  it("clicking Copy update opens the copydoc panel for that row's page", async () => {
    const user = userEvent.setup();
    renderWith(makePage({ name: "page-a", status: PageStatus.AVAILABLE }));

    await user.click(screen.getByRole("button", { name: /page actions/i }));
    await user.click(screen.getByRole("button", { name: /copy update/i }));

    const panel = await screen.findByTestId("copydoc-panel");
    expect(panel).toHaveAttribute("data-webpage", "page-a");
  });

  it("clicking Page refresh opens the task modal with PAGE_REFRESH for that row's page", async () => {
    const user = userEvent.setup();
    renderWith(makePage({ name: "page-b", status: PageStatus.AVAILABLE }));

    await user.click(screen.getByRole("button", { name: /page actions/i }));
    await user.click(screen.getByRole("button", { name: /page refresh/i }));

    const modal = await screen.findByTestId("task-modal");
    expect(modal).toHaveAttribute("data-webpage", "page-b");
    expect(modal).toHaveAttribute("data-change-type", "1"); // ChangeRequestType.PAGE_REFRESH
  });

  it("clicking Remove page opens the removal panel for that row's page", async () => {
    const user = userEvent.setup();
    renderWith(makePage({ name: "page-c", status: PageStatus.AVAILABLE }));

    await user.click(screen.getByRole("button", { name: /page actions/i }));
    await user.click(screen.getByRole("button", { name: /remove page/i }));

    const panel = screen.getByTestId("removal-panel");
    expect(panel).toHaveAttribute("data-webpage", "page-c");
  });

  it("renders all three menu items as disabled when the page is TO_DELETE", async () => {
    const user = userEvent.setup();
    renderWith(makePage({ status: PageStatus.TO_DELETE }));

    await user.click(screen.getByRole("button", { name: /page actions/i }));

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

    await user.click(screen.getByRole("button", { name: /page actions/i }));

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

    await user.click(screen.getByRole("button", { name: /page actions/i }));
    await user.click(screen.getByRole("button", { name: /submit for content review/i }));

    const modal = await screen.findByTestId("task-modal");
    expect(modal).toHaveAttribute("data-webpage", "new-page");
    expect(modal).toHaveAttribute("data-change-type", "2"); // ChangeRequestType.NEW_WEBPAGE
  });

  it.each<[string, Partial<IPage>]>([
    [
      "jira tasks",
      {
        jira_tasks: [
          { created_at: "", jira_id: "JIRA-1", id: 1, name: "t", status: "open", summary: "s", request_type: "" },
        ],
      },
    ],
    ["a content_jira_id", { jira_tasks: [], content_jira_id: "CB-1" }],
  ])("disables the menu trigger for NEW pages that already have %s", (_, overrides) => {
    renderWith(makePage({ status: PageStatus.NEW, ...overrides }));

    expect(screen.getByRole("button", { name: /page actions/i })).toHaveAttribute("aria-disabled", "true");
  });

  it("disables the menu trigger when the current user is not the page owner", () => {
    renderWith(makePage({ status: PageStatus.AVAILABLE }), { email: "bob@example.com" });

    expect(screen.getByRole("button", { name: /page actions/i })).toHaveAttribute("aria-disabled", "true");
  });

  it("disables the menu trigger when the page has no owner", () => {
    renderWith(makePage({ status: PageStatus.AVAILABLE, owner: null as unknown as IPage["owner"] }), {
      email: "alice@example.com",
    });

    expect(screen.getByRole("button", { name: /page actions/i })).toHaveAttribute("aria-disabled", "true");
  });

  it("enables the menu trigger for non-owners when the current user is an admin", async () => {
    const user = userEvent.setup();
    renderWith(makePage({ status: PageStatus.AVAILABLE }), { email: "bob@example.com", role: "admin" });

    const trigger = screen.getByRole("button", { name: /page actions/i });
    expect(trigger).not.toHaveAttribute("aria-disabled", "true");

    await user.click(trigger);
    expect(screen.getByRole("button", { name: /copy update/i })).toBeInTheDocument();
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

    it("shows empty-state copy when the project has no pages", async () => {
      const user = userEvent.setup();
      renderWith([]);

      await user.click(screen.getByRole("tab", { name: /tree view/i }));

      expect(screen.getByText("No pages found.")).toBeInTheDocument();
    });

    it("renders top-level URL nodes in tree mode", async () => {
      const user = userEvent.setup();
      renderWith([
        makePage({ url: "/microk8s", ext: ".dir", children: [] }),
        makePage({ url: "/mlops", ext: ".dir", children: [] }),
      ]);

      await user.click(screen.getByRole("tab", { name: /tree view/i }));

      expect(screen.getByText("canonical.com/microk8s")).toBeInTheDocument();
      expect(screen.getByText("canonical.com/mlops")).toBeInTheDocument();
    });

    it("real-page nodes open the webpage in a new tab on click", async () => {
      const user = userEvent.setup();
      const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
      renderWith([makePage({ url: "/page-1", ext: ".html", children: [] })]);

      await user.click(screen.getByRole("tab", { name: /tree view/i }));
      await user.click(screen.getByRole("button", { name: /canonical\.com\/page-1/ }));

      expect(openSpy).toHaveBeenCalledWith("/app/webpage/canonical.com/page-1", "_blank", "noopener,noreferrer");
      openSpy.mockRestore();
    });

    it(".dir nodes render as plain text, not as a link", async () => {
      const user = userEvent.setup();
      renderWith([makePage({ url: "/microk8s", ext: ".dir", children: [] })]);

      await user.click(screen.getByRole("tab", { name: /tree view/i }));

      expect(screen.queryByRole("button", { name: /^canonical\.com\/microk8s$/ })).not.toBeInTheDocument();
      expect(screen.getByText("canonical.com/microk8s")).toBeInTheDocument();
    });

    it("top-level nodes start collapsed; grandchildren are not in the DOM", async () => {
      const user = userEvent.setup();
      renderWith([
        makePage({
          url: "/microk8s",
          ext: ".dir",
          children: [makePage({ url: "/microk8s/features", ext: ".html", children: [] })],
        }),
      ]);

      await user.click(screen.getByRole("tab", { name: /tree view/i }));

      expect(screen.getByText("canonical.com/microk8s")).toBeInTheDocument();
      expect(screen.queryByText("canonical.com/microk8s/features")).not.toBeInTheDocument();
    });

    it("clicking the chevron expands a node and reveals its children", async () => {
      const user = userEvent.setup();
      renderWith([
        makePage({
          url: "/microk8s",
          ext: ".dir",
          children: [makePage({ url: "/microk8s/features", ext: ".html", children: [] })],
        }),
      ]);

      await user.click(screen.getByRole("tab", { name: /tree view/i }));
      await user.click(screen.getByRole("button", { name: /expand canonical\.com\/microk8s/i }));

      expect(screen.getByText("canonical.com/microk8s/features")).toBeInTheDocument();
      expect(screen.getByRole("treeitem", { expanded: true })).toBeInTheDocument();
    });

    it("clicking the chevron again collapses the node", async () => {
      const user = userEvent.setup();
      renderWith([
        makePage({
          url: "/microk8s",
          ext: ".dir",
          children: [makePage({ url: "/microk8s/features", ext: ".html", children: [] })],
        }),
      ]);

      await user.click(screen.getByRole("tab", { name: /tree view/i }));
      await user.click(screen.getByRole("button", { name: /expand canonical\.com\/microk8s/i }));
      await user.click(screen.getByRole("button", { name: /collapse canonical\.com\/microk8s/i }));

      expect(screen.queryByText("canonical.com/microk8s/features")).not.toBeInTheDocument();
    });

    it("pressing Enter on the chevron toggles expansion", async () => {
      const user = userEvent.setup();
      renderWith([
        makePage({
          url: "/microk8s",
          ext: ".dir",
          children: [makePage({ url: "/microk8s/features", ext: ".html", children: [] })],
        }),
      ]);

      await user.click(screen.getByRole("tab", { name: /tree view/i }));
      screen.getByRole("button", { name: /expand canonical\.com\/microk8s/i }).focus();
      await user.keyboard("{Enter}");

      expect(screen.getByText("canonical.com/microk8s/features")).toBeInTheDocument();
    });

    it("switching project unmounts the tree, dropping expansion state", async () => {
      const user = userEvent.setup();
      renderWith([
        makePage({
          url: "/microk8s",
          ext: ".dir",
          children: [makePage({ url: "/microk8s/features", ext: ".html", children: [] })],
        }),
      ]);

      await user.click(screen.getByRole("tab", { name: /tree view/i }));
      await user.click(screen.getByRole("button", { name: /expand canonical\.com\/microk8s/i }));
      expect(screen.getByText("canonical.com/microk8s/features")).toBeInTheDocument();

      // Switch to a project name that does not exist in the mocked projects list,
      // then back. Each setState changes the `key={activeProject}` on TreeView,
      // forcing an unmount/remount and dropping internal expansion state.
      await act(async () => {
        useViewsStore.setState({ activeProject: "other" });
      });
      await act(async () => {
        useViewsStore.setState({ activeProject: "canonical.com" });
      });

      expect(screen.queryByText("canonical.com/microk8s/features")).not.toBeInTheDocument();
    });
  });
});
