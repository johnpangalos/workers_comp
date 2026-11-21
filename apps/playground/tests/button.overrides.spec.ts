import { expect, test } from "@playwright/test";

// The Button's styles are in @layer components, so an app's utilities in `className` win
// without !important. /button/overrides passes `rounded-none` and a border colour.
test("className overrides the Button's own styles", async ({ page }) => {
  await page.goto("/button/overrides");
  await page.addStyleTag({ content: "* { transition: none !important; }" });

  const radius = (name: string) =>
    page
      .getByRole("button", { name, exact: true })
      .evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));
  expect(await radius("Default")).toBe(28);
  expect(await radius("Square")).toBe(0);
  expect(await radius("Disabled square")).toBe(0);

  // Pressed, the Button's own radius is the size's; the consumer's still wins.
  await page.getByRole("button", { name: "Default", exact: true }).hover();
  await page.mouse.down();
  await expect(page.getByRole("button", { name: "Default", exact: true })).toHaveAttribute("data-pressed");
  expect(await radius("Default")).toBe(16);
  await page.mouse.up();
  await page.getByRole("button", { name: "Square", exact: true }).hover();
  await page.mouse.down();
  await expect(page.getByRole("button", { name: "Square", exact: true })).toHaveAttribute("data-pressed");
  expect(await radius("Square")).toBe(0);
  await page.mouse.up();

  const outlined = page.getByRole("button", { name: "Full-width outlined, recoloured" });
  const gray400 = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("i"));
    probe.className = "text-gray-400";
    const { color } = getComputedStyle(probe);
    probe.remove();
    return color;
  });
  await expect(outlined).toHaveCSS("border-top-color", gray400);
  await expect(outlined).toHaveCSS("width", "256px");
});
