import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectToMatchFigma, loadFigmaNodes, waitForInter } from "./figma";

// Every entry of the Figma "TextField" component set against the rendered TextFields on the figma
// page: the values each is drawn with, exactly. A variant's entry is the whole field; a
// `<variant> > <text>` entry is one of its children (the label, the input, the description or the
// error message), whose x and y are its place in the field.
const variants = loadFigmaNodes(new URL("../figma/text-field.json", import.meta.url));

/** Presses Tab, as a person would, until `element` has focus. */
async function tabTo(page: Page, element: Locator) {
  for (let presses = 0; presses < 20; presses++) {
    if (await element.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(element).toBeFocused();
}

/** The parts of the TextField in the wrapper for "state=hover, invalid=true" ("hover-true"). */
function field(page: Page, state: string, invalid: string) {
  const wrapper = page.locator(`[data-figma-field="${state}-${invalid}"]`);
  return {
    wrapper,
    root: wrapper.locator("> div"),
    label: wrapper.locator("label"),
    input: wrapper.locator("input"),
    description: wrapper.locator('[id$="-description"]'),
    error: wrapper.getByRole("alert"),
  };
}

for (const [name, node] of Object.entries(variants)) {
  // "state=hover, invalid=true > Email" → { state: "hover", invalid: "true" } and the child "Email".
  const [key, child] = name.split(" > ");
  const { state, invalid } = Object.fromEntries(key!.split(", ").map((pair) => pair.split("=")));

  test(name, async ({ page }) => {
    await page.goto("/text-field/figma");
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    await waitForInter(page);

    const parts = field(page, state!, invalid!);
    if (state === "disabled") await expect(parts.input).toBeDisabled();

    // Put the field in the Figma state the way a person would.
    if (state === "hover") await parts.input.hover();
    if (state === "focus") await tabTo(page, parts.input); // keyboard focus, so the focus ring shows

    let element = parts.root;
    if (child !== undefined) {
      // The text of each part the field shows, read at once (a valid field has no error message).
      const texts = await parts.wrapper.evaluate((el) => ({
        label: el.querySelector("label")?.textContent,
        description: el.querySelector('[id$="-description"]')?.textContent,
        error: el.querySelector('[role="alert"]')?.textContent,
      }));
      element = parts.input;
      if (child === texts.label) element = parts.label;
      if (child === texts.description) element = parts.description;
      if (child === texts.error) element = parts.error;
      if (element === parts.input) {
        // The input's entry is named for the text it shows: the value, or else the placeholder.
        const shown = (await parts.input.inputValue()) || (await parts.input.getAttribute("placeholder"));
        expect(shown, "the input shows the Figma text").toBe(child);
      }
    }

    await expectToMatchFigma(element, node);
    if (child !== undefined) {
      // A child's place in the field, from the field's edge.
      const [box, parentBox] = [await element.boundingBox(), await parts.root.boundingBox()];
      expect(box!.x - parentBox!.x, "x in the field").toBeCloseTo(node.x, 0);
      expect(box!.y - parentBox!.y, "y in the field").toBeCloseTo(node.y, 0);
    }
  });
}

// What the entries above can't say on their own.

test("a valid field shows no error message, as in Figma", async ({ page }) => {
  await page.goto("/text-field/figma");
  for (const state of ["default", "hover", "focus", "disabled"]) {
    await expect(field(page, state, "false").error).toHaveCount(0);
    await expect(field(page, state, "true").error).toHaveCount(1);
  }
});

/** The colour `element` (or its `::placeholder`) is drawn in, as "#rrggbb". */
function drawnColor(element: Locator, pseudo: string | null = null) {
  return element.evaluate((el, pseudo) => {
    const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    context.fillStyle = getComputedStyle(el, pseudo).color;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return "#" + [r!, g!, b!].map((c) => c.toString(16).padStart(2, "0")).join("");
  }, pseudo);
}

/** The largest difference between two "#rrggbb" colours in any channel. */
function drift(actual: string, expected: string) {
  const channels = (color: string) => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  return Math.max(...channels(actual).map((c, i) => Math.abs(c - channels(expected)[i]!)));
}

test("the placeholder is drawn in the colour of Figma's placeholder text", async ({ page }) => {
  await page.goto("/text-field/figma");
  await waitForInter(page);
  await page.addStyleTag({ content: "* { transition: none !important; }" });
  for (const state of ["default", "hover", "disabled"]) {
    const { input } = field(page, state, "false");
    if (state === "hover") await input.hover();
    const figma = variants[`state=${state}, invalid=false > you@example.com`]!.label!.color;
    const drawn = await drawnColor(input, "::placeholder");
    expect(
      drift(drawn, figma),
      `state=${state}: placeholder is ${drawn}, Figma's is ${figma}`,
    ).toBeLessThanOrEqual(1);
  }
});

test("text typed into a valid field is drawn in the colour of Figma's value text", async ({ page }) => {
  await page.goto("/text-field/figma");
  await waitForInter(page);
  await page.addStyleTag({ content: "* { transition: none !important; }" });
  const { input } = field(page, "default", "false");
  await tabTo(page, input);
  await page.keyboard.type("jane.doe@");
  await expect(input).toHaveValue("jane.doe@");
  const figma = variants["state=default, invalid=true > jane.doe@"]!.label!.color;
  const drawn = await drawnColor(input);
  expect(drift(drawn, figma), `typed text is ${drawn}, Figma's is ${figma}`).toBeLessThanOrEqual(1);
});

test("hover draws nothing on a disabled field", async ({ page }) => {
  await page.goto("/text-field/figma");
  const { input } = field(page, "disabled", "false");
  await input.hover({ force: true });
  await expect(input).not.toHaveAttribute("data-hovered");
});
