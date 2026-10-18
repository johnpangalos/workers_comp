import { expect, test } from "@playwright/test";
import { expectToMatchFigma, loadFigmaNodes } from "./figma";

// Every entry of the Figma "Badge" component set against the rendered Badge: the values each is
// drawn with, exactly. A `> dot` entry is measured on the dot inside the matching badge.
const variants = loadFigmaNodes(new URL("../figma/badge.json", import.meta.url));

for (const [name, node] of Object.entries(variants)) {
  // "color=gray, state=focus > dot" → color "gray", state "focus", part "dot"
  const [variant, part] = name.split(" > ");
  const { color, state } = Object.fromEntries(variant!.split(", ").map((pair) => pair.split("=")));

  test(name, async ({ page }) => {
    await page.goto("/badge/figma");
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    // Wait for the label's font; before it loads the badge has the fallback font's width.
    await page.evaluate(() => document.fonts.load("600 12px Inter"));

    // The span badge for default; the link badge for focus, which takes keyboard focus the way a
    // person gives it.
    const badge =
      state === "focus"
        ? page.locator(`a[data-color="${color}"]`)
        : page.locator(`span[data-color="${color}"]:not([data-slot])`);
    if (state === "focus") {
      await page.keyboard.press("Tab"); // keyboard focus, so the focus ring shows
      await badge.focus();
    }

    await expectToMatchFigma(part === "dot" ? badge.locator('[data-slot="dot"]') : badge, node);
  });
}
