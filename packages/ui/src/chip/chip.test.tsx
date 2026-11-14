import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Chip } from "./chip";

// These tests cover behaviour and the data attributes the styles select on.
// What those attributes look like is checked in a real browser (the playground).

// The classes a plain chip renders with: the Chip's own, with no className. They are the same
// whatever its tone, which is the data-tone attribute.
function ownClasses() {
  const { container, unmount } = render(<Chip href="#own">Own</Chip>);
  const classes = container.firstElementChild!.getAttribute("class")!;
  unmount();
  return classes;
}

// An arbitrary value is `w-[137px]` or `text-[#…]`; a data attribute selector is `data-[…]`.
const arbitraryValues = (element: Element) =>
  [...element.classList].filter((name) => /(?<!data)-\[/.test(name));

// A router-style link: takes `to`, renders an anchor.
function RouterLink({ to, children, ...props }: ComponentProps<"a"> & { to: string }) {
  return (
    <a {...props} href={to}>
      {children}
    </a>
  );
}

describe("Chip", () => {
  it("renders an anchor with the label, href, its own classes and nothing but the label inside", () => {
    render(<Chip href="#mon">Mon</Chip>);
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip.tagName).toBe("A");
    expect(chip).toHaveAttribute("href", "#mon");
    expect(chip).toHaveTextContent("Mon");
    expect(chip).toHaveClass("inline-flex");
    // No trace of the missing className: no empty, "undefined" or "false" entries.
    expect(chip.getAttribute("class")).not.toMatch(/\bundefined\b|\bfalse\b|^\s|\s$|\s\s/);
    expect(chip).not.toHaveAttribute("data-muted");
    expect(chip).not.toHaveAttribute("data-current");
    expect(chip).not.toHaveAttribute("aria-current");
    expect(chip).toHaveAttribute("data-tone", "default");
    // A pill: no underline, dots or other parts.
    expect(chip.children).toHaveLength(0);
  });

  it.each([
    ["the inline-flex row", "inline-flex"],
    ["the centred label", "items-center"],
    ["the full radius", "rounded-full"],
    ["the 12px horizontal padding", "px-3"],
    ["the 4px vertical padding", "py-1"],
    ["the label size", "text-sm"],
    ["the medium label", "font-medium"],
    ["the focus ring", "data-focus-visible:ring-2"],
    ["the focus ring colour", "data-focus-visible:ring-fuchsia-600"],
    ["the focus ring offset", "data-focus-visible:ring-offset-2"],
    ["the reset of native appearance", "appearance-none"],
    ["no wrapping of the label", "whitespace-nowrap"],
    ["the fill's transition", "transition-colors"],
    ["the transition's 150ms", "duration-150"],
    ["the transition's curve", "ease-in-out"],
    ["the default fill", "data-[tone=default]:bg-gray-100"],
    ["the default label", "data-[tone=default]:text-gray-900"],
    ["the default hover fill", "data-[tone=default]:not-data-pressed:data-hovered:bg-gray-200"],
    ["the default pressed fill", "data-[tone=default]:data-pressed:bg-gray-300"],
    ["the current fill", "data-[tone=current]:bg-fuchsia-700"],
    ["the current label", "data-[tone=current]:text-white"],
    ["the current hover fill", "data-[tone=current]:not-data-pressed:data-hovered:bg-fuchsia-800"],
    ["the current pressed fill", "data-[tone=current]:data-pressed:bg-fuchsia-900"],
    ["the muted fill", "data-[tone=muted]:bg-gray-50"],
    ["the muted label", "data-[tone=muted]:text-gray-500"],
    ["the muted hover fill", "data-[tone=muted]:not-data-pressed:data-hovered:bg-gray-100"],
    ["the muted pressed fill", "data-[tone=muted]:data-pressed:bg-gray-200"],
    ["the muted current fill", "data-[tone=muted-current]:bg-fuchsia-100"],
    ["the muted current label", "data-[tone=muted-current]:text-fuchsia-900"],
    [
      "the muted current hover fill",
      "data-[tone=muted-current]:not-data-pressed:data-hovered:bg-fuchsia-200",
    ],
    ["the muted current pressed fill", "data-[tone=muted-current]:data-pressed:bg-fuchsia-300"],
  ])("the rendered chip has %s", (_, expected) => {
    render(<Chip href="#mon">Mon</Chip>);
    expect(screen.getByRole("link", { name: "Mon" })).toHaveClass(expected);
  });

  it("is not uppercase or bold any more", () => {
    render(<Chip href="#mon">Mon</Chip>);
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip).not.toHaveClass("uppercase");
    expect(chip).not.toHaveClass("font-bold");
  });

  it("uses theme utilities only, never arbitrary values", () => {
    render(<Chip href="#mon">Mon</Chip>);
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip.classList.length).toBeGreaterThan(0);
    expect(arbitraryValues(chip)).toEqual([]);
  });

  it.each([
    ["default", {}, "default"],
    ["muted", { muted: true }, "muted"],
    ["current", { current: true }, "current"],
    ["muted and current", { muted: true, current: true }, "muted-current"],
  ])("the tone of a %s chip is on data-tone", (_, props, tone) => {
    render(
      <Chip href="#mon" {...props}>
        Mon
      </Chip>,
    );
    expect(screen.getByRole("link", { name: "Mon" })).toHaveAttribute("data-tone", tone);
  });

  it("is reached by Tab, followed by Enter, and shows a focus ring only for keyboard focus", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
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

  it('current sets data-current and aria-current="true"', () => {
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
    const own = ownClasses();
    render(<Chip className="w-full">Mon</Chip>);
    expect(screen.getByText("Mon").getAttribute("class")).toBe(`${own} w-full`);
  });

  it("as= renders through comp0's Link with the router's props and the same classes", () => {
    const own = ownClasses();
    render(
      <Chip as={RouterLink} to="/sun" aria-current="location">
        Sun
      </Chip>,
    );
    const link = screen.getByRole("link", { name: "Sun" });
    expect(link).toHaveAttribute("href", "/sun");
    expect(link).toHaveAttribute("class", own);
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
    const onClick = vi.fn<() => void>();
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

  it("uses theme utilities only, never arbitrary values, in every tone", () => {
    render(
      <>
        <Chip href="#mon">Mon</Chip>
        <Chip href="#tue" muted>
          Tue
        </Chip>
        <Chip href="#wed" current>
          Wed
        </Chip>
        <Chip href="#thu" muted current>
          Thu
        </Chip>
      </>,
    );
    for (const chip of screen.getAllByRole("link")) expect(arbitraryValues(chip)).toEqual([]);
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
    const onKeyDown = vi.fn<() => void>();
    render(
      <Chip href="#mon" onKeyDown={onKeyDown}>
        Mon
      </Chip>,
    );
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
    const onPointerDown = vi.fn<() => void>();
    const onClick = vi.fn<() => void>();
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

  // Hostile inputs

  it('muted={false} renders no data-muted attribute at all, not data-muted="false"', () => {
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
    const own = ownClasses();
    render(
      <Chip href="#mon" className="text-red-500">
        Mon
      </Chip>,
    );
    const chip = screen.getByRole("link", { name: "Mon" });
    expect(chip.getAttribute("class")).toBe(`${own} text-red-500`);
  });

  it("with no href and no as, renders an anchor without crashing and without an href", () => {
    const own = ownClasses();
    const { container } = render(<Chip>Mon</Chip>);
    const chip = container.querySelector("a")!;
    expect(chip).toHaveTextContent("Mon");
    expect(chip).not.toHaveAttribute("href");
    expect(chip).toHaveAttribute("class", own);
  });

  it("a long label stays on one line", () => {
    render(<Chip href="#thu">Thursday leftovers</Chip>);
    expect(screen.getByRole("link", { name: "Thursday leftovers" })).toHaveClass("whitespace-nowrap");
  });

  it("empty children render without crashing", () => {
    const own = ownClasses();
    const { container } = render(<Chip href="#mon" />);
    const chip = container.querySelector("a")!;
    expect(chip).toHaveAttribute("class", own);
    expect(chip).toHaveAttribute("data-tone", "default");
  });
});
