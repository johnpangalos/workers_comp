// An oxlint (ESLint-style) plugin with one rule, `workers-comp/preflight`: every component in
// `packages/ui/src/<name>/<name>.tsx` resets the browser's defaults with the `preflight` class
// from tailwind.module.css, on its outermost element and nowhere else.
//
// The component the file is named after (`text-field/text-field.tsx` → `TextField`) is the top
// level: the first class of its outermost element's `cx(…)` has to be `preflight`. `preflight`
// resets everything inside that element too, so the file's other components, which only render
// inside it (`Tab`, `TabList` and `TabPanel` inside `Tabs`), and any element below the top,
// must not carry it, whether it's written in a `cx(…)` or in any other `className` string.

const pascal = (kebab) =>
  kebab
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

// The JSX element a component returns: an arrow's expression body, or the first `return` of a
// function's block body.
const rootElement = (fn) => {
  if (fn.body?.type === "JSXElement") return fn.body;
  if (fn.body?.type !== "BlockStatement") return null;
  for (const statement of fn.body.body) {
    if (statement.type === "ReturnStatement" && statement.argument?.type === "JSXElement")
      return statement.argument;
  }
  return null;
};

// The first `cx(…)` call inside a node, depth first.
const findCx = (node) => {
  if (!node || typeof node.type !== "string") return null;
  if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "cx")
    return node;
  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;
    for (const child of [value].flat()) {
      if (!child || typeof child !== "object") continue;
      const found = findCx(child);
      if (found) return found;
    }
  }
  return null;
};

// The classes in a `cx(…)` call's first argument, a template literal or a string.
const classesOf = (call) => {
  const [first] = call.arguments;
  let text = "";
  if (first?.type === "TemplateLiteral") text = first.quasis.map((quasi) => quasi.value.cooked).join(" ");
  if (first?.type === "Literal" && typeof first.value === "string") text = first.value;
  return text.split(/\s+/).filter(Boolean);
};

// Whether a string holds `preflight` as a class of its own (`no-preflight` and `preflight-ish`
// don't count).
const hasPreflight = (text) => text.split(/\s+/).includes("preflight");

// Every string literal or template quasi under a node that holds `preflight` as a class.
const preflightStrings = (node, found = []) => {
  if (!node || typeof node.type !== "string") return found;
  if (node.type === "Literal" && typeof node.value === "string" && hasPreflight(node.value)) found.push(node);
  if (node.type === "TemplateElement" && hasPreflight(node.value.cooked ?? "")) found.push(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;
    for (const child of [value].flat()) {
      if (child && typeof child === "object") preflightStrings(child, found);
    }
  }
  return found;
};

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`preflight` is the first class of a component's outermost element, and on no other element",
    },
    messages: {
      missing:
        "{{name}}'s outermost element needs `preflight` as the first class of its cx(…): without it, the browser's own styles show through wherever the component sets nothing.",
      notFirst: "Put `preflight` first in {{name}}'s cx(…), so the reset reads before what it resets.",
      nested:
        "`preflight` goes only on the outermost element of {{main}}, which resets everything inside it. Remove it here.",
      noComponent:
        "This file is named for a component `{{main}}` and doesn't define one, so `preflight` can't be checked.",
    },
    schema: [],
  },
  create(context) {
    const path = context.filename.split(/[\\/]/);
    const folder = path.at(-2);
    if (path.at(-1) !== `${folder}.tsx`) return {};
    const main = pascal(folder);
    let component = null;
    // Every string that holds `preflight`, in a className or a cx(…) call, once each.
    const occurrences = new Set();
    const collect = (node) => {
      for (const found of preflightStrings(node)) occurrences.add(found);
    };

    return {
      FunctionDeclaration(fn) {
        if (fn.id?.name === main) component = fn;
      },
      VariableDeclarator(declarator) {
        const init = declarator.init;
        if (
          declarator.id.type === "Identifier" &&
          declarator.id.name === main &&
          (init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression")
        ) {
          component = init;
        }
      },
      JSXAttribute(attribute) {
        if (attribute.name.name === "className") collect(attribute.value);
      },
      CallExpression(call) {
        if (call.callee.type === "Identifier" && call.callee.name === "cx") collect(call);
      },
      "Program:exit"(program) {
        if (!component) {
          context.report({ node: program, messageId: "noComponent", data: { main } });
          return;
        }
        const root = rootElement(component);
        const attribute = root?.openingElement.attributes.find(
          (attr) => attr.type === "JSXAttribute" && attr.name.name === "className",
        );
        const call = findCx(attribute?.value);
        const classes = (call && classesOf(call)) || [];
        if (!classes.includes("preflight")) {
          context.report({ node: root ?? component, messageId: "missing", data: { name: main } });
        } else if (classes[0] !== "preflight") {
          context.report({ node: call, messageId: "notFirst", data: { name: main } });
        }
        const own = new Set(preflightStrings(call));
        for (const node of occurrences) {
          if (!own.has(node)) context.report({ node, messageId: "nested", data: { main } });
        }
      },
    };
  },
};

export default {
  meta: { name: "workers-comp" },
  rules: { preflight: rule },
};
