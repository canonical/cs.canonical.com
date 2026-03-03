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
      selectedProject: { name: "test-project", templates: { id: 0, name: "/", children: [], status: "AVAILABLE", copy_doc_link: "", owner: mockUser, reviewers: [], jira_tasks: [], products: [] } },
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
      <MemoryRouter>
        {children}
      </MemoryRouter>
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

    expect(screen.getByText("Request page removal")).toBeInTheDocument();
  });

  it("shows redirect, due date, and description fields for non-NEW pages", () => {
    renderWithProviders(
      <RequestRemovalPanel webpage={makeWebpage({ status: PageStatus.AVAILABLE })} />,
    );

    expect(screen.getByText("Redirect to")).toBeInTheDocument();
    expect(screen.getByLabelText("Due date")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("does not render redirect field for NEW pages", () => {
    renderWithProviders(
      <RequestRemovalPanel webpage={makeWebpage({ status: PageStatus.NEW })} />,
    );

    expect(screen.queryByText("Redirect to")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("has submit button disabled when required fields are empty for non-NEW pages", () => {
    renderWithProviders(
      <RequestRemovalPanel webpage={makeWebpage({ status: PageStatus.AVAILABLE })} />,
    );

    const submitButton = screen.getByRole("button", { name: "Remove page" });
    expect(submitButton).toBeDisabled();
  });

  it("has submit button enabled for NEW pages without filling required fields", () => {
    renderWithProviders(
      <RequestRemovalPanel webpage={makeWebpage({ status: PageStatus.NEW })} />,
    );

    const submitButton = screen.getByRole("button", { name: "Remove page" });
    expect(submitButton).toBeEnabled();
  });

  it("shows confirmation modal when submit button is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RequestRemovalPanel webpage={makeWebpage({ status: PageStatus.NEW, name: "/new-page" })} />,
    );

    const submitButton = screen.getByRole("button", { name: "Remove page" });
    await user.click(submitButton);

    expect(screen.getByText("Confirm page removal")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to request removal of/)).toBeInTheDocument();
    expect(screen.getByText("/new-page")).toBeInTheDocument();
  });
});
