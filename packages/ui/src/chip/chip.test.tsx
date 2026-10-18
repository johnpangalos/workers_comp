import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Chip, chipClassName } from "./chip";

// These tests cover behaviour and the data attributes the styles select on.
// What those attributes look like is checked in a real browser (the playground).

// A router-style link: takes `to`, renders an anchor.
function RouterLink({ to, ...props }: ComponentProps<"a"> & { to: string }) {
  return <a {...props} href={to} />;
}

describe("Chip", () => {
  it("renders an anchor with the label, href and only its own classes by default", () => {
    render(<Chip href="#mon">Mon</Chip>);
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip.tagName).toBe("A");
    expect(chip).toHaveAttribute("href", "#mon");
    expect(chip).toHaveTextContent("Mon");
    expect(chip).toHaveAttribute("class", chipClassName);
    expect(chip).not.toHaveAttribute("data-muted");
  });

  it("is reached by Tab, followed by Enter, and shows a focus ring only for keyboard focus", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Chip href="#mon" onClick={onClick}>
        Mon
      </Chip>,
    );
    const chip = screen.getByRole("link", { name: "Mon" });
    await user.tab();
    expect(chip).toHaveFocus();
    expect(chip).toHaveAttribute("data-focus-visible");
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
    await user.click(chip);
    expect(chip).not.toHaveAttribute("data-focus-visible");
  });

  it("muted sets the data-muted presence attribute", () => {
    render(
      <Chip href="#tue" muted>
        Tue
      </Chip>,
    );
    expect(screen.getByRole("link", { name: "Tue" })).toHaveAttribute("data-muted", "");
  });

  it("muted is not passed to the DOM as a prop", () => {
    render(
      <Chip href="#tue" muted>
        Tue
      </Chip>,
    );
    expect(screen.getByRole("link", { name: "Tue" })).not.toHaveAttribute("muted");
  });

  it("className is appended as is, after the Chip's classes", () => {
    render(<Chip className="w-full">Mon</Chip>);
    expect(screen.getByText("Mon").getAttribute("class")).toBe(`${chipClassName} w-full`);
  });

  it("as= renders through comp0's Link with the router's props and the same classes", () => {
    render(
      <Chip as={RouterLink} to="/sun" aria-current="location">
        Sun
      </Chip>,
    );
    const link = screen.getByRole("link", { name: "Sun" });
    expect(link).toHaveAttribute("href", "/sun");
    expect(link).toHaveClass(chipClassName);
  });

  it("passes aria-current through to the anchor", () => {
    render(
      <Chip href="#prep" aria-current="location">
        Prep
      </Chip>,
    );
    expect(screen.getByRole("link", { name: "Prep" })).toHaveAttribute("aria-current", "location");
  });

  it("disabled link has no href, is not tabbable, and does not fire onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Chip href="#mon" disabled onClick={onClick}>
        Mon
      </Chip>,
    );
    const chip = screen.getByText("Mon").closest("a")!;
    expect(chip).not.toHaveAttribute("href");
    expect(chip).toHaveAttribute("aria-disabled", "true");
    await user.tab();
    expect(chip).not.toHaveFocus();
    await user.click(chip);
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each([
    ["the inline-flex pill", "inline-flex"],
    ["the pill radius", "rounded-full"],
    ["the gray-200 border", "border-gray-200"],
    ["the white fill", "bg-white"],
    ["the label size and weight", "text-sm"],
    ["the semibold label", "font-semibold"],
    ["the gray-900 label", "text-gray-900"],
    ["the muted label", "data-muted:text-gray-500"],
    ["the hover border", "data-hovered:border-fuchsia-700"],
    ["the focus ring", "data-focus-visible:ring-2"],
    ["the focus ring colour", "data-focus-visible:ring-fuchsia-600"],
    ["the focus ring offset", "data-focus-visible:ring-offset-2"],
    ["the reset of native appearance", "appearance-none"],
    ["no wrapping of the label", "whitespace-nowrap"],
  ])("chipClassName has %s", (_, expected) => {
    expect(chipClassName.split(/\s+/)).toContain(expected);
  });

  it("uses theme utilities only, never arbitrary values", () => {
    // An arbitrary value is `w-[137px]` or `text-[#…]`; a data attribute selector is `data-[…]`.
    expect(chipClassName).not.toMatch(/(?<!data)-\[/);
  });

  // Hostile inputs

  it("muted={false} renders no data-muted attribute at all, not data-muted=\"false\"", () => {
    render(
      <Chip href="#mon" muted={false}>
        Mon
      </Chip>,
    );
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip.hasAttribute("data-muted")).toBe(false);
    // The class names the selector `data-muted:`; the attribute itself must be absent.
    expect(chip.outerHTML).not.toMatch(/\sdata-muted[\s=>]/);
  });

  it("className='border-red-500' ends the class attribute, after the Chip's own classes", () => {
    render(
      <Chip href="#mon" className="border-red-500">
        Mon
      </Chip>,
    );
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip.getAttribute("class")).toBe(`${chipClassName} border-red-500`);
  });

  it("with no href and no as, renders an anchor without crashing and without an href", () => {
    const { container } = render(<Chip>Mon</Chip>);
    const chip = container.querySelector("a")!;
    expect(chip).toHaveTextContent("Mon");
    expect(chip).not.toHaveAttribute("href");
    expect(chip).toHaveClass(chipClassName);
  });

  it("a long label stays on one line (the class is there; it never wraps)", () => {
    render(<Chip href="#thu">Thursday leftovers</Chip>);
    const chip = screen.getByRole("link", { name: "Thursday leftovers" });
    expect(chip).toHaveClass("whitespace-nowrap");
  });

  it("empty children render without crashing", () => {
    const { container } = render(<Chip href="#mon" />);
    expect(container.querySelector("a")).toHaveClass(chipClassName);
  });
});
