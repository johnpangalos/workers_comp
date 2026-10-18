import { expect, test } from "@playwright/test";
import { expectToMatchFigma, loadFigmaNodes } from "./figma";

// Every entry of the Figma "Chip" component set against the rendered Chip: the values each is
// drawn with, exactly. "muted=true" is the muted chip; the rest are the plain one.
const variants = loadFigmaNodes(new URL("../figma/chip.json", import.meta.url));

for (const [name, node] of Object.entries(variants)) {
  // "muted=true, state=focus" → muted "true", state "focus"
  const { muted, state } = Object.fromEntries(name.split(", ").map((pair) => pair.split("=")));

  test(name, async ({ page }) => {
    await page.goto("/chip/figma");
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    // Wait for the label's font; before it loads the chip has the fallback font's width.
    await page.evaluate(() => document.fonts.load("600 14px Inter"));

    const chip = page.locator(muted === "true" ? "a[data-muted]" : "a:not([data-muted])");
    if (state === "hover") await chip.hover();
    if (state === "focus") {
      await page.keyboard.press("Tab"); // keyboard focus, so the focus ring shows
      await chip.focus();
    }

    await expectToMatchFigma(chip, node);
  });
}
