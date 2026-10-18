import { expect, test } from "@playwright/test";
import { loadFigmaNodes } from "./figma";

// The Figma Chip's prototype transitions against the rendered Chip's CSS transitions: each
// default variant changes to its pressed one with Smart Animate, and the dots that change (the
// row's gap, each dot's width, corners and colour) must animate with the same duration and curve.
// The values come from figma/chip-motion.json, written by figma/export-motion.js.
type Motion = { trigger: string; transition: string; durationMs: number; easing: number[] | string };
const transitions = loadFigmaNodes(new URL("../figma/chip-motion.json", import.meta.url)) as unknown as Record<
  string,
  Motion
>;

for (const [name, motion] of Object.entries(transitions)) {
  // "muted=true, current=false, state=default -> muted=true, current=false, state=pressed"
  const [from] = name.split(" -> ");
  const { muted, current } = Object.fromEntries(from!.split(", ").map((pair) => pair.split("=")));
  const chipState = [muted === "true" && "muted", current === "true" && "current"].filter(Boolean).join("-") || "plain";

  test(name, async ({ page }) => {
    // A press, so a pressed state is what the transition leads to; the end state itself is
    // measured in chip.figma.spec.ts.
    expect(motion.trigger).toBe("ON_PRESS");
    expect(motion.transition).toBe("SMART_ANIMATE");
    expect(Array.isArray(motion.easing), "Figma's easing is a cubic-bezier curve").toBe(true);
    const curve = `cubic-bezier(${(motion.easing as number[]).join(", ")})`;

    await page.goto("/chip/figma");
    const chip = page.locator(`[data-figma-chip="${chipState}"] > a`);
    const parts = [chip.locator('[data-slot="dots"]'), ...(await chip.locator('[data-slot="dot"]').all())];
    for (const part of parts) {
      const css = await part.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          property: style.transitionProperty,
          duration: style.transitionDuration,
          timing: style.transitionTimingFunction,
        };
      });
      expect.soft(css.property, "transitioned properties").toBe("all");
      expect.soft(css.duration, "transition duration").toBe(`${motion.durationMs / 1000}s`);
      expect.soft(css.timing, "transition curve").toBe(curve);
    }
  });
}
