import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Search from "./Search";

interface Option {
  id: number;
  name: string;
}

const options: Option[] = [
  { id: 1, name: "alpha" },
  { id: 2, name: "alphabet" },
];

const renderSearch = (overrides: Partial<React.ComponentProps<typeof Search<Option>>> = {}) =>
  render(<Search<Option> onClear={vi.fn()} onSelect={vi.fn()} options={options} value={null} {...overrides} />);

describe("Search", () => {
  it("applies dropdownClassName to the dropdown element", () => {
    renderSearch({ dropdownClassName: "c-test-dropdown" });

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "alp" } });

    const dropdown = screen.getByRole("list");
    expect(dropdown).toHaveClass("l-search-dropdown");
    expect(dropdown).toHaveClass("c-test-dropdown");
  });

  it("renders the dropdown via portal as a body child, not inside the wrapper", () => {
    const { container } = renderSearch();

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "alp" } });

    const dropdown = screen.getByRole("list");
    // eslint-disable-next-line testing-library/no-container
    expect(container.contains(dropdown)).toBe(false);
    // eslint-disable-next-line testing-library/no-node-access
    expect(dropdown.parentElement).toBe(document.body);
  });

  it("emits position CSS custom properties as inline style", () => {
    renderSearch();
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    input.getBoundingClientRect = () =>
      ({
        bottom: 50,
        left: 20,
        right: 220,
        top: 30,
        width: 200,
        height: 20,
        x: 20,
        y: 30,
        toJSON: () => ({}),
      }) as DOMRect;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1000 });

    fireEvent.change(input, { target: { value: "alp" } });

    const dropdown = screen.getByRole("list");
    expect(dropdown.style.getPropertyValue("--search-dropdown-top")).toBe("50px");
    expect(dropdown.style.getPropertyValue("--search-dropdown-left")).toBe("20px");
    expect(dropdown.style.getPropertyValue("--search-dropdown-input-right")).toBe("780px");
    expect(dropdown.style.getPropertyValue("--search-dropdown-width")).toBe("200px");
  });
});
