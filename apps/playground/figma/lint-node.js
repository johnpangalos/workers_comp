// Lints the nodes of an export before it is exported: everything code would have to guess at is a
// finding. Figma decides, so a mistake in the file becomes a mistake in code; this catches it at
// the source. Returns the text of a lint file (apps/playground/figma/<name>-lint.json). Read-only.
//
// It takes the same ids as the export (export-node): component sets, whose variants it lints, and
// components and frames, each linted as a variant of its own. An id inside another of the ids is
// covered by it. With several ids, a set's variants are named `<set name>/<variant>`, as in the
// export.
//
// Rules, for every layer inside every variant (an instance's own layers are its component's
// business, so the lint stops at instances):
// - raw-color: a fill or stroke that isn't bound to a colour variable or a style.
// - raw-number: a gap, padding, radius, stroke weight or fixed width or height that isn't bound
//   to a variable. Zero needs no variable.
// - raw-effect: a shadow or blur that isn't an effect style or bound to variables.
// - raw-type: text without a text style whose family, size, weight or line height isn't bound
//   to a variable either. The finding's value names the unbound ones.
// - unlinked-text: a text layer linked to a component property in some variants and not in
//   others, so changing the property leaves those variants' text as it was.
// - detached: a frame detached from a component, so code can't tell which component it is.
//
// Run it with the Figma MCP's `use_figma`: paste this file and end with
// `return await lintNode("1:91");` (or `lintNode("18:13", "18:14", …)`, the export's ids in its
// order), then save the result exactly as returned. Its last line is a hash of the rest, the same
// check `loadFigmaExport` in tests/figma.ts makes. A finding that is right as it is goes in
// figma/lint-ignore.json, with a reason.
// oxlint-disable-next-line no-unused-vars -- called by the snippet pasted into `use_figma`, not here.
async function lintNode(...nodeIds) {
  // Each id's variants, as [the name the export gives it, the node].
  const roots = [];
  for (const nodeId of nodeIds) {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) throw new Error(`${nodeId} does not exist`);
    // A node inside another of the ids (the Chip export's dot rows) is linted as part of it.
    let inside = false;
    for (let parent = node.parent; parent; parent = parent.parent) inside ||= nodeIds.includes(parent.id);
    if (inside) continue;
    let prefix = "";
    if (nodeIds.length > 1) prefix = `${node.name}/`;
    if (node.type === "COMPONENT_SET") {
      roots.push(node.children.map((variant) => [{ name: prefix + variant.name }, variant]));
    } else if (node.type === "COMPONENT" || node.type === "FRAME") roots.push([[{ name: node.name }, node]]);
    else throw new Error(`${nodeId} is not a component set, component or frame`);
  }

  const findings = [];
  const add = (variant, layer, node, rule, field, value) =>
    findings.push({ variant: variant.name, layer, node: node.id, rule, field, value });
  const sides = ["strokeTopWeight", "strokeRightWeight", "strokeBottomWeight", "strokeLeftWeight"];
  // Figma records a stroke weight's variable on each side, not on `strokeWeight` itself.
  const bound = (node, field) =>
    Boolean(node.boundVariables?.[field]) ||
    (field === "strokeWeight" && sides.every((side) => node.boundVariables?.[side]));
  // Figma stores numbers as 32-bit floats: round them for the report.
  const round = (value) => Number(value.toFixed(2));
  const hex = ({ r, g, b }) =>
    `#${[r, g, b].map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0")).join("")}`;

  function lintPaints(variant, layer, node, field, styleId) {
    const paints = node[field];
    if (paints === figma.mixed) return add(variant, layer, node, "raw-color", field, "mixed");
    if (styleId || !paints) return;
    for (const paint of paints) {
      if (paint.visible === false) continue;
      if (paint.type !== "SOLID") add(variant, layer, node, "raw-color", field, paint.type);
      else if (!paint.boundVariables?.color) add(variant, layer, node, "raw-color", field, hex(paint.color));
    }
  }

  function lintNumber(variant, layer, node, field) {
    const value = node[field];
    if (typeof value !== "number" || value === 0 || bound(node, field)) return;
    add(variant, layer, node, "raw-number", field, round(value));
  }

  // layer path (inside a variant) -> the variants whose text there is linked, and those whose isn't;
  // one map per id, since different components can have layers of the same name
  let textLinks = new Map();

  function lintLayer(variant, layer, node) {
    if ("fills" in node) lintPaints(variant, layer, node, "fills", node.fillStyleId);
    if ("strokes" in node && node.strokes.length > 0) {
      lintPaints(variant, layer, node, "strokes", node.strokeStyleId);
      if (node.strokeWeight === figma.mixed) {
        for (const side of sides) lintNumber(variant, layer, node, side);
      } else lintNumber(variant, layer, node, "strokeWeight");
    }
    if ("topLeftRadius" in node) {
      for (const corner of ["topLeftRadius", "topRightRadius", "bottomRightRadius", "bottomLeftRadius"]) {
        lintNumber(variant, layer, node, corner);
      }
    }
    if ("layoutMode" in node && node.layoutMode !== "NONE") {
      for (const side of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) {
        lintNumber(variant, layer, node, side);
      }
      if (node.children.length > 1 && node.primaryAxisAlignItems !== "SPACE_BETWEEN") {
        lintNumber(variant, layer, node, "itemSpacing");
      }
      if (node.layoutWrap === "WRAP") lintNumber(variant, layer, node, "counterAxisSpacing");
    }
    // Text sizes come from its style; a fixed box is a size someone typed.
    if (node.type !== "TEXT") {
      if (node.layoutSizingHorizontal === "FIXED") lintNumber(variant, layer, node, "width");
      if (node.layoutSizingVertical === "FIXED") lintNumber(variant, layer, node, "height");
    }
    if ("effects" in node && node.effects.length > 0 && !node.effectStyleId) {
      for (const effect of node.effects) {
        if (effect.visible === false || Object.keys(effect.boundVariables ?? {}).length > 0) continue;
        add(variant, layer, node, "raw-effect", "effects", effect.type);
      }
    }
    if (node.type === "TEXT") {
      if (!node.textStyleId || node.textStyleId === figma.mixed) {
        const unbound = ["fontFamily", "fontSize", "fontWeight", "lineHeight"].filter((f) => !bound(node, f));
        if (unbound.length > 0) add(variant, layer, node, "raw-type", "textStyleId", unbound.join(" "));
      }
      const links = textLinks.get(layer) ?? { linked: [], unlinked: [] };
      if (node.componentPropertyReferences?.characters) links.linked.push(variant.name);
      else links.unlinked.push([variant, node]);
      textLinks.set(layer, links);
    }
    if (node.type === "FRAME" && node.detachedInfo) add(variant, layer, node, "detached", "", node.name);
    if (node.type === "INSTANCE" || !("children" in node)) return;
    for (const child of node.children) lintLayer(variant, [layer, child.name].filter(Boolean).join(" > "), child);
  }

  for (const variants of roots) {
    textLinks = new Map();
    for (const [variant, node] of variants) lintLayer(variant, "", node);
    for (const [layer, { linked, unlinked }] of textLinks) {
      if (linked.length === 0) continue; // static text in every variant: nothing to link
      for (const [variant, node] of unlinked) add(variant, layer, node, "unlinked-text", "characters", node.characters);
    }
  }

  const lines = findings.map((finding) => `    ${JSON.stringify(finding)}`);
  let list = "[]";
  if (lines.length > 0) list = `[\n${lines.join(",\n")}\n  ]`;
  const body = `{\n  "file": ${JSON.stringify(figma.fileKey ?? null)},\n  "node": ${JSON.stringify(nodeIds.join(" "))},\n  "findings": ${list},\n`;
  let hash = 5381;
  for (let i = 0; i < body.length; i++) hash = ((hash * 33) ^ body.charCodeAt(i)) >>> 0;
  return `${body}  "hash": "${hash.toString(16)}"\n}\n`;
}
