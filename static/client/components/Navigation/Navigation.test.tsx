import { type ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import type * as ReactRouterDom from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Navigation from "./Navigation";

import { useViewsStore } from "@/store/views";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithQuery = (children: ReactNode) => {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
};

const renderNav = () =>
  renderWithQuery(
    <MemoryRouter initialEntries={[{ pathname: "/", key: "testKey" }]}>
      <Navigation />
    </MemoryRouter>,
  );

beforeEach(() => {
  mockNavigate.mockClear();
  useViewsStore.setState({ activeProject: "" });
});

describe("Navigation", () => {
  it("displays navigation", () => {
    renderNav();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("is collapsed by default", () => {
    renderNav();
    expect(screen.getByRole("navigation")).toHaveClass("is-collapsed");
  });

  it("clicking the desktop Full site view row navigates to /app/views/table", async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByTestId("nav-link-full-site-view-desktop"));

    expect(mockNavigate).toHaveBeenCalledWith("/app/views/table");
  });

  it("clicking the mobile Full site view row drills instead of navigating", async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole("button", { name: /open project list/i }));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /back to main navigation/i })).toBeInTheDocument();
  });

  it("clicking the back row returns to the top-level nav", async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole("button", { name: /open project list/i }));
    await user.click(screen.getByRole("button", { name: /back to main navigation/i }));

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /back to main navigation/i })).not.toBeInTheDocument();
  });

  it("selecting a project navigates, sets activeProject, and closes the drawer", async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole("button", { name: /open project list/i }));
    await user.click(screen.getByRole("button", { name: "canonical.com" }));

    expect(mockNavigate).toHaveBeenCalledWith("/app/views/table");
    expect(useViewsStore.getState().activeProject).toBe("canonical.com");
    expect(screen.getByRole("navigation")).toHaveClass("is-collapsed");
  });

  it("the active project is marked with is-active in the sub-list", async () => {
    const user = userEvent.setup();
    useViewsStore.setState({ activeProject: "ubuntu.com" });
    renderNav();

    await user.click(screen.getByRole("button", { name: /open project list/i }));

    const ubuntuRow = screen.getByRole("button", { name: "ubuntu.com" });
    expect(ubuntuRow).toHaveClass("is-active");
    expect(screen.getByRole("button", { name: "canonical.com" })).not.toHaveClass("is-active");
  });

  it("closing the drawer while drilled resets the drill state", async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole("button", { name: /^menu$/i }));
    await user.click(screen.getByRole("button", { name: /open project list/i }));
    await user.click(screen.getByRole("button", { name: /^menu$/i }));
    await user.click(screen.getByRole("button", { name: /^menu$/i }));

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /back to main navigation/i })).not.toBeInTheDocument();
  });

  it("when drilled, the navigation gets the drilled class so CSS can hide the top-list and search", async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole("button", { name: /open project list/i }));

    expect(screen.getByRole("navigation")).toHaveClass("l-navigation--drilled");
  });
});
