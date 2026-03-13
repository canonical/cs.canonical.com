import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ComboSelect from ".";

interface TestOption {
  id: number;
  name: string;
}

const options: TestOption[] = [
  { id: 1, name: "Alice Johnson" },
  { id: 2, name: "Bob Smith" },
  { id: 3, name: "Charlie Brown" },
  { id: 4, name: "Alice Williams" },
];

describe("ComboSelect", () => {
  describe("single select", () => {
    it("renders with placeholder when no value", () => {
      render(
        <ComboSelect options={options} onSelect={vi.fn()} placeholder="Pick a user" value={null} />,
      );
      expect(screen.getByPlaceholderText("Pick a user")).toBeInTheDocument();
    });

    it("does not show dropdown when input has fewer than 3 characters", async () => {
      const user = userEvent.setup();
      render(<ComboSelect options={options} onSelect={vi.fn()} value={null} />);
      await user.type(screen.getByRole("textbox"), "Al");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("filters and shows dropdown at 3+ characters", async () => {
      const user = userEvent.setup();
      render(<ComboSelect options={options} onSelect={vi.fn()} value={null} />);
      await user.type(screen.getByRole("textbox"), "Ali");
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getAllByRole("option")).toHaveLength(2);
    });

    it("selects an option and closes dropdown", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<ComboSelect options={options} onSelect={onSelect} value={null} />);
      await user.type(screen.getByRole("textbox"), "Ali");
      await user.click(screen.getAllByRole("option")[0]);
      expect(onSelect).toHaveBeenCalledWith(options[0]);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("displays selected value label in input", () => {
      render(<ComboSelect options={options} onSelect={vi.fn()} value={options[0]} />);
      expect(screen.getByRole("textbox")).toHaveValue("Alice Johnson");
    });

    it("calls onClear when clearing single value", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(<ComboSelect onClear={onClear} onSelect={vi.fn()} options={options} value={options[0]} />);
      await user.clear(screen.getByRole("textbox"));
      expect(onClear).toHaveBeenCalled();
    });

    it("renders error state with message", () => {
      render(
        <ComboSelect error="Required field" onSelect={vi.fn()} options={options} value={null} />,
      );
      expect(screen.getByText("Required field")).toBeInTheDocument();
    });

    it("respects disabled prop", () => {
      render(<ComboSelect disabled onSelect={vi.fn()} options={options} value={null} />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });
  });
});
