import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";

export type Region = { x: number; y: number; width: number; height: number };

/** A node as the figma-flow skill's export-node describes it: where it is and the values it is drawn with. */
export type FigmaNode = Region & {
  fill: string | null;
  stroke: string | null;
  strokeWeight: number;
  radius: number;
  rings: [color: string, spread: number][];
  /**
   * A focus ring Figma draws as a separate frame around the box, which CSS draws as the box's
   * outline: its width, the gap from the box's edge to its inner edge, and its colour. Null where
   * there is none; absent from an older export, which isn't compared.
   */
  outline?: { width: number; offset: number; color: string } | null;
  /** Absolutely positioned children the export couldn't read as the outline, by layer name. */
  unmeasured?: string[];
  label: {
    x: number;
    y: number;
    height: number;
    color: string;
    /** Absent from an older export, which isn't compared. */
    fontFamily?: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
  } | null;
  /** Present when the node lays out two or more children. Padding is top, right, bottom, left. */
  layout?: { direction: "row" | "column"; gap: number; padding: [number, number, number, number] };
};

/**
 * Reads a file written in Figma (by the figma-flow skill's export-node, or a script in figma/). Its
 * last line is a hash of the rest, so a copy that lost or changed a character throws here instead
 * of testing against wrong numbers.
 */
export function loadFigmaExport(url: URL): Record<string, unknown> {
  const text = readFileSync(url, "utf8");
  const body = text.slice(0, text.lastIndexOf('  "hash"'));
  let hash = 5381;
  for (let i = 0; i < body.length; i++) hash = ((hash * 33) ^ body.charCodeAt(i)) >>> 0;
  const parsed = JSON.parse(text);
  if (hash.toString(16) !== parsed.hash) {
    throw new Error(`${url.pathname} doesn't match its hash: export it from Figma again`);
  }
  return parsed;
}

/**
 * What a format-2 export leaves out of a node because it is at its default (the figma-flow
 * skill's export-node says which). A label's typography defaults aren't measured here.
 */
const FORMAT_2_DEFAULTS = {
  fill: null,
  stroke: null,
  strokeWeight: 0,
  radius: 0,
  rings: [],
  label: null,
  outline: null,
  unmeasured: [],
};

/**
 * The nodes of a file written by the figma-flow skill's export-node. A format-2 export has its
 * omitted defaults put back; an older export is taken as it is.
 */
export function loadFigmaNodes(url: URL): Record<string, FigmaNode> {
  const { format, variants } = loadFigmaExport(url);
  if (format !== undefined && format !== 2) {
    throw new Error(`${url.pathname} is format ${JSON.stringify(format)}, which this helper doesn't read`);
  }
  const nodes = variants as Record<string, FigmaNode>;
  if (format !== 2) return nodes;
  return Object.fromEntries(
    Object.entries(nodes).map(([key, node]) => [key, { ...structuredClone(FORMAT_2_DEFAULTS), ...node }]),
  );
}

/**
 * Waits until the page's text is drawn in Inter. Call it after `page.goto` and before measuring:
 * in the fallback font, anything that hugs text has the wrong width.
 *
 * `document.fonts.load` alone isn't enough. In dev, React Router serves the route's CSS as a
 * critical-CSS stylesheet and, on hydration, swaps it for Vite's `<style>` tags. Each declares
 * Inter's `@font-face` again, and a face declared after the load starts unloaded, so the text
 * falls back until it loads. Once the critical CSS is gone the page has its final faces.
 */
export async function waitForInter(page: Page) {
  await page.waitForFunction(() => !document.querySelector("[data-react-router-critical-css]"));
  await page.evaluate(async () => {
    // Inter is one variable face (weights 100 to 900), so any weight loads it.
    await document.fonts.load("14px Inter");
    await document.fonts.ready;
  });
  if (test.info().project.name === "without preflight") await removePreflight(page);
}

