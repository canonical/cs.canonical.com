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
});
