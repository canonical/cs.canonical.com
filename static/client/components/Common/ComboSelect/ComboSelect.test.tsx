import { render, screen, within } from "@testing-library/react";
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
      render(<ComboSelect onSelect={vi.fn()} options={options} placeholder="Pick a user" value={null} />);
      expect(screen.getByPlaceholderText("Pick a user")).toBeInTheDocument();
    });

    it("shows all options when input is focused", async () => {
      const user = userEvent.setup();
      render(<ComboSelect onSelect={vi.fn()} options={options} value={null} />);
      await user.click(screen.getByRole("textbox"));
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getAllByRole("option")).toHaveLength(4);
    });

    it("filters options as user types", async () => {
      const user = userEvent.setup();
      render(<ComboSelect onSelect={vi.fn()} options={options} value={null} />);
      await user.type(screen.getByRole("textbox"), "Al");
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getAllByRole("option")).toHaveLength(2);
    });

    it("selects an option and closes dropdown", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<ComboSelect onSelect={onSelect} options={options} value={null} />);
      await user.type(screen.getByRole("textbox"), "Ali");
      await user.click(screen.getAllByRole("option")[0]);
      expect(onSelect).toHaveBeenCalledWith(options[0]);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("displays selected value label in input", () => {
      render(<ComboSelect onSelect={vi.fn()} options={options} value={options[0]} />);
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
      render(<ComboSelect error="Required field" onSelect={vi.fn()} options={options} value={null} />);
      expect(screen.getByText("Required field")).toBeInTheDocument();
    });

    it("respects disabled prop", () => {
      render(<ComboSelect disabled onSelect={vi.fn()} options={options} value={null} />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("selected items show tick icon", async () => {
      const user = userEvent.setup();
      render(<ComboSelect onSelect={vi.fn()} options={options} value={options[0]} />);
      await user.click(screen.getByRole("textbox"));
      const selectedOption = screen.getByRole("option", { name: /Alice Johnson/ });
      expect(within(selectedOption).getByTestId("tick-icon")).toBeInTheDocument();
      const unselectedOption = screen.getByRole("option", { name: /Bob Smith/ });
      expect(within(unselectedOption).queryByTestId("tick-icon")).not.toBeInTheDocument();
    });

    it("chevron button toggles dropdown", async () => {
      const user = userEvent.setup();
      render(<ComboSelect onSelect={vi.fn()} options={options} value={null} />);
      const chevron = screen.getByRole("button", { name: "Toggle dropdown" });
      await user.click(chevron);
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      await user.click(chevron);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  describe("multi select", () => {
    it("selects multiple options and keeps dropdown open", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<ComboSelect multiple onSelect={onSelect} options={options} value={[]} />);
      await user.click(screen.getByRole("textbox"));
      await user.click(screen.getAllByRole("option")[0]);
      expect(onSelect).toHaveBeenCalledWith([options[0]]);
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("displays chips for multiple selected values", () => {
      render(<ComboSelect multiple onSelect={vi.fn()} options={options} value={[options[0], options[1]]} />);
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      expect(screen.getByText("Bob Smith")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveValue("");
    });

    it("chip dismiss removes item from selection", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<ComboSelect multiple onSelect={onSelect} options={options} value={[options[0], options[1]]} />);
      await user.click(screen.getByRole("button", { name: "Remove Alice Johnson" }));
      expect(onSelect).toHaveBeenCalledWith([options[1]]);
    });

    it("deselects an already-selected option", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<ComboSelect multiple onSelect={onSelect} options={options} value={[options[0]]} />);
      await user.click(screen.getByRole("textbox"));
      await user.click(screen.getAllByRole("option")[0]);
      expect(onSelect).toHaveBeenCalledWith([]);
    });
  });
});
