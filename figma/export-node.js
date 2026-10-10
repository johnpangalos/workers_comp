// Run with the Figma MCP's `use_figma` tool after setting NODE_ID, then save the returned
// string as apps/playground/figma/<name>.json. Read-only: it changes nothing in Figma.
//
// It describes a component set (or a single frame) for the pixel tests: where each variant
// sits in the export, and the exact values it is drawn with. The last line is a hash of
// everything above it, which the tests check, so a copy that lost or changed a character
// fails instead of quietly testing against the wrong numbers.
const NODE_ID = "1:91";

const hex = ({ r, g, b }) =>
  "#" + [r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
const solid = (paints) => {
  const paint = Array.isArray(paints) ? paints.find((p) => p.type === "SOLID" && p.visible !== false) : null;
  return paint ? hex(paint.color) : null;
};

function describe(node) {
  const label = "findAllWithCriteria" in node ? node.findAllWithCriteria({ types: ["TEXT"] })[0] : null;
  return {
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fill: solid(node.fills),
    stroke: solid(node.strokes),
    strokeWeight: solid(node.strokes) ? node.strokeWeight : 0,
    radius: node.cornerRadius,
    // Spread-only shadows are how Figma draws a focus ring: [colour, spread], outermost first.
    rings: node.effects
      .filter((e) => e.type === "DROP_SHADOW" && e.visible !== false && e.radius === 0)
      .map((e) => [hex(e.color), e.spread ?? 0]),
    label: label && {
      x: label.x,
      y: label.y,
      height: label.height,
      color: solid(label.fills),
      fontSize: label.fontSize,
      fontWeight: label.fontWeight,
      lineHeight: label.lineHeight.unit === "PIXELS" ? label.lineHeight.value : null,
    },
  };
}

const node = await figma.getNodeByIdAsync(NODE_ID);
const variants = node.type === "COMPONENT_SET" ? node.children : [node];
const lines = variants.map(
  (variant) =>
    `    ${JSON.stringify(node.type === "COMPONENT_SET" ? variant.name : node.name)}: ${JSON.stringify(
      node.type === "COMPONENT_SET" ? describe(variant) : { ...describe(variant), x: 0, y: 0 },
    )}`,
);
const body = `{\n  "file": ${JSON.stringify(figma.fileKey ?? null)},\n  "node": ${JSON.stringify(NODE_ID)},\n  "variants": {\n${lines.join(",\n")}\n  },\n`;

// djb2 over the text above; apps/playground/tests/figma.ts computes the same.
let hash = 5381;
for (let i = 0; i < body.length; i++) hash = ((hash * 33) ^ body.charCodeAt(i)) >>> 0;
return `${body}  "hash": "${hash.toString(16)}"\n}\n`;
