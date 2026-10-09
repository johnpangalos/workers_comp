import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonClassName } from "./button";

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

  it("uses the Figma defaults: variant=default, size=default", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("data-size", "default");
  });

  it.each(["default", "outline", "ghost"] as const)("variant=%s sets data-variant", (variant) => {
    render(<Button variant={variant}>Label</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", variant);
  });

  it("size=sm sets data-size", () => {
    render(<Button size="sm">Label</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "sm");
  });

  it("has styles for every variant and size", () => {
    for (const selector of [
      "data-[variant=default]:bg-fuchsia-700",
      "data-[variant=outline]:border-gray-400",
      "data-[variant=ghost]:text-fuchsia-700",
      "data-[size=default]:px-4",
      "data-[size=sm]:px-3",
      "focus-visible:ring-fuchsia-600",
      "disabled:bg-gray-100!",
    ]) {
      expect(buttonClassName.split(" ")).toContain(selector);
    }
  });

  it("appends className for layout", () => {
    render(<Button className="w-full">Label</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("w-full", "data-[variant=default]:bg-fuchsia-700");
  });

  it("calls onClick when clicked and is reachable with Tab", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Label</Button>);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Label
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
