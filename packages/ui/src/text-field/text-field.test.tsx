import { createRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TextField, textFieldClassName, textFieldInputClassName } from "./text-field";

// These tests cover behaviour and the data attributes the styles select on.
// What those attributes look like is checked in a real browser (the playground's Figma spec).

describe("TextField", () => {
  it("renders a text input named by its label", () => {
    render(<TextField label="Email" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.tagName).toBe("INPUT");
    expect(screen.getByText("Email").tagName).toBe("LABEL");
  });

  it("is described by its description", () => {
    render(<TextField label="Email" description="We'll send updates about your claim here." />);
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "We'll send updates about your claim here.",
    );
  });

  it("shows the error message only while invalid, as an alert that describes the input", () => {
    const field = (invalid: boolean) => (
      <TextField
        label="Email"
        description="Help"
        errorMessage="Enter a valid email address."
        invalid={invalid}
      />
    );
    const { rerender } = render(field(false));
    expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("textbox")).not.toHaveAttribute("data-invalid");

    rerender(field(true));
    const input = screen.getByRole("textbox");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("data-invalid", "");
    expect(input).toHaveAccessibleDescription("Help Enter a valid email address.");
  });

  it("passes the input props through: name, type, placeholder, autoComplete and ref", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <TextField
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        ref={ref}
      />,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("placeholder", "you@example.com");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(ref.current).toBe(input);
  });

  it("uses id for the input", () => {
    render(<TextField label="Email" id="claimant-email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "claimant-email");
  });

  it("required makes the input required", () => {
    render(<TextField label="Email" required />);
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("is uncontrolled with defaultValue and calls onChange with each value typed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: string) => void>();
    render(<TextField label="Name" defaultValue="Jo" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Jo");
    await user.type(input, "y");
    expect(input).toHaveValue("Joy");
    expect(onChange).toHaveBeenLastCalledWith("Joy");
  });

  it("is controlled with value and onChange", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <>
          <TextField label="Name" value={value} onChange={(next) => setValue(next.toUpperCase())} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.type(screen.getByRole("textbox"), "ab");
    expect(screen.getByRole("textbox")).toHaveValue("AB");
    expect(screen.getByRole("status")).toHaveTextContent("AB");
  });

  it("a controlled value without onChange stays as it is", async () => {
    const user = userEvent.setup();
    render(<TextField label="Name" value="Fixed" />);
    await user.type(screen.getByRole("textbox"), "x");
    expect(screen.getByRole("textbox")).toHaveValue("Fixed");
  });

  it("is reached by Tab, which shows the focus ring", async () => {
    const user = userEvent.setup();
    render(<TextField label="Email" />);
    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("data-focus-visible");
    await user.tab();
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("data-focus-visible", "");
    await user.tab();
    expect(input).not.toHaveFocus();
    expect(input).not.toHaveAttribute("data-focus-visible");
  });

  it("a click on the label focuses the input", async () => {
    const user = userEvent.setup();
    render(<TextField label="Email" />);
    await user.click(screen.getByText("Email"));
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("Enter in the input submits its form, as a native input does", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(event: SubmitEvent) => void>((event) => event.preventDefault());
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <TextField label="Email" name="email" />
        <button type="submit">Send</button>
      </form>,
    );
    await user.type(screen.getByRole("textbox"), "a{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("reports hover as data-hovered", async () => {
    const user = userEvent.setup();
    render(<TextField label="Email" />);
    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("data-hovered");
    await user.hover(input);
    expect(input).toHaveAttribute("data-hovered");
  });

  it("when disabled: the input is disabled, can't be focused, typed in or hovered, and onChange never fires", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: string) => void>();
    render(<TextField label="Email" disabled defaultValue="" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("data-disabled", "");
    await user.tab();
    expect(input).not.toHaveFocus();
    await user.hover(input);
    expect(input).not.toHaveAttribute("data-hovered");
    await user.type(input, "abc");
    expect(input).toHaveValue("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("appends className to the outer column, after its own", () => {
    const { container } = render(<TextField label="Email" className="w-full" />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("class", `${textFieldClassName} w-full`);
    expect(screen.getByRole("textbox")).toHaveAttribute("class", textFieldInputClassName);
  });

  it.each([
    ["the column", "flex-col"],
    ["the Figma width", "w-80"],
    ["the gap between label, input and messages", "gap-1.5"],
  ])("textFieldClassName has %s", (_, expected) => {
    expect(textFieldClassName.split(/\s+/)).toContain(expected);
  });

  it.each([
    ["an always-on border", "border"],
    ["the border colour", "border-gray-400"],
    ["the padding", "px-3"],
    ["the vertical padding", "py-2"],
    ["the placeholder colour", "placeholder:text-gray-500"],
    ["the hover border, except when invalid", "not-data-invalid:data-hovered:border-gray-500"],
    ["the invalid border, except when disabled", "not-data-disabled:data-invalid:border-red-600"],
    ["the disabled fill", "data-disabled:bg-gray-100"],
    ["the disabled border", "data-disabled:border-gray-200"],
    ["the disabled text", "data-disabled:text-gray-400"],
    ["the focus ring", "data-focus-visible:ring-2"],
    ["the focus ring colour", "data-focus-visible:ring-fuchsia-600"],
    ["the focus ring offset", "data-focus-visible:ring-offset-2"],
  ])("textFieldInputClassName has %s", (_, expected) => {
    expect(textFieldInputClassName.split(/\s+/)).toContain(expected);
  });

  it("does not have Button's border-0 reset, which would zero its border", () => {
    expect(textFieldInputClassName.split(/\s+/)).not.toContain("border-0");
  });
});
