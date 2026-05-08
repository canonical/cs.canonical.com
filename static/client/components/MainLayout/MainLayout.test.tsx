import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";

import MainLayout from "./MainLayout";

function renderAt(path: string) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]} key="testkey">
        <MainLayout />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MainLayout", () => {
  it("renders side navigation", async () => {
    renderAt("/app");
    await waitFor(() => expect(screen.getByRole("navigation")).toBeInTheDocument());
  });

  it("applies u-no-padding to <main> on /app/views/table", async () => {
    renderAt("/app/views/table");
    await waitFor(() => expect(screen.getByRole("navigation")).toBeInTheDocument());
    const main = screen.getByRole("main");
    expect(main).toHaveClass("l-main");
    expect(main).toHaveClass("u-no-padding");
  });

  it("does not apply u-no-padding to <main> on other routes", async () => {
    renderAt("/app");
    await waitFor(() => expect(screen.getByRole("navigation")).toBeInTheDocument());
    const main = screen.getByRole("main");
    expect(main).toHaveClass("l-main");
    expect(main).not.toHaveClass("u-no-padding");
  });
});
