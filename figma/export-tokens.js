// Run with the Figma MCP's `use_figma` tool on the design system file, then save the
// returned string as figma/tokens.json. Read-only: it changes nothing in Figma.
// The Variables REST API is Enterprise-only, so this is how the snapshot is refreshed.
const hex = ({ r, g, b }) =>
  "#" + [r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
const line = (name, value) => `    ${JSON.stringify(name)}: ${JSON.stringify(value)}`;
const block = (name, lines) => `  ${JSON.stringify(name)}: {\n${lines.join(",\n")}\n  }`;

const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variables = await figma.variables.getLocalVariablesAsync();
const blocks = collections.map((collection) => {
  const modeId = collection.modes[0].modeId;
  const lines = variables
    .filter((v) => v.variableCollectionId === collection.id)
    .map((v) => {
      const raw = v.valuesByMode[modeId];
      const value = v.resolvedType === "COLOR" ? hex(raw) : raw;
      return line(v.name, { value, web: v.codeSyntax.WEB ?? null });
    });
  return block(collection.name, lines);
});

const textStyles = (await figma.getLocalTextStylesAsync())
  .slice()
  .sort((a, b) => a.fontSize - b.fontSize || a.name.localeCompare(b.name))
  .map((s) =>
    line(s.name, {
      family: s.fontName.family,
      style: s.fontName.style,
      size: s.fontSize,
      lineHeight: s.lineHeight.unit === "PIXELS" ? s.lineHeight.value : s.lineHeight.unit,
    }),
  );

const effectStyles = (await figma.getLocalEffectStylesAsync()).map((s) =>
  line(
    s.name,
    s.effects.map((e) => ({
      type: e.type,
      x: e.offset.x,
      y: e.offset.y,
      blur: e.radius,
      spread: e.spread ?? 0,
      color: hex(e.color),
      alpha: Math.round(e.color.a * 100) / 100,
    })),
  ),
);

return `{\n${[...blocks, block("textStyles", textStyles), block("effectStyles", effectStyles)].join(",\n")}\n}\n`;
