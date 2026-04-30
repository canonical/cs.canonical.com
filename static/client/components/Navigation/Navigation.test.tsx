import { type ReactNode } from "react";

import { render, screen } from "@testing-library/react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import type * as ReactRouterDom from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Navigation from "./Navigation";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const setMatchMediaMatches = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
};

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
  setMatchMediaMatches(false);
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
});
