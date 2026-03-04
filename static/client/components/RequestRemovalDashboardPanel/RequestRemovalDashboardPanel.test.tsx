import { type ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import RequestRemovalDashboardPanel from "./RequestRemovalDashboardPanel";

import { usePanelsStore } from "@/store/app";

vi.mock("@/services/api/hooks/pages", () => ({
  usePages: () => ({ refetch: vi.fn() }),
}));

vi.mock("@/services/api/hooks/users", () => ({
  useUsers: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/services/api/services/pages", () => ({
  PagesServices: {
    requestRemoval: vi.fn(),
  },
}));

vi.mock("@/services/api/hooks/projects", () => ({
  useProjects: () => ({
    unfilteredProjects: [
      {
        name: "canonical.com",
        templates: {
          id: 0,
          name: "/",
          children: [
            {
              id: 100,
              name: "/cloud",
              title: "Cloud Computing",
              children: [],
              status: "AVAILABLE",
              copy_doc_link: "",
              owner: {
                id: 1,
                name: "Test User",
                email: "test@example.com",
                jobTitle: "Engineer",
                department: "Web",
                team: "Web",
                role: "user",
              },
              reviewers: [],
              jira_tasks: [],
              products: [],
              project: { id: 1, name: "canonical.com", created_at: "", updated_at: "" },
            },
          ],
          status: "AVAILABLE",
          copy_doc_link: "",
          owner: {
            id: 1,
            name: "Test User",
            email: "test@example.com",
            jobTitle: "Engineer",
            department: "Web",
            team: "Web",
            role: "user",
          },
          reviewers: [],
          jira_tasks: [],
          products: [],
        },
      },
    ],
    isLoading: false,
  }),
}));

const mockUser = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  jobTitle: "Engineer",
  department: "Web",
  team: "Web",
  role: "user",
};

vi.mock("@/store", () => ({
  useStore: (selector: (state: any) => any) =>
    selector({
      user: mockUser,
      selectedProject: {
        name: "test-project",
        templates: {
          id: 0,
          name: "/",
          children: [],
          status: "AVAILABLE",
          copy_doc_link: "",
          owner: mockUser,
          reviewers: [],
          jira_tasks: [],
          products: [],
        },
      },
      setSelectedProject: vi.fn(),
    }),
}));

const renderWithProviders = (children: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("RequestRemovalDashboardPanel", () => {
  beforeEach(() => {
    usePanelsStore.setState({ requestRemovalDashboardPanelVisible: true });
  });

  it("renders the trigger button", () => {
    renderWithProviders(<RequestRemovalDashboardPanel />);
    expect(screen.getByRole("button", { name: "Request removal" })).toBeInTheDocument();
  });

  it("shows step 1 with page picker when panel is open", () => {
    renderWithProviders(<RequestRemovalDashboardPanel />);
    expect(screen.getByText("Choose the page you want to remove")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by page title or URL")).toBeInTheDocument();
  });

  it("has Next button disabled when no page is selected", () => {
    renderWithProviders(<RequestRemovalDashboardPanel />);
    expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "true");
  });

  it("transitions to step 2 after selecting a page", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequestRemovalDashboardPanel />);

    const searchInput = screen.getByPlaceholderText("Search by page title or URL");
    await user.type(searchInput, "cloud");

    const option = screen.getByText("canonical.com/cloud");
    await user.click(option);

    // Selecting a page sets selectedPage, which makes isStep2 = true
    // Step 2 should show the removal form
    expect(screen.getByText(/will be permanently deleted/)).toBeInTheDocument();
    expect(screen.getByLabelText("2. Add a description (optional)")).toBeInTheDocument();
  });

  it("shows Back button in step 2", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequestRemovalDashboardPanel />);

    const searchInput = screen.getByPlaceholderText("Search by page title or URL");
    await user.type(searchInput, "cloud");
    await user.click(screen.getByText("canonical.com/cloud"));

    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("goes back to step 1 when Back button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequestRemovalDashboardPanel />);

    const searchInput = screen.getByPlaceholderText("Search by page title or URL");
    await user.type(searchInput, "cloud");
    await user.click(screen.getByText("canonical.com/cloud"));

    // Now in step 2
    expect(screen.getByText(/will be permanently deleted/)).toBeInTheDocument();

    // Click Back
    await user.click(screen.getByRole("button", { name: "Back" }));

    // Back to step 1
    expect(screen.getByText("Choose the page you want to remove")).toBeInTheDocument();
  });
});
