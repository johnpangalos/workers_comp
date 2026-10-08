import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

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
    expect(button).toHaveClass("bg-fuchsia-700", "text-white", "px-4", "py-2", "text-sm");
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("data-size", "default");
  });

  it.each([
    ["default", ["bg-fuchsia-700", "hover:bg-fuchsia-800", "active:bg-fuchsia-900"]],
    ["outline", ["border", "border-gray-400", "bg-white", "text-gray-900", "hover:bg-gray-50"]],
    ["ghost", ["text-fuchsia-700", "hover:bg-fuchsia-50", "active:bg-fuchsia-100"]],
  ] as const)("variant=%s applies the Figma classes", (variant, classes) => {
    render(<Button variant={variant}>Label</Button>);
    expect(screen.getByRole("button")).toHaveClass(...classes);
  });

  it("size=sm applies the small padding and type", () => {
    render(<Button size="sm">Label</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-3", "py-1", "text-xs");
    expect(button).not.toHaveClass("px-4", "text-sm");
  });

  it("always has a visible focus ring for keyboard users", () => {
    render(<Button variant="ghost">Label</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "focus-visible:ring-2",
      "focus-visible:ring-fuchsia-600",
      "focus-visible:ring-offset-2",
    );
  });

  it("lets className override a conflicting utility instead of stacking it", () => {
    render(<Button className="px-8">Label</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-8");
    expect(button).not.toHaveClass("px-4");
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
    expect(button).toHaveClass("disabled:bg-gray-100", "disabled:text-gray-400");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