/**
 * Takes Tailwind's preflight (its `@layer base`) out of the page, so the components are measured
 * as an app without Tailwind draws them: on the browser's own defaults, reset only by their
 * `preflight` class. The playground loads Tailwind for its own layout, which would otherwise
 * hide anything that class misses. The "without preflight" project runs every Figma spec this way.
 */
async function removePreflight(page: Page) {
  const removed = await page.evaluate(() => {
    let count = 0;
    for (const sheet of document.styleSheets) {
      for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
        const rule = sheet.cssRules[i];
        if (rule instanceof CSSLayerBlockRule && rule.name === "base") {
          sheet.deleteRule(i);
          count++;
        }
      }
    }
    return count;
  });
  expect(removed, "Tailwind's preflight (@layer base) was not found on the page").toBeGreaterThan(0);
}

/**
 * Compares the values an element is drawn with against its Figma node, exactly: size, fill,
 * border, radius, focus rings (spread shadows, or an outline), and the label's colour, family,
 * type and position. Screenshots are
 * for a person or a model to look at; this is the part that can't be fuzzy.
 *
 * Two allowances. The box may be under a pixel off: Figma snaps a text box to whole pixels
 * and a browser doesn't, so anything that hugs text differs by a fraction. Colours may
 * differ by 1 of 255 per channel (rounding).
 *
 * Every comparison is soft: one run reports each value that differs, not only the first.
 *
 * Pass `width: false` where the width can't be compared: the element's text differs from the
 * Figma node's (a state variant labelled "Tab"), or it holds several text-hugging children,
 * whose fractions add up past a pixel.
 */
