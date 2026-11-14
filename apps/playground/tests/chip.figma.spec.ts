import { test } from "@playwright/test";
import { expectToMatchFigma, loadFigmaNodes, waitForInter } from "./figma";

// Every variant of the Figma "Chip" component set against the rendered Chip: the values each is
// drawn with, exactly.
const variants = loadFigmaNodes(new URL("../figma/chip.json", import.meta.url));

for (const [name, node] of Object.entries(variants)) {
  // "muted=false, current=false, state=focus" → muted "false", current "false", state "focus".
  const { muted, current, state } = Object.fromEntries(name.split(", ").map((pair) => pair.split("=")));
  // The wrapper on the figma page that holds this state: "plain", "muted-current", and so on.
  const chipState =
    [muted === "true" && "muted", current === "true" && "current"].filter(Boolean).join("-") || "plain";

  test(name, async ({ page }) => {
    await page.goto("/chip/figma");
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    await waitForInter(page);

    const chip = page.locator(`[data-figma-chip="${chipState}"] > a`);
    if (state === "hover") await chip.hover();
    if (state === "focus") {
      await page.keyboard.press("Tab"); // keyboard focus, so the focus ring shows
      await chip.focus();
    }
    if (state === "pressed") {
      await chip.hover();
      await page.mouse.down(); // held down: the chip is pressed
    }
    await expectToMatchFigma(chip, node);
  });
}
