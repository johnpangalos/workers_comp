import assert from "node:assert/strict";
import { test } from "node:test";

import { exportedFiles, problems } from "./check-pack.ts";

// @workers-comp/ui's own exports.
const EXPORTS = {
  ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
  "./styles.css": "./dist/styles.css",
};
const BUILT = ["package.json", "dist/index.js", "dist/index.d.ts", "dist/styles.css"];

test("exportedFiles: every path in nested exports, without ./", () => {
  assert.deepEqual(exportedFiles(EXPORTS), ["dist/index.d.ts", "dist/index.js", "dist/styles.css"]);
  assert.deepEqual(exportedFiles("./dist/index.js"), ["dist/index.js"]);
  assert.deepEqual(exportedFiles(undefined), []);
});

test("problems: a built package with its readme, licence and changelog passes", () => {
  assert.deepEqual(
    problems([...BUILT, "README.md", "LICENSE", "CHANGELOG.md", "dist/chunk-a1.js"], EXPORTS),
    [],
  );
});

test("problems: a file outside dist and the manifest is reported", () => {
  assert.deepEqual(problems([...BUILT, ".env", "src/button/button.tsx"], EXPORTS), [
    ".env would be published",
    "src/button/button.tsx would be published",
  ]);
});

test("problems: a file named like an allowed one, but not at the top, is reported", () => {
  assert.deepEqual(problems([...BUILT, "src/README.md", "distx/index.js"], EXPORTS), [
    "src/README.md would be published",
    "distx/index.js would be published",
  ]);
});

test("problems: an exported file missing from the package is reported", () => {
  assert.deepEqual(problems(["package.json", "dist/index.js", "dist/index.d.ts"], EXPORTS), [
    "dist/styles.css is in exports but not in the package",
  ]);
});
