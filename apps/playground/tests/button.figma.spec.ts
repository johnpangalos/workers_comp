import { expect, test } from "@playwright/test";
import { expectToMatchFigma, loadFigmaNodes, waitForInter } from "./figma";

// Every variant of the Figma "Button" component set against the rendered Button: the values
// each is drawn with, exactly. The set is exported one `variant` at a time (the whole set is
// over the size a Figma call can return), so each file holds one variant's sizes and states.
for (const file of ["filled", "tonal", "outlined", "text", "accent"]) {
  const variants = loadFigmaNodes(new URL(`../figma/button-${file}.json`, import.meta.url));

  for (const [name, node] of Object.entries(variants)) {
    // "variant=outlined, size=sm, state=hover" → { variant: "outlined", size: "sm", state: "hover" }
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
      if (state === "hover") await expect(button).toHaveAttribute("data-hovered");
      if (state === "active") {
        await page.mouse.down();
        await expect(button).toHaveAttribute("data-pressed");
      }
      if (state === "focus") {
        await page.keyboard.press("Tab"); // keyboard focus, so the focus ring shows
        await button.focus();
        await expect(button).toHaveAttribute("data-focus-visible");
      }

      await expectToMatchFigma(button, node);
    });
  }
}
