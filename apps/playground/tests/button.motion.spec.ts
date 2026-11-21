import { expect, test, type Locator } from "@playwright/test";
import { loadFigmaExport, loadFigmaNodes } from "./figma";

// The Figma Button's prototype transitions against the rendered Button's CSS transitions. Each
// default variant changes to its hover one with Smart Animate on a cubic-bezier curve, and each
// hover variant to its pressed one with Smart Animate on a spring. The values come from
// figma/button-motion.json, written by figma/export-motion.js.
type Spring = { mass: number; stiffness: number; damping: number };
type Motion = {
  trigger: string;
  transition: string;
  durationMs: number;
  easing: number[] | { spring: Spring };
};
const transitions = loadFigmaExport(new URL("../figma/button-motion.json", import.meta.url))
  .variants as Record<string, Motion>;

/**
 * Where a spring released from 0 is at `t` seconds, heading for 1: the analytic solution of
 * m·x'' + c·x' + k·(x - 1) = 0 with x(0) = 0 and x'(0) = 0, in each damping regime.
 */
function springAt({ mass, stiffness, damping }: Spring, t: number) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const root = w0 * Math.sqrt(zeta * zeta - 1);
  const [r1, r2] = [-zeta * w0 + root, -zeta * w0 - root];
  return 1 - (r1 * Math.exp(r2 * t) - r2 * Math.exp(r1 * t)) / (r1 - r2);
}

/** The time after which the spring stays within `tolerance` of rest, in seconds (to 0.1ms). */
function settleTime(spring: Spring, tolerance: number) {
  let settled = 0;
  for (let t = 0; t < 10; t += 0.0001) if (Math.abs(springAt(spring, t) - 1) > tolerance) settled = t;
  return settled;
}

/**
 * A CSS `linear()` easing as [input progress, output] points, both 0–1. A stop's missing position
 * is filled in as CSS does: the first is 0, the last 1, and a run between two known ones is spread
 * evenly. (A stop with two positions is two points.)
 */
function linearPoints(easing: string): [number, number][] {
  const stops = easing
    .replace(/^linear\((.*)\)$/s, "$1")
    .split(",")
    .flatMap((stop) => {
      const [value, ...positions] = stop.trim().split(/\s+/);
      if (positions.length === 0) return [[null, Number(value)] as [number | null, number]];
      return positions.map((p) => [parseFloat(p) / 100, Number(value)] as [number | null, number]);
    });
  stops[0]![0] ??= 0;
  stops.at(-1)![0] ??= 1;
  for (let i = 1; i < stops.length; i++) {
    if (stops[i]![0] !== null) {
      stops[i]![0] = Math.max(stops[i]![0]!, stops[i - 1]![0]!);
      continue;
    }
    let next = i;
    while (stops[next]![0] === null) next++;
    const [from, to] = [stops[i - 1]![0]!, stops[next]![0]!];
    for (let j = i; j < next; j++) stops[j]![0] = from + ((to - from) * (j - i + 1)) / (next - i + 1);
  }
  return stops as [number, number][];
}

/** The output of piecewise-linear points at input progress `p`. */
function along(points: [number, number][], p: number) {
  let i = points.findIndex(([x]) => x >= p);
  if (i <= 0) i = 1;
  const [[x0, y0], [x1, y1]] = [points[i - 1]!, points[i]!];
  if (x1 === x0) return y1;
  return y0 + ((y1 - y0) * (p - x0)) / (x1 - x0);
}

/** The duration and curve the element's CSS transitions `property` with, or null when it doesn't. */
async function transitionOf(element: Locator, property: string) {
  return element.evaluate((el, property) => {
    const style = getComputedStyle(el);
    const list = (value: string) => value.split(/,(?![^(]*\))/).map((part) => part.trim());
    const properties = list(style.transitionProperty);
    let i = properties.indexOf(property);
    if (i === -1) i = properties.indexOf("all");
    if (i === -1) return null;
    const durations = list(style.transitionDuration);
    const curves = list(style.transitionTimingFunction);
    return { duration: durations[i % durations.length]!, curve: curves[i % curves.length]! };
  }, property);
}

