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
  it("renders an anchor with the label, href, its own classes and an underline by default", () => {
    render(<Chip href="#mon">Mon</Chip>);
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip.tagName).toBe("A");
    expect(chip).toHaveAttribute("href", "#mon");
    expect(chip).toHaveTextContent("Mon");
    expect(chip).toHaveAttribute("class", chipClassName);
    expect(chip).not.toHaveAttribute("data-muted");
    expect(chip).not.toHaveAttribute("data-current");
    expect(chip).not.toHaveAttribute("aria-current");
    const underline = chip.querySelector('[data-slot="underline"]');
    expect(underline).toBeInTheDocument();
    expect(underline).toHaveAttribute("aria-hidden", "true");
    expect(underline?.tagName).toBe("SPAN");
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

  it("current sets data-current and aria-current=\"true\"", () => {
    render(
      <Chip href="#mon" current>
        Mon
      </Chip>,
    );
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip).toHaveAttribute("data-current", "");
    expect(chip).toHaveAttribute("aria-current", "true");
    expect(chip).not.toHaveAttribute("current");
  });

  it("a consumer's aria-current wins over the one current sets", () => {
    render(
      <Chip href="#mon" current aria-current="location">
        Mon
      </Chip>,
    );
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip).toHaveAttribute("aria-current", "location");
    expect(chip).toHaveAttribute("data-current", "");
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
    ["the inline-flex column", "inline-flex"],
    ["the column layout", "flex-col"],
    ["the 6px gap", "gap-1.5"],
    ["the 6px top padding", "pt-1.5"],
    ["no radius", "rounded-none"],
    ["the label size", "text-sm"],
    ["the bold label", "font-bold"],
    ["the uppercase label", "uppercase"],
    ["the gray-900 label", "text-gray-900"],
    ["the muted label", "data-muted:text-gray-500"],
    ["the hover underline", "data-hovered:*:data-[slot=underline]:text-fuchsia-700"],
    ["the focus ring", "data-focus-visible:ring-2"],
    ["the focus ring colour", "data-focus-visible:ring-fuchsia-600"],
    ["the focus ring offset", "data-focus-visible:ring-offset-2"],
    ["the reset of native appearance", "appearance-none"],
    ["no wrapping of the label", "whitespace-nowrap"],
    ["the 4px horizontal padding", "px-1"],
    ["the fuchsia pressed underline", "data-pressed:*:data-[slot=underline]:text-fuchsia-700"],
  ])("chipClassName has %s", (_, expected) => {
    expect(chipClassName.split(/\s+/)).toContain(expected);
  });

  it("uses theme utilities only, never arbitrary values", () => {
    // An arbitrary value is `w-[137px]` or `text-[#…]`; a data attribute selector is `data-[…]`.
    expect(chipClassName).not.toMatch(/(?<!data)-\[/);
  });

  it.each([
    ["default", {}, "text-gray-200", null],
    ["muted", { muted: true }, "data-[tone=muted]:text-gray-100", "muted"],
    ["current", { current: true }, "data-[tone=current]:text-gray-900", "current"],
    ["current and muted, current wins", { muted: true, current: true }, "data-[tone=current]:text-gray-900", "current"],
  ])("the underline is %s", (_, props, colour, tone) => {
    const { container } = render(<Chip href="#mon" {...props}>Mon</Chip>);
    const underline = container.querySelector('[data-slot="underline"]')!;
    expect(underline.getAttribute("class")!.split(/\s+/)).toContain(colour);
    if (tone === null) expect(underline).not.toHaveAttribute("data-tone");
    else expect(underline).toHaveAttribute("data-tone", tone);
  });

  it("the underline is a dotted row, not a bar: no background on it, its colour is its text colour", () => {
    const { container } = render(<Chip href="#mon">Mon</Chip>);
    const underline = container.querySelector('[data-slot="underline"]')!;
    const classes = underline.getAttribute("class")!.split(/\s+/);
    expect(classes.some((name) => /^(data-\[[^\]]+\]:)?bg-/.test(name))).toBe(false);
    expect(classes).toEqual(expect.arrayContaining(["flex", "h-1", "w-full", "justify-center"]));
  });

  it("the underline holds one dots row, aria-hidden with it, centred", () => {
    const { container } = render(<Chip href="#mon">Mon</Chip>);
    const underline = container.querySelector('[data-slot="underline"]')!;
    const dots = underline.querySelector(':scope > [data-slot="dots"]');
    expect(dots).toBeInTheDocument();
    expect(dots?.tagName).toBe("SPAN");
    expect(dots?.getAttribute("class")!.split(/\s+/)).toEqual(
      expect.arrayContaining(["flex", "gap-1"]),
    );
    // The underline is aria-hidden, so the dots inside it are hidden from assistive technology too.
    expect(underline.closest('[aria-hidden="true"]')).toBe(underline);
    expect(dots?.closest('[aria-hidden="true"]')).toBe(underline);
  });

  it("the dots row holds three round dots, the 4px dots Figma draws", () => {
    const { container } = render(<Chip href="#mon">Mon</Chip>);
    const dots = container.querySelectorAll('[data-slot="dots"] > [data-slot="dot"]');
    expect(dots).toHaveLength(3);
    for (const dot of dots) {
      expect(dot.tagName).toBe("SPAN");
      expect(dot.getAttribute("class")!.split(/\s+/)).toEqual(
        expect.arrayContaining(["block", "size-1", "shrink-0", "rounded-full", "bg-current"]),
      );
    }
  });

  it("the dots sit inside the underline that carries the tone (their colour is measured in the browser)", () => {
    const { container } = render(
      <Chip href="#mon" muted current>
        Mon
      </Chip>,
    );
    const underline = container.querySelector('[data-slot="underline"]')!;
    expect(underline).toHaveAttribute("data-tone", "current");
    for (const dot of container.querySelectorAll('[data-slot="dot"]')) {
      expect(dot.parentElement?.parentElement).toBe(underline);
    }
  });

  it("the dotted underline and its dots never use arbitrary values", () => {
    const { container } = render(<Chip href="#mon">Mon</Chip>);
    for (const selector of ['[data-slot="underline"]', '[data-slot="dots"]', '[data-slot="dot"]']) {
      const element = container.querySelector(selector)!;
      expect(element.getAttribute("class")).not.toMatch(/(?<!data)-\[/);
    }
  });

  it("pressing with the pointer sets data-pressed until the button is released", async () => {
    const user = userEvent.setup();
    render(<Chip href="#mon">Mon</Chip>);
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip).not.toHaveAttribute("data-pressed");
    await user.pointer({ keys: "[MouseLeft>]", target: chip });
    expect(chip).toHaveAttribute("data-pressed", "");
    await user.pointer({ keys: "[/MouseLeft]", target: chip });
    expect(chip).not.toHaveAttribute("data-pressed");
  });

  it("pressing with Enter held sets data-pressed until Enter is released", async () => {
    const user = userEvent.setup();
    render(<Chip href="#mon">Mon</Chip>);
    const chip = screen.getByRole("link", { name: "Mon" });
    await user.tab();
    await user.keyboard("[Enter>]");
    expect(chip).toHaveAttribute("data-pressed", "");
    await user.keyboard("[/Enter]");
    expect(chip).not.toHaveAttribute("data-pressed");
  });

  it("holding Space on a link doesn't press it: links activate on Enter only", async () => {
    const user = userEvent.setup();
    render(<Chip href="#mon">Mon</Chip>);
    const chip = screen.getByRole("link", { name: "Mon" });
    await user.tab();
    await user.keyboard("[Space>]");
    expect(chip).not.toHaveAttribute("data-pressed");
    await user.keyboard("[/Space]");
  });

  it("the user's onKeyDown still fires alongside the press", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<Chip href="#mon" onKeyDown={onKeyDown}>Mon</Chip>);
    const chip = screen.getByRole("link", { name: "Mon" });
    await user.tab();
    await user.keyboard("[Enter>]");
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(chip).toHaveAttribute("data-pressed", "");
    await user.keyboard("[/Enter]");
  });

  it("a disabled chip never shows pressed", async () => {
    const user = userEvent.setup();
    render(
      <Chip href="#mon" disabled>
        Mon
      </Chip>,
    );
    const chip = screen.getByText("Mon").closest("a")!;
    await user.pointer({ keys: "[MouseLeft>]", target: chip });
    expect(chip).not.toHaveAttribute("data-pressed");
    await user.pointer({ keys: "[/MouseLeft]", target: chip });
  });

  it("the user's onPointerDown and onClick still fire, and the chip is pressed in between", async () => {
    const user = userEvent.setup();
    const onPointerDown = vi.fn();
    const onClick = vi.fn();
    render(
      <Chip href="#mon" onPointerDown={onPointerDown} onClick={onClick}>
        Mon
      </Chip>,
    );
    const chip = screen.getByRole("link", { name: "Mon" });
    await user.pointer({ keys: "[MouseLeft>]", target: chip });
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(chip).toHaveAttribute("data-pressed", "");
    await user.pointer({ keys: "[/MouseLeft]", target: chip });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(chip).not.toHaveAttribute("data-pressed");
  });

  it("pressing merges the dots: the row and its dots carry data-pressed while held", async () => {
    const user = userEvent.setup();
    const { container } = render(<Chip href="#mon">Mon</Chip>);
    const chip = screen.getByRole("link", { name: "Mon" });
    const dots = container.querySelector('[data-slot="dots"]')!;
    expect(dots).not.toHaveAttribute("data-pressed");
    expect(dots.getAttribute("class")!.split(/\s+/)).toEqual(
      expect.arrayContaining(["data-pressed:gap-0", "data-pressed:*:w-2", "data-pressed:*:rounded-none", "transition-all"]),
    );
    await user.pointer({ keys: "[MouseLeft>]", target: chip });
    expect(dots).toHaveAttribute("data-pressed", "");
    await user.pointer({ keys: "[/MouseLeft]", target: chip });
    expect(dots).not.toHaveAttribute("data-pressed");
  });

  it("there is no fill slab, and the pressed classes never use arbitrary values", () => {
    const { container } = render(<Chip href="#mon">Mon</Chip>);
    expect(container.querySelector('[data-slot="fill"]')).toBeNull();
    expect(container.querySelector('[data-slot="dots"]')!.getAttribute("class")).not.toMatch(/(?<!data)-\[/);
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

  it("current={false} renders no data-current and no aria-current at all", () => {
    render(
      <Chip href="#mon" current={false}>
        Mon
      </Chip>,
    );
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip.hasAttribute("data-current")).toBe(false);
    expect(chip.hasAttribute("aria-current")).toBe(false);
    expect(chip.outerHTML).not.toMatch(/\sdata-current[\s=>]/);
    expect(chip.outerHTML).not.toMatch(/\saria-current[\s=>]/);
  });

  it("className ends the class attribute, after the Chip's own classes", () => {
    render(
      <Chip href="#mon" className="text-red-500">
        Mon
      </Chip>,
    );
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip.getAttribute("class")).toBe(`${chipClassName} text-red-500`);
  });

  it("with no href and no as, renders an anchor without crashing and without an href", () => {
    const { container } = render(<Chip>Mon</Chip>);
    const chip = container.querySelector("a")!;
    expect(chip).toHaveTextContent("Mon");
    expect(chip).not.toHaveAttribute("href");
    expect(chip).toHaveClass(chipClassName);
  });

  it("a long label stays on one line, and its underline is full width", () => {
    render(<Chip href="#thu">Thursday leftovers</Chip>);
    const chip = screen.getByRole("link", { name: "Thursday leftovers" });
    expect(chip).toHaveClass("whitespace-nowrap");
    const underline = chip.querySelector('[data-slot="underline"]')!;
    expect(underline.getAttribute("class")!.split(/\s+/)).toContain("w-full");
  });

  it("empty children render without crashing, with the underline still there", () => {
    const { container } = render(<Chip href="#mon" />);
    const chip = container.querySelector("a")!;
    expect(chip).toHaveClass(chipClassName);
    expect(chip.querySelector('[data-slot="underline"]')).toBeInTheDocument();
  });
});
