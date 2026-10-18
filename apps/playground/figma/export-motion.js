// Returns the prototype transitions of a component set as the text of an export file
// (apps/playground/figma/<name>-motion.json): for each variant that changes to another one, the
// trigger, the duration and the easing curve. Read-only. The figma-flow skill's export-node
// doesn't read prototype reactions, so this fills that gap until it does.
//
// Run it with the Figma MCP's `use_figma`: paste this file and end with
// `return await exportMotion("39:15");`, then save the result exactly as returned. Its last line
// is a hash of the rest, the same check `loadFigmaNodes` in tests/figma.ts makes.
async function exportMotion(setId) {
  const set = await figma.getNodeByIdAsync(setId);
  if (set?.type !== "COMPONENT_SET") throw new Error(`${setId} is not a component set`);
  const names = Object.fromEntries(set.children.map((variant) => [variant.id, variant.name]));
  // Figma stores these as 32-bit floats (0.15 reads back as 0.15000000596…): round them.
  const round = (value, places) => Number(value.toFixed(places));

  const entries = [];
  for (const variant of set.children) {
    for (const reaction of variant.reactions) {
      for (const action of reaction.actions ?? []) {
        if (action.type !== "NODE" || action.navigation !== "CHANGE_TO" || !action.transition) continue;
        const { transition } = action;
        const curve = transition.easing.easingFunctionCubicBezier;
        // A cubic-bezier curve as its four numbers; a named Figma easing as its name.
        let easing = transition.easing.type;
        if (curve) easing = [curve.x1, curve.y1, curve.x2, curve.y2].map((n) => round(n, 3));
        entries.push([
          `${variant.name} -> ${names[action.destinationId]}`,
          {
            trigger: reaction.trigger.type,
            transition: transition.type,
            durationMs: round(transition.duration * 1000, 0),
            easing,
          },
        ]);
      }
    }
  }

  const lines = entries.map(([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)}`);
  const body = `{\n  "file": ${JSON.stringify(figma.fileKey ?? null)},\n  "node": ${JSON.stringify(setId)},\n  "variants": {\n${lines.join(",\n")}\n  },\n`;
  let hash = 5381;
  for (let i = 0; i < body.length; i++) hash = ((hash * 33) ^ body.charCodeAt(i)) >>> 0;
  return `${body}  "hash": "${hash.toString(16)}"\n}\n`;
}
