import { readFileSync } from "node:fs";
import { expect, type Locator, type TestInfo } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export type Region = { x: number; y: number; width: number; height: number };

/** A node as figma/export-node.ts describes it: where it is and the values it is drawn with. */
export type FigmaNode = Region & {
  fill: string | null;
  stroke: string | null;
  strokeWeight: number;
  radius: number;
  rings: [color: string, spread: number][];
  label: {
    x: number;
    y: number;
    height: number;
    color: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
  } | null;
};

/**
 * Reads a file written by figma/export-node.ts. Its last line is a hash of the rest, so a
 * copy that lost or changed a character throws here instead of testing against wrong numbers.
 */
export function loadFigmaNodes(url: URL): Record<string, FigmaNode> {
  const text = readFileSync(url, "utf8");
  const body = text.slice(0, text.lastIndexOf('  "hash"'));
  let hash = 5381;
  for (let i = 0; i < body.length; i++) hash = ((hash * 33) ^ body.charCodeAt(i)) >>> 0;
  const { variants, hash: expected } = JSON.parse(text);
  if (hash.toString(16) !== expected) {
    throw new Error(`${url.pathname} doesn't match its hash: export it from Figma again`);
  }
  return variants;
}

/** A 1x PNG exported from Figma (the Figma MCP's `get_screenshot`, contents only). */
export function loadFigmaExport(url: URL): PNG {
  return PNG.sync.read(readFileSync(url));
}

// Cuts `region` out of a Figma export, flattened onto white (exports are transparent).
function crop(source: PNG, region: Region): PNG {
  const out = new PNG({ width: region.width, height: region.height });
  for (let y = 0; y < region.height; y++) {
    for (let x = 0; x < region.width; x++) {
      const from = ((region.y + y) * source.width + region.x + x) * 4;
      const to = (y * region.width + x) * 4;
      const alpha = source.data[from + 3]! / 255;
      for (let c = 0; c < 3; c++) {
        out.data[to + c] = Math.round(source.data[from + c]! * alpha + 255 * (1 - alpha));
      }
      out.data[to + 3] = 255;
    }
  }
  return out;
}

/**
 * Compares a rendered element with its node in a Figma export.
 *
 * The element's box must be within a pixel of the Figma node's size: Figma snaps a text
 * box to whole pixels and a browser doesn't, so anything that hugs text differs by a
 * fraction. Then the pixels are compared, including `margin` px around the node (focus
 * rings and shadows paint outside it). Figma
 * and Chromium rasterise text differently, so a pixel only counts as different beyond
 * pixelmatch's `threshold`, and `maxDiffRatio` allows for glyph edges and for edges that
 * land on a fraction of a pixel. With the Button, a wrong border colour is 4.5% or more and
 * a correct variant is under 3.8%. The expected, actual and diff images are attached to the
 * test report.
 */
export async function expectToMatchFigma(
  element: Locator,
  figma: { image: PNG; node: Region },
  testInfo: TestInfo,
  { margin = 6, threshold = 0.1, maxDiffRatio = 0.04 } = {},
) {
  const box = await element.boundingBox();
  expect(box, "element is not rendered").not.toBeNull();
  for (const side of ["width", "height"] as const) {
    expect(
      Math.abs(box![side] - figma.node[side]),
      `${side} is ${box![side]}px, Figma's is ${figma.node[side]}px`,
    ).toBeLessThan(1);
  }

  const width = figma.node.width + margin * 2;
  const height = figma.node.height + margin * 2;
  const expected = crop(figma.image, {
    x: figma.node.x - margin,
    y: figma.node.y - margin,
    width,
    height,
  });
  const actual = PNG.sync.read(
    await element.page().screenshot({
      clip: { x: Math.round(box!.x) - margin, y: Math.round(box!.y) - margin, width, height },
    }),
  );
  const diff = new PNG({ width, height });
  const differing = pixelmatch(expected.data, actual.data, diff.data, width, height, { threshold });

  await testInfo.attach("figma", { body: PNG.sync.write(expected), contentType: "image/png" });
  await testInfo.attach("rendered", { body: PNG.sync.write(actual), contentType: "image/png" });
  await testInfo.attach("diff", { body: PNG.sync.write(diff), contentType: "image/png" });

  const ratio = differing / (width * height);
  testInfo.annotations.push({ type: "figma diff", description: `${differing} px (${(ratio * 100).toFixed(2)}%)` });
  expect(ratio, `${differing} of ${width * height} pixels differ from Figma`).toBeLessThanOrEqual(
    maxDiffRatio,
  );
}

/**
 * Compares the values an element is drawn with against its Figma node, exactly: fill,
 * border, radius, focus rings, and the label's colour, type and position. The pixel
 * comparison has to forgive text rendering, so a slightly wrong colour can slip through it;
 * this can't be fuzzy about one. Colours may differ by 1 of 255 per channel (rounding).
 */
export async function expectToMatchFigmaValues(element: Locator, figma: FigmaNode) {
  const rendered = await element.evaluate((el) => {
    // Any CSS colour (oklch included) → "#rrggbb", or null when fully transparent.
    const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    const hex = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return a === 0 ? null : "#" + [r!, g!, b!].map((c) => c.toString(16).padStart(2, "0")).join("");
    };
    const style = getComputedStyle(el);
    const border = parseFloat(style.borderTopWidth);
    // box-shadow layers that only spread are rings: [colour, spread], outermost first.
    const rings = style.boxShadow
      .split(/,(?![^(]*\))/)
      .map((layer) => layer.trim().match(/^(.+?) 0px 0px 0px (\d+)px$/))
      .flatMap((match) => (match && Number(match[2]) > 0 && hex(match[1]!) ? [[hex(match[1]!), Number(match[2])]] : []))
      .sort((a, b) => (b[1] as number) - (a[1] as number));
    return {
      fill: hex(style.backgroundColor),
      stroke: border > 0 ? hex(style.borderTopColor) : null,
      strokeWeight: border,
      radius: parseFloat(style.borderTopLeftRadius),
      rings,
      label: {
        x: parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth),
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
    if (actual === null || expected === null) return expect(actual, what).toBe(expected);
    const channels = (color: string) => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    const drift = channels(actual as string).map((c, i) => Math.abs(c - channels(expected)[i]!));
    expect(Math.max(...drift), `${what} is ${actual}, Figma's is ${expected}`).toBeLessThanOrEqual(1);
  };

  sameColor(rendered.fill, figma.fill, "fill");
  sameColor(rendered.stroke, figma.stroke, "border");
  expect(rendered.strokeWeight, "border width").toBe(figma.strokeWeight);
  expect(rendered.radius, "radius").toBe(figma.radius);
  // Figma can draw a ring another way (the ghost Button uses a rectangle); the pixels cover that.
  if (figma.rings.length > 0) {
    expect(rendered.rings.map(([, spread]) => spread), "ring widths").toEqual(figma.rings.map(([, spread]) => spread));
    figma.rings.forEach(([color], i) => sameColor(rendered.rings[i]![0], color, `ring ${i + 1}`));
  }
  if (figma.label) {
    const { color, ...label } = figma.label;
    const { color: renderedColor, ...renderedLabel } = rendered.label;
    sameColor(renderedColor, color, "text colour");
    expect(renderedLabel, "label position and type").toEqual(label);
  }
}
