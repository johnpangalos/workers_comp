import { expect, test } from "@playwright/test";
import { waitForInter } from "./figma";

// A native checkbox, radio and select inside a TabPanel keep the browser's appearance and a size:
// the components' reset (preflight) reaches an element's own controls, not these.
test("native controls inside a TabPanel keep their browser appearance and size", async ({ page }) => {
  await page.goto("/tabs/native-controls");
  await waitForInter(page);

  const controls = [
    page.getByRole("checkbox", { name: "Email me" }),
    page.getByRole("radio", { name: "Daily" }),
    page.getByRole("radio", { name: "Weekly" }),
    page.getByRole("combobox"),
  ];
  for (const control of controls) {
    await expect(control).toBeVisible();
    const drawn = await control.evaluate((el) => {
      const { width, height } = el.getBoundingClientRect();
      return { appearance: getComputedStyle(el).appearance, width, height };
    });
    expect(drawn.appearance, "appearance").not.toBe("none");
    expect(drawn.width, "width").toBeGreaterThan(0);
    expect(drawn.height, "height").toBeGreaterThan(0);
  }
});
