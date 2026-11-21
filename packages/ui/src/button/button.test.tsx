import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

// These tests cover behaviour and the data attributes the styles select on.
// What those attributes look like is checked in a real browser (the playground).

describe("Button", () => {
  it("renders a native button that defaults to type=button", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.tagName).toBe("BUTTON");
    // A bare <button> inside a <form> submits it; opting in should be explicit.
    expect(button).toHaveAttribute("type", "button");
  });

  it("uses the Figma defaults: variant=filled, size=md", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-variant", "filled");
    expect(button).toHaveAttribute("data-size", "md");
  });

  it.each(["filled", "tonal", "outlined", "text", "accent"] as const)(
    "variant=%s sets data-variant",
    (variant) => {
      render(<Button variant={variant}>Label</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("data-variant", variant);
    },
  );

  it.each(["xs", "sm", "md", "lg", "xl"] as const)("size=%s sets data-size", (size) => {
    render(<Button size={size}>Label</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-size", size);
  });

  it("rejects the old variant and size values at the type level", () => {
    // @ts-expect-error "default" was renamed "filled"
    render(<Button variant="default">Old</Button>);
    // @ts-expect-error "outline" was renamed "outlined"
    render(<Button variant="outline">Old</Button>);
    // @ts-expect-error "ghost" was renamed "text"
    render(<Button variant="ghost">Old</Button>);
    // @ts-expect-error size "default" was renamed "md"
    render(<Button size="default">Old</Button>);
    // From plain JS an old value still renders, with no variant styles of its own.
    expect(screen.getAllByRole("button", { name: "Old" })[0]).toHaveAttribute("data-variant", "default");
  });

  it("carries only its own classes by default", () => {
    render(<Button>Label</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("inline-flex", "data-[variant=filled]:bg-fuchsia-700");
    // No trace of the missing className: no empty, "undefined" or "false" entries.
    expect(button.getAttribute("class")).not.toMatch(/\bundefined\b|\bfalse\b|^\s|\s$|\s\s/);
  });

  it("appends className after its own", () => {
    const { rerender } = render(<Button>Label</Button>);
    const own = screen.getByRole("button").getAttribute("class");
    rerender(<Button className="w-full">Label</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("class", `${own} w-full`);
  });

  it("calls onClick when clicked and is reachable with Tab", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(<Button onClick={onClick}>Label</Button>);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(
      <Button disabled onClick={onClick}>
        Label
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-disabled");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("reports hover as data-hovered, the attribute the hover styles select on", async () => {
    const user = userEvent.setup();
    render(<Button>Label</Button>);
    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("data-hovered");
    await user.hover(button);
    expect(button).toHaveAttribute("data-hovered");
  });

  it("pending disables the button and sets aria-busy", () => {
    render(<Button pending>Saving</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-pending");
  });

  it("reports a press as data-pressed while the pointer is down, and clears it on release", async () => {
    const user = userEvent.setup();
    render(<Button>Label</Button>);
    const button = screen.getByRole("button");
    await user.pointer({ keys: "[MouseLeft>]", target: button });
    expect(button).toHaveAttribute("data-pressed");
    await user.pointer({ keys: "[/MouseLeft]", target: button });
    expect(button).not.toHaveAttribute("data-pressed");
  });

  it("clears data-pressed when a press is dragged off the button", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button>Label</Button>
        <p>Elsewhere</p>
      </>,
    );
    const button = screen.getByRole("button");
    await user.pointer({ keys: "[MouseLeft>]", target: button });
    expect(button).toHaveAttribute("data-pressed");
    await user.pointer({ target: screen.getByText("Elsewhere") });
    expect(button).not.toHaveAttribute("data-pressed");
  });

  it("reports a held Space or Enter as data-pressed", async () => {
    const user = userEvent.setup();
    render(<Button>Label</Button>);
    const button = screen.getByRole("button");
    await user.tab();
    await user.keyboard("[Space>]");
    expect(button).toHaveAttribute("data-pressed");
    await user.keyboard("[/Space]");
    expect(button).not.toHaveAttribute("data-pressed");
    await user.keyboard("[Enter>]");
    expect(button).toHaveAttribute("data-pressed");
    await user.keyboard("[/Enter]");
    expect(button).not.toHaveAttribute("data-pressed");
  });

  it.each([
    ["disabled", { disabled: true }],
    ["pending", { pending: true }],
  ] as const)("is never pressed while %s", async (_, props) => {
    const user = userEvent.setup();
    render(<Button {...props}>Label</Button>);
    const button = screen.getByRole("button");
    await user.pointer({ keys: "[MouseLeft>]", target: button });
    expect(button).not.toHaveAttribute("data-pressed");
    expect(button).toHaveAttribute("data-disabled");
  });

  it("selects its pressed shape and colours only when not disabled", () => {
    render(<Button>Label</Button>);
    // A button that turns disabled (or pending) mid-press keeps comp0's data-pressed until the
    // release; these classes don't match it then.
    expect(screen.getByRole("button")).toHaveClass(
      "data-[size=md]:not-data-disabled:data-pressed:rounded-2xl",
      "data-[variant=filled]:not-data-disabled:data-pressed:bg-fuchsia-900",
    );
  });
});
