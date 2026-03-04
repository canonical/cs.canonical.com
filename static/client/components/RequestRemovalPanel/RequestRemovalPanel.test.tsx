import { type ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import RequestRemovalPanel from "./RequestRemovalPanel";

import type { IPage } from "@/services/api/types/pages";
import { PageStatus } from "@/services/api/types/pages";
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
    data: [
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

const makeWebpage = (overrides: Partial<IPage> = {}): IPage => ({
  id: 10,
  name: "/test-page",
  copy_doc_link: "",
  owner: mockUser,
  reviewers: [],
  status: PageStatus.AVAILABLE,
  jira_tasks: [],
  children: [],
  products: [],
  ...overrides,
});

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

describe("RequestRemovalPanel", () => {
  beforeEach(() => {
    // Open the panel before each test
    usePanelsStore.setState({ requestRemovalPanelVisible: true });
  });

  it("renders with the correct title", () => {
    renderWithProviders(<RequestRemovalPanel webpage={makeWebpage()} />);

    expect(screen.getByRole("heading", { name: /Remove page/ })).toBeInTheDocument();
  });

  it("shows redirect, due date, and description fields for non-NEW pages", () => {
    renderWithProviders(<RequestRemovalPanel webpage={makeWebpage({ status: PageStatus.AVAILABLE })} />);

    expect(screen.getByText("1. Assign a page to redirect to")).toBeInTheDocument();
    expect(screen.getByLabelText("3. Request a preferred delivery date")).toBeInTheDocument();
    expect(screen.getByLabelText("2. Add a description (optional)")).toBeInTheDocument();
  });

  it("does not render redirect field for NEW pages", () => {
    renderWithProviders(<RequestRemovalPanel webpage={makeWebpage({ status: PageStatus.NEW })} />);

    expect(screen.queryByText("1. Assign a page to redirect to")).not.toBeInTheDocument();
    expect(screen.getByLabelText("2. Add a description (optional)")).toBeInTheDocument();
  });

  it("shows validation errors when required fields are empty for non-NEW pages", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequestRemovalPanel webpage={makeWebpage({ status: PageStatus.AVAILABLE })} />);

    const submitButton = screen.getByRole("button", { name: "Remove page" });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    const errorMessages = screen.getAllByText("This is a required field");
    expect(errorMessages).toHaveLength(2);
  });

  it("clears redirect error when a redirect page is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequestRemovalPanel webpage={makeWebpage({ status: PageStatus.AVAILABLE })} />);

    const submitButton = screen.getByRole("button", { name: "Remove page" });
    await user.click(submitButton);

    expect(screen.getAllByText("This is a required field")).toHaveLength(2);

    const searchInput = screen.getByPlaceholderText("Search by page title or URL");
    await user.type(searchInput, "cloud");

    const option = screen.getByText("canonical.com/cloud");
    await user.click(option);

    const errorMessages = screen.getAllByText("This is a required field");
    expect(errorMessages).toHaveLength(1);
  });

  it("opens confirmation modal when all required fields are filled", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RequestRemovalPanel
        webpage={makeWebpage({
          status: PageStatus.AVAILABLE,
          name: "/test-page",
          project: { id: 1, name: "canonical.com", created_at: "", updated_at: "" },
        })}
      />,
    );

    const searchInput = screen.getByPlaceholderText("Search by page title or URL");
    await user.type(searchInput, "cloud");
    const option = screen.getByText("canonical.com/cloud");
    await user.click(option);

    const dateInput = screen.getByLabelText("3. Request a preferred delivery date");
    await user.type(dateInput, "2026-04-01");

    const submitButton = screen.getByRole("button", { name: "Remove page" });
    await user.click(submitButton);

    expect(screen.getByText("Remove canonical.com/test-page?")).toBeInTheDocument();
  });

  it("has submit button enabled for NEW pages without filling required fields", () => {
    renderWithProviders(<RequestRemovalPanel webpage={makeWebpage({ status: PageStatus.NEW })} />);

    const submitButton = screen.getByRole("button", { name: "Remove page" });
    expect(submitButton).toBeEnabled();
  });

  it("shows confirmation modal when submit button is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RequestRemovalPanel
        webpage={makeWebpage({
          status: PageStatus.NEW,
          name: "/new-page",
          project: { id: 1, name: "canonical.com", created_at: "", updated_at: "" },
        })}
      />,
    );

    const submitButton = screen.getByRole("button", { name: "Remove page" });
    await user.click(submitButton);

    expect(screen.getByText("Remove canonical.com/new-page?")).toBeInTheDocument();
    expect(screen.getByText(/Once it is removed from the website/)).toBeInTheDocument();
  });

  it("filters redirect options when searching by URL", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequestRemovalPanel webpage={makeWebpage()} />);

    const searchInput = screen.getByPlaceholderText("Search by page title or URL");
    await user.type(searchInput, "cloud");

    expect(screen.getByText("canonical.com/cloud")).toBeInTheDocument();
  });

  it("filters redirect options when searching by title", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequestRemovalPanel webpage={makeWebpage()} />);

    const searchInput = screen.getByPlaceholderText("Search by page title or URL");
    await user.type(searchInput, "Cloud Computing");

    expect(screen.getByText("canonical.com/cloud")).toBeInTheDocument();
  });
});
