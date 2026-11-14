import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Badge, type BadgeColor } from "./badge";

// These tests cover behaviour and the data attributes the styles select on.
// What those attributes look like is checked in a real browser (the playground).

const colors: BadgeColor[] = ["gray", "fuchsia", "red", "amber", "green", "teal", "blue", "violet", "pink"];

// The classes a plain gray badge renders with: the Badge's own, with no className.
function ownClasses() {
  const { container, unmount } = render(<Badge>Own</Badge>);
  const classes = container.firstElementChild!.getAttribute("class")!;
  unmount();
  return classes;
}

// A router-style link: takes `to`, renders an anchor.
function RouterLink({ to, children, ...props }: ComponentProps<"a"> & { to: string }) {
  return (
    <a {...props} href={to}>
      {children}
    </a>
  );
}

describe("Badge", () => {
  it("renders a span with the label and a dot before it, and nothing focusable", () => {
    const { container } = render(<Badge>Label</Badge>);
    const badge = container.firstElementChild!;
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveAttribute("data-color", "gray");
    expect(badge).not.toHaveAttribute("tabindex");
    expect(badge).not.toHaveAttribute("role");
    const dot = badge.firstElementChild!;
    expect(dot.tagName).toBe("SPAN");
    expect(dot).toHaveAttribute("data-slot", "dot");
    expect(dot).toHaveAttribute("aria-hidden", "true");
    expect(badge).toHaveTextContent("Label");
    expect(badge.lastChild!.textContent).toBe("Label");
  });

  it("defaults to color=gray and carries only its own classes by default", () => {
    render(<Badge>Label</Badge>);
    expect(screen.getByText("Label")).toHaveAttribute("data-color", "gray");
    expect(screen.getByText("Label")).toHaveClass("inline-flex");
    // No trace of the missing className: no empty, "undefined" or "false" entries.
    expect(screen.getByText("Label").getAttribute("class")).not.toMatch(
      /\bundefined\b|\bfalse\b|^\s|\s$|\s\s/,
    );
  });

  it.each(colors)("color=%s sets data-color on the badge and its dot", (color) => {
    const { container } = render(<Badge color={color}>Label</Badge>);
    const badge = container.firstElementChild!;
    expect(badge).toHaveAttribute("data-color", color);
    expect(badge.firstElementChild).toHaveAttribute("data-color", color);
  });

  it.each(colors)("color=%s is the theme's 100/800 background and text, and 500 dot", (color) => {
    const { container } = render(<Badge color={color}>Label</Badge>);
    const badge = container.firstElementChild!;
    expect(badge).toHaveClass(
      `data-[color=${color}]:bg-${color}-100`,
      `data-[color=${color}]:text-${color}-800`,
    );
    expect(badge.firstElementChild).toHaveClass(`data-[color=${color}]:bg-${color}-500`);
  });

  it("uses theme utilities only, never arbitrary values", () => {
    const { container } = render(<Badge href="/recipes">Label</Badge>);
    const badge = container.firstElementChild!;
    const classes = [...badge.classList, ...badge.firstElementChild!.classList];
    expect(classes.length).toBeGreaterThan(0);
    // `data-[color=…]` selects on an attribute; an arbitrary value is `w-[137px]`, `text-[#…]`.
    expect(classes.filter((name) => /(?<!data)-\[/.test(name))).toEqual([]);
  });

  it("dot={false} renders no dot", () => {
    const { container } = render(<Badge dot={false}>Label</Badge>);
    expect(container.querySelector('[data-slot="dot"]')).toBeNull();
    expect(container.firstElementChild).toHaveTextContent("Label");
  });

  it("with href, renders an anchor reached by Tab and activated by Enter", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(
      <Badge href="/recipes" onClick={onClick}>
        Label
      </Badge>,
    );
    const link = screen.getByRole("link", { name: "Label" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/recipes");
    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows the focus ring only for keyboard focus (data-focus-visible), not for a click", async () => {
    const user = userEvent.setup();
    render(<Badge href="/recipes">Label</Badge>);
    const link = screen.getByRole("link");
    await user.tab();
    expect(link).toHaveAttribute("data-focus-visible");
    await user.click(link);
    expect(link).not.toHaveAttribute("data-focus-visible");
  });

  it("as= renders through comp0's Link with the same classes and the router's props", () => {
    // The colour is the data-color attribute; the classes are the same for every colour.
    const own = ownClasses();
    render(
      <Badge as={RouterLink} to="/recipes" color="teal">
        Label
      </Badge>,
    );
    const link = screen.getByRole("link", { name: "Label" });
    expect(link).toHaveAttribute("href", "/recipes");
    expect(link).toHaveAttribute("data-color", "teal");
    expect(link).toHaveAttribute("class", own);
  });

  it("disabled link has no href, is not tabbable, and does not fire onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(
      <Badge href="/recipes" disabled onClick={onClick}>
        Label
      </Badge>,
    );
    const link = screen.getByText("Label").closest("a")!;
    expect(link).not.toHaveAttribute("href");
    expect(link).toHaveAttribute("aria-disabled", "true");
    await user.tab();
    expect(link).not.toHaveFocus();
    await user.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("disabled on a plain badge leaves no stray attribute on the span", () => {
    render(<Badge disabled>Label</Badge>);
    expect(screen.getByText("Label")).not.toHaveAttribute("disabled");
  });

  it("appends className after its own classes", () => {
    const own = ownClasses();
    render(<Badge className="w-full">Label</Badge>);
    const badge = screen.getByText("Label");
    expect(badge.getAttribute("class")).toBe(`${own} w-full`);
  });

  // Hostile inputs

  it("href='' still renders an anchor, still styled", () => {
    const own = ownClasses();
    const { container } = render(<Badge href="">Label</Badge>);
    const link = container.querySelector("a")!;
    expect(link).toHaveAttribute("href", "");
    expect(link).toHaveAttribute("class", own);
    expect(link).toHaveAttribute("data-color", "gray");
  });

  it("dot={false} with a link renders the link and no dot", () => {
    const { container } = render(
      <Badge href="/recipes" dot={false}>
        Label
      </Badge>,
    );
    expect(container.querySelector("a")).toHaveTextContent("Label");
    expect(container.querySelector('[data-slot="dot"]')).toBeNull();
  });

  it("className='bg-red-500' is appended after the Badge's classes and ends the class attribute", () => {
    const own = ownClasses();
    const { container } = render(<Badge className="bg-red-500">Label</Badge>);
    const badge = container.firstElementChild!;
    expect(badge.getAttribute("class")!.endsWith("bg-red-500")).toBe(true);
    expect(badge.getAttribute("class")!.startsWith(own)).toBe(true);
  });

  it("empty children render without crashing", () => {
    const { container } = render(<Badge />);
    expect(container.firstElementChild!.tagName).toBe("SPAN");
    expect(container.querySelector('[data-slot="dot"]')).not.toBeNull();
  });
});
