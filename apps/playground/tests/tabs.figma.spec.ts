import { expect, test, type Locator } from "@playwright/test";
import { expectToMatchFigma, loadFigmaNodes, waitForInter } from "./figma";

// Every entry of the Figma "Tabs" node set (Tab, TabList, TabPanel and Tabs) against the rendered
// tabs on the figma page: the values each is drawn with, exactly. A `> child` entry is the child
// inside its parent: its y is its place in the parent, and its x too for the first child.
const variants = loadFigmaNodes(new URL("../figma/tabs.json", import.meta.url));

// The entries whose x is their place in the parent. The other children's x comes from the widths
// of the text before them, which add up past a pixel, so only their y is compared.
const firstChildren = ["TabList > Overview", "Tabs > TabList", "Tabs > Overview panel"];

// The entries that hold several text-hugging children: their width can't be compared exactly.
const holdChildren = ["TabList", "Tabs", "Tabs > TabList"];

for (const [name, node] of Object.entries(variants)) {
  // "Tab/selected=false, state=hover" → the Tab in the wrapper "false-hover". "TabList > Overview" →
  // the Overview tab inside the TabList. "Tabs > Overview panel" → the panel inside the Tabs.
  const [key, child] = name.split(" > ");

  test(name, async ({ page }) => {
    await page.goto("/tabs/figma");
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    await waitForInter(page);

    const tablist = page.locator('[data-figma="tablist"] [role="tablist"]');
    const tabsRoot = page.locator('[data-figma="tabs"] > [data-slot="tabs"]');
    const tabsTablist = page.locator('[data-figma="tabs"] [role="tablist"]');
    const tabsPanels = page.locator('[data-figma="tabs"] [role="tabpanel"]');
    let element: Locator;
    let parent: Locator | null = null;

    if (key!.startsWith("Tab/")) {
      // "selected=false, state=hover" → the wrapper "false-hover".
      const { selected, state } = Object.fromEntries(
        key!
          .slice("Tab/".length)
          .split(", ")
          .map((pair) => pair.split("=")),
      );
      element = page.locator(`[data-figma-tab="${selected}-${state}"] [role="tab"]`);
      // Put the tab in the Figma state the way a person would.
      if (state === "hover") await element.hover();
      if (state === "focus") {
        await page.keyboard.press("Tab"); // keyboard focus, so the focus ring shows
        await element.focus();
      }
      if (state === "disabled") await expect(element).toBeDisabled();
    } else if (child === undefined) {
      element = {
        TabList: tablist,
        TabPanel: page.locator('[data-figma="tabpanel"] [role="tabpanel"]'),
        Tabs: tabsRoot,
      }[key!]!;
    } else if (key === "TabList") {
      parent = tablist;
      element = tablist.getByRole("tab", { name: child, exact: true });
    } else {
      parent = tabsRoot;
      element = tabsPanels.filter({ hasText: child });
      if (child === "TabList") element = tabsTablist;
    }

    await expectToMatchFigma(element, node, { width: !holdChildren.includes(name) });
    if (parent) {
      // A child's place in its parent, from the parent's edge (the parent's padding counts).
      const [box, parentBox] = [await element.boundingBox(), await parent.boundingBox()];
      expect(box!.y - parentBox!.y, "y in the parent").toBeCloseTo(node.y, 0);
      if (firstChildren.includes(name)) {
        expect(box!.x - parentBox!.x, "x in the parent").toBeCloseTo(node.x, 0);
      }
    }
  });
}

test("Tabs: the panels that aren't selected are not displayed, though the panel class sets flex", async ({
  page,
}) => {
  await page.goto("/tabs/figma");
  const panels = page.locator('[data-figma="tabs"] [role="tabpanel"]');
  await expect(panels.filter({ hasText: "Overview panel" })).toHaveCSS("display", "flex");
  await expect(panels.filter({ hasText: "Activity panel" })).toHaveCSS("display", "none");
  await expect(panels.filter({ hasText: "Settings panel" })).toHaveCSS("display", "none");
});