export async function expectToMatchFigma(element: Locator, figma: FigmaNode, { width = true } = {}) {
  const box = await element.boundingBox();
  expect(box, "element is not rendered").not.toBeNull(); // hard: nothing else can be measured
  const sides: ("width" | "height")[] = ["height"];
  if (width) sides.unshift("width");
  for (const side of sides) {
    expect
      .soft(Math.abs(box![side] - figma[side]), `${side} is ${box![side]}px, Figma's is ${figma[side]}px`)
      .toBeLessThan(1);
  }

  const rendered = await element.evaluate((el) => {
    // Any CSS colour (oklch included) → "#rrggbb", or null when fully transparent.
    const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    const hex = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      if (a === 0) return null;
      return "#" + [r!, g!, b!].map((c) => c.toString(16).padStart(2, "0")).join("");
    };
    const style = getComputedStyle(el);
    const border = parseFloat(style.borderTopWidth);
    // box-shadow layers that only spread are rings: [colour, spread], outermost first.
    const rings = style.boxShadow
      .split(/,(?![^(]*\))/)
      .map((layer) => layer.trim().match(/^(.+?) 0px 0px 0px (\d+)px$/))
      .filter((match) => match && Number(match[2]) > 0 && hex(match[1]!))
      .map((match) => [hex(match![1]!), Number(match![2])])
      .sort((a, b) => (b[1] as number) - (a[1] as number));
    const px = (value: string) => parseFloat(value) || 0;
    // Where the label's text starts, measured from the element's left edge. Not the padding: after
    // a leading child (a dot, with its gap) the text starts further in.
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let first: Text | null = null;
    let last: Text | null = null;
    for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
      if (!/\S/.test(node.data)) continue;
      first ??= node;
      last = node;
    }
    let labelX = px(style.paddingLeft) + border;
    if (first && last) {
      const range = document.createRange();
      range.setStart(first, 0);
      range.setEnd(last, last.length);
      labelX = range.getBoundingClientRect().left - el.getBoundingClientRect().left;
    }
    let direction: "row" | "column" = "row";
    let gap = px(style.columnGap);
    if (style.flexDirection.startsWith("column")) {
      direction = "column";
      gap = px(style.rowGap);
    }
    let stroke: string | null = null;
    if (border > 0) stroke = hex(style.borderTopColor);
    return {
      layout: {
        direction,
        gap,
        // Figma's padding is measured from the node's edge, so a border counts towards it.
        padding: (["Top", "Right", "Bottom", "Left"] as const).map(
          (side) => px(style[`padding${side}`]) + px(style[`border${side}Width`]),
        ),
      },
      fill: hex(style.backgroundColor),
      stroke,
      strokeWeight: border,
      radius: parseFloat(style.borderTopLeftRadius),
      rings,
      // Its width is 0 when the outline is off.
      outline: {
        width: px(style.outlineWidth) * Number(style.outlineStyle !== "none"),
        offset: px(style.outlineOffset),
        color: hex(style.outlineColor),
        style: style.outlineStyle,
      },
      // The first family the label is set in, unquoted.
      fontFamily: style.fontFamily
        .split(",")[0]!
        .trim()
        .replace(/^["']|["']$/g, ""),
      label: {
        x: labelX,
        y: parseFloat(style.paddingTop) + border,
        height: parseFloat(style.lineHeight),
        color: hex(style.color),
        fontSize: parseFloat(style.fontSize),
        fontWeight: Number(style.fontWeight),
        lineHeight: parseFloat(style.lineHeight),
      },
    };
  });

  const sameColor = (actual: unknown, expected: string | null, what: string) => {
    if (actual === null || expected === null) return expect.soft(actual, what).toBe(expected);
    const channels = (color: string) => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    const drift = channels(actual as string).map((c, i) => Math.abs(c - channels(expected)[i]!));
    expect.soft(Math.max(...drift), `${what} is ${actual}, Figma's is ${expected}`).toBeLessThanOrEqual(1);
  };

  sameColor(rendered.fill, figma.fill, "fill");
  sameColor(rendered.stroke, figma.stroke, "border");
  expect.soft(rendered.strokeWeight, "border width").toBe(figma.strokeWeight);
  // A radius past half the box is drawn as half the box: rounded-full computes to a huge value
  // where Figma says 9999. Both sides are clamped to the box each is drawn in, which is exact.
  const drawn = (radius: number, { width, height }: Region) => Math.min(radius, Math.min(width, height) / 2);
  expect.soft(drawn(rendered.radius, box!), "radius").toBe(drawn(figma.radius, figma));
  // Figma can draw a ring another way (the ghost Button uses a rectangle), which this can't read.
  if (figma.rings.length > 0) {
    expect
      .soft(
        rendered.rings.map(([, spread]) => spread),
        "ring widths",
      )
      .toEqual(figma.rings.map(([, spread]) => spread));
    figma.rings.forEach(([color], i) => sameColor(rendered.rings[i]?.[0] ?? null, color, `ring ${i + 1}`));
  }
  // A focus ring Figma draws as a separate frame is the element's outline in CSS: solid, at the
  // ring's width, offset and colour. Where a format-2 export says there is none, none is drawn.
  if (figma.outline) {
    expect.soft(rendered.outline.style, "outline style").toBe("solid");
    expect.soft(rendered.outline.width, "outline width").toBe(figma.outline.width);
    expect.soft(rendered.outline.offset, "outline offset").toBe(figma.outline.offset);
    sameColor(rendered.outline.color, figma.outline.color, "outline colour");
  }
  if (figma.outline === null) expect.soft(rendered.outline.width, "outline width").toBe(0);
  // A child the export couldn't read isn't compared; say so rather than pass quietly.
  expect.soft(figma.unmeasured ?? [], "layers the export couldn't read as the outline").toEqual([]);
  if (figma.layout) expect.soft(rendered.layout, "direction, gap and padding").toEqual(figma.layout);
  if (figma.label) {
    const { color, fontFamily, ...label } = figma.label;
    const { color: renderedColor, ...renderedLabel } = rendered.label;
    sameColor(renderedColor, color, "text colour");
    if (fontFamily !== undefined) expect.soft(rendered.fontFamily, "font family").toBe(fontFamily);
    expect.soft(renderedLabel, "label position and type").toEqual(label);
  }
}
