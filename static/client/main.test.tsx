/* eslint-disable testing-library/no-node-access */
import { act } from "react";

import { waitFor } from "@testing-library/react";

describe("main", () => {
  beforeAll(() => {
    const rootElement = document.createElement("div");
    rootElement.setAttribute("id", "root");
    document.body.appendChild(rootElement);
  });

  it("renders the app in the root element", async () => {
    await act(() => dynamicImport("./main"));
    const container = document.getElementById("root") as HTMLElement;
    await waitFor(() => expect(container.querySelector(".l-application")).toBeInTheDocument());
  });
});

// Helper function to dynamically import a module
async function dynamicImport(modulePath: string) {
  return import(modulePath);
}
