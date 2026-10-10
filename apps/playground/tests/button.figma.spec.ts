import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { expectToMatchFigma, loadFigmaExport, type Region } from "./figma";

// Every variant of the Figma "Button" component set against the rendered Button.
const set: { image: string; variants: Record<string, Region> } = JSON.parse(
  readFileSync(new URL("../figma/button.json", import.meta.url), "utf8"),
);
const image = loadFigmaExport(new URL(`../figma/${set.image}`, import.meta.url));

for (const [name, node] of Object.entries(set.variants)) {
  // "variant=outline, size=sm, state=hover" → { variant: "outline", size: "sm", state: "hover" }
  const { variant, size, state } = Object.fromEntries(name.split(", ").map((pair) => pair.split("=")));

  test(name, async ({ page }, testInfo) => {
    await page.goto("/button/figma");
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    // Wait for the label's font; before it loads the button has the fallback font's width.
    await page.evaluate(() => document.fonts.load(`600 14px Inter`));

    const button = page
      .locator(`button[data-variant="${variant}"][data-size="${size}"]`)
      .nth(state === "disabled" ? 1 : 0);
    if (state === "disabled") await expect(button).toBeDisabled();

    // Put the button in the Figma state the way a person would.
    if (state === "hover" || state === "active") await button.hover();
    if (state === "active") await page.mouse.down();
    if (state === "focus") {
      await page.keyboard.press("Tab"); // keyboard focus, so the focus ring shows
      await button.focus();
    }

    await expectToMatchFigma(button, { image, node }, testInfo);
  });
}
