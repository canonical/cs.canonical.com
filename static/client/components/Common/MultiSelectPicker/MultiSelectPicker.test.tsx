import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MultiSelectPicker from ".";

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

describe("MultiSelectPicker", () => {
  it("renders with placeholder when no items selected", () => {
    render(<MultiSelectPicker onSelect={vi.fn()} options={options} placeholder="Additional contributors" value={[]} />);
    expect(screen.getByText("Additional contributors")).toBeInTheDocument();
  });

  it("shows display text with selected item names when collapsed", () => {
    render(<MultiSelectPicker onSelect={vi.fn()} options={options} value={[options[0], options[1]]} />);
    expect(screen.getByText(/Alice Johnson/)).toBeInTheDocument();
    expect(screen.getByText(/Bob Smith/)).toBeInTheDocument();
  });

  it("opens dropdown on click", async () => {
    const user = userEvent.setup();
    render(<MultiSelectPicker onSelect={vi.fn()} options={options} value={[]} />);
    await user.click(screen.getByText("Select..."));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("shows chips when open with selections", async () => {
    const user = userEvent.setup();
    render(<MultiSelectPicker onSelect={vi.fn()} options={options} value={[options[0], options[1]]} />);
    await user.click(screen.getByText(/Alice Johnson/));
    // Now open, should show chips
    expect(screen.getByRole("button", { name: "Remove Alice Johnson" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Bob Smith" })).toBeInTheDocument();
  });

  it("filters dropdown options when typing", async () => {
    const user = userEvent.setup();
    render(<MultiSelectPicker onSelect={vi.fn()} options={options} value={[]} />);
    await user.click(screen.getByText("Select..."));
    await user.type(screen.getByRole("searchbox"), "Ali");
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("selected items appear at top of dropdown sorted alphabetically", async () => {
    const user = userEvent.setup();
    // Select Charlie and Alice — alphabetically Alice should be first in the pinned section
    render(<MultiSelectPicker onSelect={vi.fn()} options={options} value={[options[2], options[0]]} />);
    await user.click(screen.getByText(/Alice Johnson/));
    const opts = screen.getAllByRole("option");
    // First two should be the selected ones (alphabetical): Alice Johnson, Charlie Brown
    expect(opts[0]).toHaveTextContent("Alice Johnson");
    expect(opts[1]).toHaveTextContent("Charlie Brown");
  });

  it("clicking a checkbox adds item to selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MultiSelectPicker onSelect={onSelect} options={options} value={[]} />);
    await user.click(screen.getByText("Select..."));
    await user.click(screen.getAllByRole("option")[0]);
    expect(onSelect).toHaveBeenCalledWith([options[0]]);
  });

  it("clicking a selected checkbox removes item", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MultiSelectPicker onSelect={onSelect} options={options} value={[options[0]]} />);
    await user.click(screen.getByText(/Alice Johnson/));
    // Click the selected option in dropdown to deselect
    await user.click(screen.getByRole("option", { name: /Alice Johnson/ }));
    expect(onSelect).toHaveBeenCalledWith([]);
  });

  it("clicking chip dismiss removes item from selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MultiSelectPicker onSelect={onSelect} options={options} value={[options[0], options[1]]} />);
    await user.click(screen.getByText(/Alice Johnson/));
    await user.click(screen.getByRole("button", { name: "Remove Alice Johnson" }));
    expect(onSelect).toHaveBeenCalledWith([options[1]]);
  });

  it("dropdown stays open after selection changes", async () => {
    const user = userEvent.setup();
    render(<MultiSelectPicker onSelect={vi.fn()} options={options} value={[]} />);
    await user.click(screen.getByText("Select..."));
    await user.click(screen.getAllByRole("option")[0]);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("renders error state with message", () => {
    render(<MultiSelectPicker error="Required field" onSelect={vi.fn()} options={options} value={[]} />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("respects disabled prop", async () => {
    const user = userEvent.setup();
    render(<MultiSelectPicker disabled onSelect={vi.fn()} options={options} value={[]} />);
    await user.click(screen.getByText("Select..."));
    // Should not open the dropdown
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("displays chips in alphabetical order when open", async () => {
    const user = userEvent.setup();
    // Select in non-alphabetical order: Charlie, Alice
    render(<MultiSelectPicker onSelect={vi.fn()} options={options} value={[options[2], options[0]]} />);
    await user.click(screen.getByText(/Alice Johnson/));
    const chips = screen.getAllByRole("button", { name: /Remove/ });
    expect(chips[0]).toHaveAccessibleName("Remove Alice Johnson");
    expect(chips[1]).toHaveAccessibleName("Remove Charlie Brown");
  });

  it("chips append new selections at end while open", async () => {
    const user = userEvent.setup();
    let currentValue = [options[2]]; // Charlie Brown
    const onSelect = vi.fn((newValue) => {
      currentValue = newValue;
    });
    const { rerender } = render(<MultiSelectPicker onSelect={onSelect} options={options} value={currentValue} />);
    // Open the picker
    await user.click(screen.getByText(/Charlie Brown/));
    // Select Alice Johnson (alphabetically before Charlie)
    await user.click(screen.getByRole("option", { name: /Alice Johnson/ }));
    // Rerender with updated value
    rerender(<MultiSelectPicker onSelect={onSelect} options={options} value={currentValue} />);
    const chips = screen.getAllByRole("button", { name: /Remove/ });
    // Charlie was committed first, Alice was added after — Alice should appear at end
    expect(chips[0]).toHaveAccessibleName("Remove Charlie Brown");
    expect(chips[1]).toHaveAccessibleName("Remove Alice Johnson");
  });

  it("chips re-sort alphabetically on close and reopen", async () => {
    const user = userEvent.setup();
    let currentValue: TestOption[] = [];
    const onSelect = vi.fn((newValue) => {
      currentValue = newValue;
    });
    const { rerender } = render(<MultiSelectPicker onSelect={onSelect} options={options} value={currentValue} />);
    // Open
    await user.click(screen.getByText("Select..."));
    // Select Charlie then Alice (non-alphabetical)
    await user.click(screen.getByRole("option", { name: /Charlie Brown/ }));
    rerender(<MultiSelectPicker onSelect={onSelect} options={options} value={currentValue} />);
    await user.click(screen.getByRole("option", { name: /Alice Johnson/ }));
    rerender(<MultiSelectPicker onSelect={onSelect} options={options} value={currentValue} />);
    // Close via chevron
    await user.click(screen.getByRole("button", { name: "Toggle dropdown" }));
    rerender(<MultiSelectPicker onSelect={onSelect} options={options} value={currentValue} />);
    // Reopen via chevron
    await user.click(screen.getByRole("button", { name: "Toggle dropdown" }));
    const chips = screen.getAllByRole("button", { name: /Remove/ });
    // After close+reopen, chips should be alphabetical
    expect(chips[0]).toHaveAccessibleName("Remove Alice Johnson");
    expect(chips[1]).toHaveAccessibleName("Remove Charlie Brown");
  });

  it("dropdown order is frozen while open", async () => {
    const user = userEvent.setup();
    let currentValue = [options[0]]; // Alice Johnson selected
    const onSelect = vi.fn((newValue) => {
      currentValue = newValue;
    });
    const { rerender } = render(<MultiSelectPicker onSelect={onSelect} options={options} value={currentValue} />);
    // Open
    await user.click(screen.getByText(/Alice Johnson/));
    const optsBefore = screen.getAllByRole("option").map((el) => el.textContent);
    // Toggle Bob Smith (currently unselected)
    await user.click(screen.getByRole("option", { name: /Bob Smith/ }));
    rerender(<MultiSelectPicker onSelect={onSelect} options={options} value={currentValue} />);
    const optsAfter = screen.getAllByRole("option").map((el) => el.textContent);
    // Order should not change
    expect(optsBefore).toEqual(optsAfter);
  });
});
