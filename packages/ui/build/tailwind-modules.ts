import { fileURLToPath } from "node:url";
import { DevEnvironment, parseAst, type Plugin } from "vite";

const theme = fileURLToPath(new URL("../src/theme.css", import.meta.url));
const suffix = ".tw.module.css";

type Node = { type: string; start: number; end: number; [key: string]: unknown };

/**
 * Turns `tw({ name: "tailwind classes" })` calls into a generated CSS module.
 *
 *   const styles = tw({ button: "inline-flex bg-fuchsia-700 data-hovered:bg-fuchsia-800" });
 *
 * becomes `import styles from "button.tsx.tw.module.css"`, whose CSS is
 *
 *   @layer components { .button { @apply inline-flex bg-fuchsia-700 data-hovered:bg-fuchsia-800; } }
 *
 * Tailwind then compiles the @apply to plain CSS and CSS modules scopes `.button`, so the
 * component keeps its classes inline but ships no Tailwind. Values must be plain strings.
 */
export function tailwindModules(): Plugin {
  const modules = new Map<string, string>();

  return {
    name: "workers-comp:tailwind-modules",
    enforce: "pre",

    resolveId(id) {
      return modules.has(id) ? id : undefined;
    },

    load(id) {
      return modules.get(id);
    },

    transform(code, id) {
      if (!/\.tsx?$/.test(id) || !code.includes("tw(")) return;

      const calls: Node[] = [];
      walk(parseAst(code, { lang: id.endsWith("x") ? "tsx" : "ts" }) as unknown as Node, (node) => {
        const callee = node.callee as Node | undefined;
        if (node.type === "CallExpression" && callee?.type === "Identifier" && callee.name === "tw") {
          calls.push(node);
        }
      });
      if (calls.length === 0) return;

      let out = code;
      const imports: string[] = [];
      // Replace from the end so earlier offsets stay valid.
      for (const [index, call] of [...calls].reverse().entries()) {
        const rules = readClasses(call, id).map(
          ([name, classes]) => `  .${name} {\n    @apply ${classes};\n  }`,
        );
        const moduleId = `${id}.${calls.length - 1 - index}${suffix}`;
        const css = [
          `@reference ${JSON.stringify(theme)};`,
          // Tailwind's own layer order, declared up front so it holds whichever stylesheet
          // loads first: an app's preflight stays under these styles, its utilities over them.
          "@layer theme, base, components, utilities;",
          `@layer components {\n${rules.join("\n")}\n}`,
        ].join("\n");
        if (modules.get(moduleId) !== css) {
          modules.set(moduleId, css);
          // In dev, hot-reload the generated CSS so an edit to the classes shows up.
          const env = this.environment;
          const stale = env instanceof DevEnvironment ? env.moduleGraph.getModuleById(moduleId) : undefined;
          if (stale) void (env as DevEnvironment).reloadModule(stale);
        }
        const local = `__tw${calls.length - 1 - index}`;
        imports.push(`import ${local} from ${JSON.stringify(moduleId)};`);
        out = out.slice(0, call.start) + local + out.slice(call.end);
      }
      return { code: `${imports.join("\n")}\n${out}`, map: null };
    },
  };
}

function readClasses(call: Node, id: string): Array<[string, string]> {
  const [arg] = call.arguments as Node[];
  if (arg?.type !== "ObjectExpression") throw new Error(`${id}: tw() takes an object literal`);
  return (arg.properties as Node[]).map((property) => {
    const key = property.key as Node;
    const value = property.value as Node;
    const name = key.type === "Identifier" ? (key.name as string) : (key.value as string);
    const classes =
      value.type === "Literal" && typeof value.value === "string"
        ? value.value
        : value.type === "TemplateLiteral" && (value.expressions as Node[]).length === 0
          ? ((value.quasis as Node[])[0]!.value as { cooked: string }).cooked
          : undefined;
    if (classes === undefined) throw new Error(`${id}: tw() value for "${name}" must be a plain string`);
    return [name, classes.trim().split(/\s+/).join(" ")];
  });
}

function walk(node: unknown, visit: (node: Node) => void): void {
  if (Array.isArray(node)) return node.forEach((child) => walk(child, visit));
  if (!node || typeof node !== "object" || typeof (node as Node).type !== "string") return;
  visit(node as Node);
  for (const value of Object.values(node)) if (value && typeof value === "object") walk(value, visit);
}
