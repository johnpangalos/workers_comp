import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { loadFigmaExport } from "./figma";

// Every exported component was linted in Figma first, and the lint found nothing that isn't
// accepted on purpose. The lint files are written by figma/lint-node.js; the accepted findings, each
// with its reason, are in figma/lint-ignore.json. A finding is fixed in Figma, never in code.
type Finding = { variant: string; layer: string; node: string; rule: string; field: string; value: unknown };
type Ignore = { node: string; rule: string; layer: string; field: string; reason: string };

const folder = new URL("../figma/", import.meta.url);
const ignores = JSON.parse(readFileSync(new URL("lint-ignore.json", folder), "utf8")) as Ignore[];
const matches = (ignore: Ignore, set: string, finding: Finding) =>
  ignore.node === set &&
  ignore.rule === finding.rule &&
  ignore.layer === finding.layer &&
  ignore.field === finding.field;

// The export-node files: <name>.json, not the lint, motion or ignore files.
const exports = readdirSync(folder).filter(
  (file) => /^[a-z-]+\.json$/.test(file) && !/-(lint|motion)\.json$|^lint-ignore\.json$/.test(file),
);

for (const file of exports) {
  const name = file.replace(/\.json$/, "");

  test(`${name} passes the Figma lint`, () => {
    const exported = loadFigmaExport(new URL(file, folder));
    const lintFile = new URL(`${name}-lint.json`, folder);
    expect(readdirSync(folder), `figma/${name}-lint.json: lint the node with figma/lint-node.js`).toContain(
      `${name}-lint.json`,
    );
    const lint = loadFigmaExport(lintFile);
    // An export's "node" lists the set first, then any other nodes it measures.
    const [set] = String(exported.node).split(" ");
    expect(lint.node, "the lint is of the node that was exported").toBe(set);

    const open = (lint.findings as Finding[]).filter(
      (finding) => !ignores.some((ignore) => matches(ignore, set!, finding)),
    );
    // One line per problem, with how many variants have it and a link to the first.
    const grouped = new Map<string, { count: number; node: string }>();
    for (const finding of open) {
      const key = `${finding.rule} ${finding.field} = ${JSON.stringify(finding.value)} on "${finding.layer || "(variant)"}"`;
      const entry = grouped.get(key) ?? { count: 0, node: finding.node };
      entry.count++;
      grouped.set(key, entry);
    }
    const report = [...grouped].map(
      ([key, { count, node }]) =>
        `${key}, in ${count} variant(s): https://www.figma.com/design/${lint.file}?node-id=${node.replace(":", "-")}`,
    );
    expect(
      report,
      "fix these in Figma and lint again, or accept one in figma/lint-ignore.json with a reason",
    ).toEqual([]);
  });
}

test("every accepted lint finding still occurs", () => {
  const lints = readdirSync(folder)
    .filter((file) => file.endsWith("-lint.json"))
    .map((file) => loadFigmaExport(new URL(file, folder)));
  const stale = ignores.filter(
    (ignore) =>
      !lints.some((lint) =>
        (lint.findings as Finding[]).some((finding) => matches(ignore, String(lint.node), finding)),
      ),
  );
  expect(stale, "remove these from figma/lint-ignore.json: Figma no longer has them").toEqual([]);
});