// The curve may be off the spring by a hundredth of the change, at most, anywhere along it.
const TOLERANCE = 0.01;

for (const [name, motion] of Object.entries(transitions)) {
  // "variant=filled, size=xs, state=hover -> variant=filled, size=xs, state=active"
  const [from, to] = name
    .split(" -> ")
    .map((side) => Object.fromEntries(side.split(", ").map((pair) => pair.split("="))));

  test(name, async ({ page }) => {
    expect(motion.transition).toBe("SMART_ANIMATE");
    await page.goto("/button/figma");
    const button = page.locator(`button[data-variant="${from!.variant}"][data-size="${from!.size}"]`).first();

    if (motion.trigger === "ON_HOVER") {
      // Default to hover: the fill changes on Figma's curve.
      expect([from!.state, to!.state]).toEqual(["default", "hover"]);
      expect(Array.isArray(motion.easing), "Figma's easing is a cubic-bezier curve").toBe(true);
      await button.hover();
      await expect(button).toHaveAttribute("data-hovered");
      const css = await transitionOf(button, "background-color");
      expect(css, "background-color is transitioned").not.toBeNull();
      expect.soft(css!.duration, "transition duration").toBe(`${motion.durationMs / 1000}s`);
      expect
        .soft(css!.curve, "transition curve")
        .toBe(`cubic-bezier(${(motion.easing as number[]).join(", ")})`);
      return;
    }

    // Hover to pressed: a spring, which springs the corners (and changes the fill with them).
    expect(motion.trigger).toBe("ON_PRESS");
    expect([from!.state, to!.state]).toEqual(["hover", "active"]);
    expect("spring" in motion.easing, "Figma's easing is a spring").toBe(true);
    const { spring } = motion.easing as { spring: Spring };
    await button.hover();
    await page.mouse.down();
    await expect(button).toHaveAttribute("data-pressed");
    for (const property of ["border-radius", "background-color"]) {
      const css = await transitionOf(button, property);
      expect(css, `${property} is transitioned`).not.toBeNull();
      expect.soft(css!.duration, `${property}: transition duration`).toBe(`${motion.durationMs / 1000}s`);
      expect.soft(css!.curve, `${property}: a linear() easing`).toMatch(/^linear\(/);
    }
    const { curve } = (await transitionOf(button, "border-radius"))!;
    const duration = motion.durationMs / 1000;

    // The curve against the spring, recomputed from Figma's mass, stiffness and damping: at each
    // of its points, and everywhere between them, within the tolerance.
    const points = linearPoints(curve);
    expect.soft(points[0], "starts at rest").toEqual([0, 0]);
    expect.soft(points.at(-1), "ends at rest").toEqual([1, 1]);
    let worst = { error: 0, at: 0 };
    for (let p = 0; p <= 1; p += 0.0005) {
      const error = Math.abs(along(points, p) - springAt(spring, p * duration));
      if (error > worst.error) worst = { error, at: p };
    }
    expect
      .soft(
        worst.error,
        `the curve is ${worst.error.toFixed(4)} off the spring at ${(worst.at * 100).toFixed(2)}%`,
      )
      .toBeLessThanOrEqual(TOLERANCE);

    // The duration against the spring's settle time: by the end the spring is within the
    // tolerance of rest and stays there, so the curve can stop at 1 without a visible jump.
    const settled = settleTime(spring, TOLERANCE);
    expect
      .soft(duration, `the spring settles within ${TOLERANCE} of rest at ${(settled * 1000).toFixed(1)}ms`)
      .toBeGreaterThanOrEqual(settled);

    // The corners as drawn while the press plays: paused at every 5ms, each corner is where the
    // spring puts it between Figma's hover radius and its pressed one (clamped to half the box, as
    // a browser draws it), and never 0. A radius that starts far past half the box (rounded-full)
    // shows a pill, then square corners where the overshoot goes below 0, then a pill again.
    const nodes = loadFigmaNodes(new URL(`../figma/button-${from!.variant}.json`, import.meta.url));
    const rest = nodes[name.split(" -> ")[0]!]!.radius;
    const pressed = nodes[name.split(" -> ")[1]!]!.radius;
    const samples = await button.evaluate((el, ms) => {
      const corners = el
        .getAnimations()
        .filter((a) => /^border-.*-radius$/.test((a as CSSTransition).transitionProperty));
      corners.forEach((a) => a.pause());
      const { width, height } = el.getBoundingClientRect();
      const drawn = [] as { t: number; radii: number[] }[];
      for (let t = 0; t <= ms; t += 5) {
        corners.forEach((a) => (a.currentTime = t));
        const style = getComputedStyle(el);
        const radii = ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map((corner) =>
          Math.min(
            parseFloat(style[`border${corner}Radius` as "borderTopLeftRadius"]),
            width / 2,
            height / 2,
          ),
        );
        drawn.push({ t, radii });
      }
      return { count: corners.length, drawn, half: Math.min(width, height) / 2 };
    }, motion.durationMs);
    expect(samples.count, "every corner's radius is transitioned").toBe(4);
    let off = { by: 0, at: 0, drawn: 0, expected: 0 };
    for (const { t, radii } of samples.drawn) {
      const expected = Math.min(rest + (pressed - rest) * springAt(spring, t / 1000), samples.half);
      for (const radius of radii) {
        expect.soft(radius, `a corner is ${radius}px at ${t}ms`).toBeGreaterThan(0);
        const by = Math.abs(radius - expected);
        if (by > off.by) off = { by, at: t, drawn: radius, expected };
      }
    }
    expect
      .soft(
        off.by,
        `at ${off.at}ms a corner is drawn ${off.drawn.toFixed(2)}px, the spring puts it at ${off.expected.toFixed(2)}px`,
      )
      .toBeLessThanOrEqual(TOLERANCE * Math.abs(rest - pressed) + 0.05);
    await page.mouse.up();
  });
}

test("under prefers-reduced-motion nothing is transitioned", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/button/figma");
  const button = page.locator('button[data-variant="filled"][data-size="md"]').first();
  await expect(button).toHaveCSS("transition-property", "none");
  await button.hover();
  await page.mouse.down();
  await expect(button).toHaveAttribute("data-pressed");
  await expect(button).toHaveCSS("transition-property", "none");
});

