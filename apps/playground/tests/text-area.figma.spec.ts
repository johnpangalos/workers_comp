import { expect, test } from "@playwright/test";
import { expectToMatchFigma, loadFigmaNodes, waitForInter } from "./figma";

// Every entry of the Figma "TextArea" component set against the rendered TextArea on the figma page:
// the values each is drawn with, exactly. "state=…, invalid=…" is the field (the column of label,
// textarea, description and error message); "state=…, invalid=… > What happened, …" is the
// textarea inside it, whose y is its place in the field.
const variants = loadFigmaNodes(new URL("../figma/text-area.json", import.meta.url));

for (const [name, node] of Object.entries(variants)) {
  // "state=hover, invalid=true > What happened…" → { state: "hover", invalid: "true" } and the child.
  const [key, child] = name.split(" > ");
  const { state, invalid } = Object.fromEntries(key!.split(", ").map((pair) => pair.split("=")));

  test(name, async ({ page }) => {
    await page.goto("/text-area/figma");
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    await waitForInter(page);

    const field = page.locator(`[data-figma="${state}-${invalid}"] > div`);
    const textarea = field.getByRole("textbox");
    if (invalid === "true") await expect(textarea).toHaveAttribute("aria-invalid", "true");
    if (invalid === "false") await expect(textarea).not.toHaveAttribute("aria-invalid");

    // Put the textarea in the Figma state the way a person would.
    if (state === "hover") await textarea.hover();
    if (state === "focus") {
      await page.keyboard.press("Tab"); // keyboard focus, so the focus ring shows
      await textarea.focus();
      await expect(textarea).toHaveAttribute("data-focus-visible");
    }
    if (state === "disabled") await expect(textarea).toBeDisabled();

    if (child === undefined) {
      await expectToMatchFigma(field, node);
      return;
    }
    await expectToMatchFigma(textarea, node);
    // The textarea's place in the field, from the field's edge.
    const [box, fieldBox] = [await textarea.boundingBox(), await field.boundingBox()];
    expect(box!.x - fieldBox!.x, "x in the field").toBeCloseTo(node.x, 0);
    expect(box!.y - fieldBox!.y, "y in the field").toBeCloseTo(node.y, 0);
  });
}

// Figma draws the placeholder as the textarea's text, so the measurement reads it as the textarea's
// colour. Check the placeholder itself is drawn in that colour too, and that typed text is the
// gray-900 Figma draws the label in.
test("TextArea: the placeholder is drawn in Figma's text colour, and typed text in gray-900", async ({
  page,
}) => {
  await page.goto("/text-area/figma");
  await page.addStyleTag({ content: "* { transition: none !important; }" });
  await waitForInter(page);
  // Any CSS colour (oklch included) → "#rrggbb", as tests/figma.ts reads them.
  const colorOf = (state: string, pseudo: string | null) =>
    page.locator(`[data-figma="${state}-false"] textarea`).evaluate((el, pseudo) => {
      const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
      context.fillStyle = getComputedStyle(el, pseudo).color;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
      return "#" + [r!, g!, b!].map((c) => c.toString(16).padStart(2, "0")).join("");
    }, pseudo);
  const figmaText = (state: string) =>
    variants[`state=${state}, invalid=false > What happened, and how were you hurt?`]!.label!.color;
  expect(await colorOf("default", "::placeholder")).toBe(figmaText("default"));
  expect(await colorOf("disabled", "::placeholder")).toBe(figmaText("disabled"));

  await page.locator('[data-figma="default-false"] textarea').click();
  await page.keyboard.type("Slipped on ice");
  expect(await colorOf("default", null)).toBe(variants["state=default, invalid=false"]!.label!.color);
});
