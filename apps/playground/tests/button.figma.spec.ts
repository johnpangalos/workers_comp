import { expect, test } from "@playwright/test";
import { expectToMatchFigma, loadFigmaNodes, waitForInter } from "./figma";

// Every variant of the Figma "Button" component set against the rendered Button: the values
// each is drawn with, exactly.
const variants = loadFigmaNodes(new URL("../figma/button.json", import.meta.url));

for (const [name, node] of Object.entries(variants)) {
  // "variant=outline, size=sm, state=hover" → { variant: "outline", size: "sm", state: "hover" }
  const { variant, size, state } = Object.fromEntries(name.split(", ").map((pair) => pair.split("=")));

  test(name, async ({ page }) => {
    await page.goto("/button/figma");
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    await waitForInter(page);

    let index = 0;
    if (state === "disabled") index = 1;
    const button = page.locator(`button[data-variant="${variant}"][data-size="${size}"]`).nth(index);
    if (state === "disabled") await expect(button).toBeDisabled();

    // Put the button in the Figma state the way a person would.
    if (state === "hover" || state === "active") await button.hover();
    if (state === "active") await page.mouse.down();
    if (state === "focus") {
      await page.keyboard.press("Tab"); // keyboard focus, so the focus ring shows
      await button.focus();
    }

    await expectToMatchFigma(button, node);
  });
}