test("the pressed shape goes back when the press is released, also outside the button", async ({ page }) => {
  await page.goto("/button/figma");
  await page.addStyleTag({ content: "* { transition: none !important; }" });
  const button = page.locator('button[data-variant="filled"][data-size="md"]').first();
  const radius = () => button.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));

  await button.hover();
  await page.mouse.down();
  await expect(button).toHaveAttribute("data-pressed");
  expect(await radius()).toBe(16);
  await page.mouse.up();
  await expect(button).not.toHaveAttribute("data-pressed");
  expect(await radius()).toBe(28);

  // A press dragged off the button and released elsewhere.
  await button.hover();
  await page.mouse.down();
  await expect(button).toHaveAttribute("data-pressed");
  await page.mouse.move(2000, 2000);
  await page.mouse.up();
  await expect(button).not.toHaveAttribute("data-pressed");
  expect(await radius()).toBe(28);

  // Held Space, as a keyboard press.
  await button.focus();
  await page.keyboard.down(" ");
  await expect(button).toHaveAttribute("data-pressed");
  expect(await radius()).toBe(16);
  await page.keyboard.up(" ");
  await expect(button).not.toHaveAttribute("data-pressed");
  expect(await radius()).toBe(28);
});

test("a disabled button never takes the pressed shape", async ({ page }) => {
  await page.goto("/button/figma");
  const button = page.locator('button[data-variant="filled"][data-size="md"]').nth(1);
  await expect(button).toBeDisabled();
  await button.hover({ force: true });
  await page.mouse.down();
  await expect(button).not.toHaveAttribute("data-pressed");
  expect(await button.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBe(28);
  await page.mouse.up();
});
