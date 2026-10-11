// Returns a component set (or a single frame) as the text of apps/playground/figma/<name>.json:
// where each variant sits in the export, and the exact values it is drawn with. Read-only: it
// changes nothing in Figma. Run it with the Figma MCP (`node figma/print.ts export-node 1:91`
// prints the code for `use_figma`) and save the result exactly as returned.
//
// The last line is a hash of everything above it, which the pixel tests check, so a copy that
// lost or changed a character fails instead of quietly testing against the wrong numbers.
export default async function exportNode(nodeId: string): Promise<string> {
  const hex = ({ r, g, b }: RGB) =>
    "#" + [r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
  const solid = (paints: readonly Paint[] | typeof figma.mixed) => {
    const paint = Array.isArray(paints)
      ? paints.find((p): p is SolidPaint => p.type === "SOLID" && p.visible !== false)
      : undefined;
    return paint ? hex(paint.color) : null;
  };
  // Figma reports `figma.mixed` (a symbol) when a value differs within the node.
  const single = <T>(value: T | typeof figma.mixed) => (typeof value === "symbol" ? null : (value as T));

  function describe(node: FrameNode | ComponentNode) {
    const label = node.findAllWithCriteria({ types: ["TEXT"] })[0];
    const lineHeight = label ? single(label.lineHeight) : null;
    return {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      fill: solid(node.fills),
      stroke: solid(node.strokes),
      strokeWeight: solid(node.strokes) ? single(node.strokeWeight) : 0,
      radius: single(node.cornerRadius),
      // Spread-only shadows are how Figma draws a focus ring: [colour, spread], outermost first.
      rings: node.effects.flatMap((effect) =>
        effect.type === "DROP_SHADOW" && effect.visible !== false && effect.radius === 0
          ? [[hex(effect.color), effect.spread ?? 0]]
          : [],
      ),
      label: label
        ? {
            x: label.x,
            y: label.y,
            height: label.height,
            color: solid(label.fills),
            fontSize: single(label.fontSize),
            fontWeight: single(label.fontWeight),
            lineHeight: lineHeight?.unit === "PIXELS" ? lineHeight.value : null,
          }
        : null,
    };
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (node?.type !== "COMPONENT_SET" && node?.type !== "COMPONENT" && node?.type !== "FRAME") {
    throw new Error(`${nodeId} is not a component set, component or frame`);
  }
  const lines =
    node.type === "COMPONENT_SET"
      ? node.children.map(
          (variant) => `    ${JSON.stringify(variant.name)}: ${JSON.stringify(describe(variant as ComponentNode))}`,
        )
      : [`    ${JSON.stringify(node.name)}: ${JSON.stringify({ ...describe(node), x: 0, y: 0 })}`];
  const body = `{\n  "file": ${JSON.stringify(figma.fileKey ?? null)},\n  "node": ${JSON.stringify(nodeId)},\n  "variants": {\n${lines.join(",\n")}\n  },\n`;

  // djb2 over the text above; apps/playground/tests/figma.ts computes the same.
  let hash = 5381;
  for (let i = 0; i < body.length; i++) hash = ((hash * 33) ^ body.charCodeAt(i)) >>> 0;
  return `${body}  "hash": "${hash.toString(16)}"\n}\n`;
}
