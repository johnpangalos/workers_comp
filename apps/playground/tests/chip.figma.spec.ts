import { expect, test } from "@playwright/test";
import { expectToMatchFigma, loadFigmaNodes } from "./figma";

// Every entry of the Figma "Chip" component set against the rendered Chip: the values each is
// drawn with, exactly. A `> underline` entry is measured on the underline inside the matching chip.
const variants = loadFigmaNodes(new URL("../figma/chip.json", import.meta.url));

for (const [name, node] of Object.entries(variants)) {
  // "muted=true, current=false, state=focus > underline" → muted "true", current "false",
  // state "focus", part "underline"
  const [variant, part] = name.split(" > ");
  const { muted, current, state } = Object.fromEntries(variant!.split(", ").map((pair) => pair.split("=")));
  // The wrapper on the figma page that holds this state: "plain", "muted-current", and so on.
  const chipState = [muted === "true" && "muted", current === "true" && "current"].filter(Boolean).join("-") || "plain";

  test(name, async ({ page }) => {
    await page.goto("/chip/figma");
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    // Wait for the label's font; before it loads the chip has the fallback font's width.
    await page.evaluate(() => document.fonts.load("700 14px Inter"));

    const chip = page.locator(`[data-figma-chip="${chipState}"] > a`);
    if (state === "hover") await chip.hover();
    if (state === "focus") {
      await page.keyboard.press("Tab"); // keyboard focus, so the focus ring shows
      await chip.focus();
    }

    await expectToMatchFigma(part === "underline" ? chip.locator('[data-slot="underline"]') : chip, node);
  });
}
