import { expect, test } from "@playwright/test";
import { expectToMatchFigma, loadFigmaNodes } from "./figma";

// Every entry of the Figma "Chip" component set against the rendered Chip: the values each is
// drawn with, exactly. A `> underline` entry is measured on the underline inside the matching chip.
// A `fill muted=…, current=…` entry is the fuchsia slab that covers the chip while it is pressed.
const variants = loadFigmaNodes(new URL("../figma/chip.json", import.meta.url));

for (const [name, node] of Object.entries(variants)) {
  // "Chip/muted=false, current=false, state=focus > underline" → muted "false", current "false",
  // state "focus", part "underline". "fill muted=true, current=false" → the fill, no state.
  const [key, part] = name.replace(/^Chip\//, "").split(" > ");
  const isFill = key!.startsWith("fill ");
  const { muted, current, state } = Object.fromEntries(
    (isFill ? key!.slice("fill ".length) : key!).split(", ").map((pair) => pair.split("=")),
  );
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
    if (state === "pressed" || isFill) {
      await chip.hover();
      await page.mouse.down(); // held down: the chip is pressed
    }

    const target =
      part === "underline"
        ? chip.locator('[data-slot="underline"]')
        : isFill
          ? chip.locator('[data-slot="fill"]')
          : chip;
    await expectToMatchFigma(target, node);
    if (isFill) {
      // The slab's size and colour hold whether or not it has slid up, so check where it is: held
      // down, it covers the chip exactly (Figma's x 0, y 0 in the chip), not below it.
      const [fill, box] = [await target.boundingBox(), await chip.boundingBox()];
      expect(fill!.x - box!.x, "fill x in the chip").toBeCloseTo(node.x, 0);
      expect(fill!.y - box!.y, "fill y in the chip").toBeCloseTo(node.y, 0);
    }
  });
}
