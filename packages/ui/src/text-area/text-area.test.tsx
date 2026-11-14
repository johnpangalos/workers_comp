import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { TextArea } from "./text-area";

// These tests cover behaviour and the attributes and classes the styles select on.
// What those look like is checked in a real browser (the playground, tests/text-area.figma.spec.ts).

describe("TextArea", () => {
  it("renders a native textarea named by its label", () => {
    render(<TextArea label="Injury description" placeholder="What happened?" />);
    const textarea = screen.getByRole("textbox", { name: "Injury description" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("placeholder", "What happened?");
    expect(textarea).toHaveClass(
      "m-0",
      "box-border",
      "block",
      "min-h-24",
      "w-full",
      "resize-none",
      "appearance-none",
      "rounded-md",
      "border",
      "border-solid",
      "border-gray-400",
      "bg-white",
      "px-3",
      "py-2",
      "font-sans",
      "text-sm",
      "font-normal",
      "text-gray-900",
      "transition-colors",
      "outline-none",
      "placeholder:text-gray-500",
    );
    // Every state selects on comp0's data attributes, and the placeholder colours the control.
    expect(textarea).toHaveClass(
      "not-data-disabled:placeholder-shown:text-gray-500",
      "not-data-disabled:data-invalid:border-red-600",
      "data-disabled:pointer-events-none",
      "data-disabled:border-gray-200",
      "data-disabled:bg-gray-100",
      "data-disabled:text-gray-400",
      "data-disabled:placeholder:text-gray-400",
      "data-focus-visible:ring-2",
      "data-focus-visible:ring-fuchsia-600",
      "data-focus-visible:ring-offset-2",
      "not-data-invalid:data-hovered:border-gray-500",
    );
    // Those and nothing else.
    expect(textarea.classList).toHaveLength(32);
    // Theme utilities only: no arbitrary value (`w-[137px]`) in what renders.
    expect(textarea.className).not.toMatch(/\[/);
  });

  it("describes the textarea with its description", () => {
    render(<TextArea label="Injury description" description="Say when, where and how it happened." />);
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription("Say when, where and how it happened.");
  });

  it("shows the error message only while invalid, announced and describing the textarea", () => {
    const { rerender } = render(
      <TextArea label="Injury description" description="Say how." errorMessage="Describe the injury." />,
    );
    const textarea = screen.getByRole("textbox");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText("Describe the injury.")).toBeNull();
    expect(textarea).not.toHaveAttribute("aria-invalid");
    expect(textarea).not.toHaveAttribute("data-invalid");

    rerender(
      <TextArea
        label="Injury description"
        description="Say how."
        errorMessage="Describe the injury."
        invalid
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Describe the injury.");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("data-invalid");
    expect(textarea).toHaveAccessibleDescription("Say how. Describe the injury.");
  });

  it("is reachable with Tab, and Enter and Space type into it as in a native textarea", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: string) => void>();
    render(<TextArea label="Notes" onChange={(event) => onChange(event.currentTarget.value)} />);
    await user.tab();
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveFocus();
    await user.keyboard("Slipped{Enter}on ice");
    expect(textarea).toHaveValue("Slipped\non ice");
    expect(onChange).toHaveBeenLastCalledWith("Slipped\non ice");
  });

  it("reports keyboard focus as data-focus-visible, the attribute the focus ring selects on", async () => {
    const user = userEvent.setup();
    render(<TextArea label="Notes" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).not.toHaveAttribute("data-focus-visible");
    await user.tab();
    expect(textarea).toHaveAttribute("data-focus-visible");
    await user.tab();
    expect(textarea).not.toHaveAttribute("data-focus-visible");
  });

  it("reports hover as data-hovered, the attribute the hover styles select on", async () => {
    const user = userEvent.setup();
    render(<TextArea label="Notes" />);
    const textarea = screen.getByRole("textbox");
    await user.hover(textarea);
    expect(textarea).toHaveAttribute("data-hovered");
    await user.unhover(textarea);
    expect(textarea).not.toHaveAttribute("data-hovered");
  });

  it("can't be focused, typed into or hovered when disabled, and fires nothing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<() => void>();
    const onFocus = vi.fn<() => void>();
    render(<TextArea label="Notes" disabled onChange={onChange} onFocus={onFocus} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("data-disabled");
    await user.tab();
    expect(textarea).not.toHaveFocus();
    await user.click(textarea);
    await user.keyboard("typed");
    await user.hover(textarea);
    expect(textarea).toHaveValue("");
    expect(textarea).not.toHaveAttribute("data-hovered");
    expect(onChange).not.toHaveBeenCalled();
    expect(onFocus).not.toHaveBeenCalled();
  });

  it("works controlled, with value and onChange", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("Hurt my ");
      return (
        <>
          <TextArea
            label="Notes"
            value={value}
            onChange={(event) => setValue(event.currentTarget.value.toUpperCase())}
          />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.keyboard("back");
    expect(textarea).toHaveValue("HURT MY BACK");
    expect(screen.getByRole("status")).toHaveTextContent("HURT MY BACK");
  });

  it("passes native props to the textarea and marks it required", () => {
    render(<TextArea label="Notes" name="notes" rows={8} required id="notes" defaultValue="Hello" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("name", "notes");
    expect(textarea).toHaveAttribute("rows", "8");
    expect(textarea).toHaveAttribute("id", "notes");
    expect(textarea).toBeRequired();
    expect(textarea).toHaveValue("Hello");
  });

  it("appends className to the field's own classes", () => {
    const { container } = render(<TextArea label="Notes" className="w-full" />);
    const field = container.firstElementChild!;
    expect(field).toHaveClass(
      "flex",
      "flex-col",
      "gap-1.5",
      "font-sans",
      "text-sm",
      "font-medium",
      "text-gray-900",
    );
    // The field's seven and the consumer's, nothing of the textarea's.
    expect(field.classList).toHaveLength(8);
    // Last and as given, so it isn't scoped and a consumer's utilities override the field's.
    expect(field.getAttribute("class")).toMatch(/ w-full$/);
    expect(field.className).not.toMatch(/\[/);
    expect(field).toContainElement(screen.getByRole("textbox"));
  });
});
