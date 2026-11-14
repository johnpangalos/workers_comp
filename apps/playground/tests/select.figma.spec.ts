import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectToMatchFigma, loadFigmaNodes, waitForInter } from "./figma";

// Every entry of the Figma "Select" export (the SelectTrigger and SelectOption variants, the Listbox
// and its Options, and the field's two variants) against the rendered Selects on the figma page: the
// values each is drawn with, exactly. A `> child` entry is the child inside its parent, and its place
// in the parent is compared too: these children sit in a column, so their x is exact as well as y.
const nodes = loadFigmaNodes(new URL("../figma/select.json", import.meta.url));

// Opens a Select the way a person does, with a click on its trigger, and returns its listbox.
async function open(page: Page, wrapper: string) {
  await page.locator(`[data-figma="${wrapper}"]`).getByRole("button").click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  return listbox;
}

for (const [name, node] of Object.entries(nodes)) {
  const [key, child] = name.split(" > ");

  test(name, async ({ page }) => {
    await page.goto("/select/figma");
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    await waitForInter(page);

    let element: Locator;
    let parent: Locator | null = null;
    let width = true;

    if (key!.startsWith("SelectTrigger/")) {
      // "SelectTrigger/state=hover, invalid=true" → the trigger in the wrapper "hover-true".
      const { state, invalid } = Object.fromEntries(
        key!
          .slice("SelectTrigger/".length)
          .split(", ")
          .map((pair) => pair.split("=")),
      );
      element = page.locator(`[data-figma-trigger="${state}-${invalid}"]`).getByRole("button");
      // Put the trigger in the Figma state the way a person would.
      if (state === "hover") await element.hover();
      if (state === "focus") {
        await page.keyboard.press("Tab"); // keyboard focus, so the focus ring shows
        await element.focus();
      }
      if (state === "disabled") await expect(element).toBeDisabled();
      if (state === "open") {
        await element.click();
        await expect(element).toHaveAttribute("aria-expanded", "true");
      }
    } else if (key!.startsWith("SelectOption/")) {
      // The four options of the "options" Select are the four states: open it and point at the
      // highlighted one, which moves focus (and the highlight) off the selected one.
      const state = key!.slice("SelectOption/state=".length);
      const listbox = await open(page, "options");
      await listbox.locator('[data-value="highlighted"]').hover();
      await expect(listbox.locator('[data-value="highlighted"]')).toBeFocused();
      element = listbox.locator(`[data-value="${state}"]`);
      if (state === "selected") await expect(element).toHaveAttribute("aria-selected", "true");
      if (state === "disabled") await expect(element).toHaveAttribute("aria-disabled", "true");
      // Figma's variants hug their label; in a listbox an option fills it, as the Listbox's own
      // options do in Figma, whose width the "Options > …" entries compare.
      width = false;
    } else if (key === "Listbox" || key === "Options") {
      // Back is selected and the pointer is on Shoulder, as in Figma.
      const listbox = await open(page, "listbox");
      const shoulder = listbox.getByRole("option", { name: "Shoulder" });
      await shoulder.hover();
      await expect(shoulder).toBeFocused();
      const options = listbox.locator(":scope > div");
      element = listbox;
      if (key === "Options") element = options;
      if (child !== undefined) {
        parent = options;
        element = listbox.getByRole("option", { name: child, exact: true });
      }
    } else {
      // "Select/invalid=true" → the field in the wrapper "field-true"; its child is the trigger.
      const invalid = key!.slice("Select/invalid=".length);
      const field = page.locator(`[data-figma="field-${invalid}"] > [data-slot="select"]`);
      element = field;
      if (child !== undefined) {
        parent = field;
        element = field.getByRole("button");
      }
    }

    await expectToMatchFigma(element, node, { width });
    if (parent) {
      // A child's place in its parent, from the parent's edge (the parent's padding counts).
      const [box, parentBox] = [await element.boundingBox(), await parent.boundingBox()];
      expect(box!.x - parentBox!.x, "x in the parent").toBeCloseTo(node.x, 0);
      expect(box!.y - parentBox!.y, "y in the parent").toBeCloseTo(node.y, 0);
    }
  });
}

test("Listbox: it opens below the trigger, spacing/1 (4px) away, and as wide as it", async ({ page }) => {
  await page.goto("/select/figma");
  await waitForInter(page);
  const trigger = page.locator('[data-figma="listbox"]').getByRole("button");
  const listbox = await open(page, "listbox");
  const [triggerBox, listboxBox] = [await trigger.boundingBox(), await listbox.boundingBox()];
  expect(listboxBox!.x).toBeCloseTo(triggerBox!.x, 0);
  expect(listboxBox!.y - (triggerBox!.y + triggerBox!.height)).toBeCloseTo(4, 0);
  expect(listboxBox!.width).toBeCloseTo(triggerBox!.width, 0);
});
