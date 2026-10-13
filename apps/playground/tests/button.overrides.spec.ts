import { expect, test } from "@playwright/test";

// The Button's styles are in @layer components, so an app's utilities in `className` win
// without !important. /button/overrides passes `rounded-full` and a border colour.
test("className overrides the Button's own styles", async ({ page }) => {
  await page.goto("/button/overrides");

  const radius = (name: string) =>
    page.getByRole("button", { name, exact: true }).evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));
  expect(await radius("Default")).toBe(6);
  expect(await radius("Pill")).toBeGreaterThan(1000);
  expect(await radius("Disabled pill")).toBeGreaterThan(1000);

  const outline = page.getByRole("button", { name: "Full-width outline, recoloured" });
  const fuchsia700 = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("i"));
    probe.className = "text-fuchsia-700";
    const { color } = getComputedStyle(probe);
    probe.remove();
    return color;
  });
  await expect(outline).toHaveCSS("border-top-color", fuchsia700);
  await expect(outline).toHaveCSS("width", "256px");
});
