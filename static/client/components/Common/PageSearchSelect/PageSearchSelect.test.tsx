import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PageSearchSelect from ".";

type TestOption = { id: number; name: string; title: string };

const options: TestOption[] = [
  { id: 1, name: "canonical.com/juju", title: "Automate software operations" },
  { id: 2, name: "canonical.com/juju/docs", title: "Juju documentation" },
  { id: 3, name: "ubuntu.com/blog", title: "Ubuntu blog" },
];

const defaultProps = {
  options,
  value: null as TestOption | null,
  onSelect: vi.fn(),
  onClear: vi.fn(),
  placeholder: "Search by page title or URL",
};

describe("PageSearchSelect", () => {
  it("renders input with placeholder when no value", () => {
    render(<PageSearchSelect {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search by page title or URL")).toBeInTheDocument();
  });

  it("does not show dropdown when typing fewer than 3 characters", async () => {
    const user = userEvent.setup();
    render(<PageSearchSelect {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Search by page title or URL"), "ju");
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("filters and shows dropdown on typing 3+ chars", async () => {
    const user = userEvent.setup();
    render(<PageSearchSelect {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Search by page title or URL"), "juju");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.getByText((_, el) => el?.textContent === "canonical.com/juju - Automate software operations"),
    ).toBeInTheDocument();
  });

  it("calls onSelect on item click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PageSearchSelect {...defaultProps} onSelect={onSelect} />);

    await user.type(screen.getByPlaceholderText("Search by page title or URL"), "juju");
    await user.click(screen.getAllByRole("listitem")[0]);

    expect(onSelect).toHaveBeenCalledWith(options[0]);
  });

  it("shows selected value in input when value prop is set", () => {
    render(<PageSearchSelect {...defaultProps} value={options[0]} />);
    const input = screen.getByDisplayValue("canonical.com/juju - Automate software operations");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("readOnly");
  });

  it("calls onClear when clear button is clicked", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<PageSearchSelect {...defaultProps} onClear={onClear} value={options[0]} />);

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(onClear).toHaveBeenCalled();
  });

  it("shows error message when error prop provided", () => {
    render(<PageSearchSelect {...defaultProps} error="This is a required field" />);
    expect(screen.getByText("This is a required field")).toBeInTheDocument();
  });

  it("closes dropdown on blur", async () => {
    const user = userEvent.setup();
    render(<PageSearchSelect {...defaultProps} />);

    const input = screen.getByPlaceholderText("Search by page title or URL");
    await user.type(input, "juju");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    await user.click(document.body);
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
