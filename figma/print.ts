// Prints one of the scripts in this folder as the plain JavaScript that the Figma MCP's
// `use_figma` tool runs: types stripped, and a final `return` calling its default export.
//
//   node figma/print.ts export-tokens
//   node figma/print.ts export-node 1:91
//
// The scripts run inside Figma, not in Node, so they can't be imported and called here.
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const [name, ...args] = process.argv.slice(2);
if (!name) throw new Error("usage: node figma/print.ts <script> [arguments]");

const source = readFileSync(new URL(`./${name}.ts`, import.meta.url), "utf8");
const entry = /^export default (async function (\w+))/m.exec(source);
if (!entry) throw new Error(`${name}.ts needs an "export default async function name"`);

const body = stripTypeScriptTypes(source).replace(entry[0], entry[1]!);
console.log(`${body}\nreturn await ${entry[2]}(${args.map((arg) => JSON.stringify(arg)).join(", ")});`);
