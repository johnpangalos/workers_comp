import { readFileSync } from "node:fs";
import { expect, type Locator, type TestInfo } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export type Region = { x: number; y: number; width: number; height: number };

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
