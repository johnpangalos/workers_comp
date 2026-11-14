import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  Select,
  selectClassName,
  SelectOption,
  selectOptionClassName,
  selectPopoverClassName,
  type SelectProps,
  selectTriggerClassName,
} from "./select";

// These tests cover behaviour and the attributes and classes the styles select on.
// What those look like is checked in a real browser (the playground, tests/select.figma.spec.ts).

// jsdom has no popover API (`showPopover`), so its stylesheet keeps every `[popover]` at
// `display: none` and nothing inside can take focus. Show an open listbox (one without `hidden`) as
// a browser does once comp0 opens it.
beforeAll(() => {
  const style = document.createElement("style");
  style.textContent = "[popover]:not([hidden]) { display: block !important; }";
  document.head.append(style);
});

const bodyParts = [
  { value: "head", label: "Head" },
  { value: "back", label: "Back" },
  { value: "shoulder", label: "Shoulder" },
  { value: "knee", label: "Knee", disabled: true },
];

// The field the tests share: Knee is disabled.
function Example(props: Partial<SelectProps>) {
  return (
    <Select
      label="Body part"
      placeholder="Select a body part"
      description="Where the injury is."
      errorMessage="Choose the injured body part."
      items={bodyParts}
      {...props}
    />
  );
}

const trigger = () => screen.getByRole("button", { name: /Body part/ });
const listbox = () => screen.getByRole("listbox", { hidden: true });
const option = (name: string) => screen.getByRole("option", { name, hidden: true });

describe("Select", () => {
  it("renders a labelled trigger with the placeholder and the description", () => {
    render(<Example />);
    expect(trigger()).toHaveTextContent("Select a body part");
    expect(trigger()).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAccessibleDescription("Where the injury is.");
    expect(screen.queryByText("Choose the injured body part.")).not.toBeInTheDocument();
  });

  it("carries its own classes and appends className last", () => {
    const { container } = render(<Example className="w-full" id="body-part" />);
    const root = container.querySelector('[data-slot="select"]')!;
    expect(root).toHaveAttribute("class", `${selectClassName} w-full`);
    expect(root).toHaveAttribute("data-placeholder", "");
    expect(trigger()).toHaveAttribute("class", selectTriggerClassName);
    expect(listbox()).toHaveAttribute("class", selectPopoverClassName);
    expect(option("Head")).toHaveAttribute("class", selectOptionClassName);
  });

  it("opens on click, picks the option clicked, reports it and closes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn<(value: string) => void>();
    render(<Example onValueChange={onValueChange} />);
    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("data-open", "");
    await user.click(option("Shoulder"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("shoulder");
    expect(trigger()).toHaveTextContent("Shoulder");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(option("Shoulder")).toHaveAttribute("aria-selected", "true");
    expect(option("Shoulder")).toHaveAttribute("data-selected", "");
  });

  it("is reached with Tab, opens with Enter, and the arrow keys and Enter pick an option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn<(value: string) => void>();
    render(<Example defaultValue="head" onValueChange={onValueChange} />);
    await user.tab();
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute("data-focus-visible", "");
    await user.keyboard("{Enter}");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(option("Head")).toHaveFocus();
    expect(option("Head")).toHaveAttribute("data-highlighted", "");
    await user.keyboard("{ArrowDown}");
    expect(option("Back")).toHaveFocus();
    expect(option("Back")).toHaveAttribute("data-highlighted", "");
    expect(option("Head")).not.toHaveAttribute("data-highlighted");
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("back");
    expect(trigger()).toHaveTextContent("Back");
  });

  it("opens with Space, as a native button activates", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    await user.keyboard(" ");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes with Escape without changing the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn<(value: string) => void>();
    render(<Example defaultValue="head" onValueChange={onValueChange} />);
    await user.click(trigger());
    await user.keyboard("{ArrowDown}{Escape}");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("Head");
  });

  it("shows no focus ring after a pointer click", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(trigger());
    expect(trigger()).not.toHaveAttribute("data-focus-visible");
  });

  it("highlights the option the pointer moves over by focusing it", () => {
    render(<Example defaultOpen />);
    fireEvent.pointerMove(option("Back"), { pointerType: "mouse" });
    expect(option("Back")).toHaveFocus();
    expect(option("Back")).toHaveAttribute("data-highlighted", "");
    fireEvent.pointerMove(option("Knee"), { pointerType: "mouse" });
    expect(option("Knee")).not.toHaveFocus();
    expect(option("Knee")).not.toHaveAttribute("data-highlighted");
  });

  it("a disabled option can't be picked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn<(value: string) => void>();
    render(<Example onValueChange={onValueChange} />);
    await user.click(trigger());
    expect(option("Knee")).toHaveAttribute("aria-disabled", "true");
    expect(option("Knee")).toHaveAttribute("data-disabled", "");
    await user.click(option("Knee"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("Select a body part");
  });

  it("disabled: the trigger is disabled, out of the tab order, and nothing opens or fires", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn<(value: string) => void>();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(
      <>
        <Example disabled defaultValue="head" onValueChange={onValueChange} onOpenChange={onOpenChange} />
        <button type="button">After</button>
      </>,
    );
    expect(trigger()).toBeDisabled();
    expect(trigger()).toHaveAttribute("data-disabled", "");
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    await user.click(trigger());
    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("invalid: the error message replaces the description and describes the trigger", () => {
    render(<Example invalid />);
    expect(trigger()).toHaveAttribute("aria-invalid", "true");
    expect(trigger()).toHaveAttribute("data-invalid", "");
    expect(trigger()).toHaveAccessibleDescription("Choose the injured body part.");
    expect(screen.queryByText("Where the injury is.")).not.toBeInTheDocument();
  });

  it("takes SelectOption children, and a controlled value follows onValueChange", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("strain");
      return (
        <>
          <p>Selected: {value}</p>
          <Select label="Body part" value={value} onValueChange={setValue}>
            <SelectOption value="strain">Strain or sprain</SelectOption>
            <SelectOption value="cut" className="italic">
              Cut
            </SelectOption>
          </Select>
        </>
      );
    }
    render(<Controlled />);
    expect(trigger()).toHaveTextContent("Strain or sprain");
    expect(option("Cut")).toHaveAttribute("class", `${selectOptionClassName} italic`);
    await user.click(trigger());
    await user.click(option("Cut"));
    expect(screen.getByText("Selected: cut")).toBeInTheDocument();
    expect(trigger()).toHaveTextContent("Cut");
  });

  it("submits the selected value under its name", () => {
    render(
      <form data-testid="form">
        <Example name="bodyPart" defaultValue="back" />
      </form>,
    );
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.get("bodyPart")).toBe("back");
  });
});
