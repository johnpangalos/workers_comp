// check-pack: what `npm publish` would upload for @workers-comp/ui, checked before it does. Run in
// the release workflow's publish job, after the build and before the publish. It fails the job
// when the tarball would hold a file outside the package's own (`dist/`, the manifest, a readme,
// licence or changelog), so a stray `.env`, source map of the repo or test fixture never reaches
// npm, or when a file the package's `exports` point to is missing, so a broken build never
// reaches it either.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { runIfMain, summary } from "../claude-risk/actions.ts";

/** The files a published package may hold, as paths inside the tarball. */
const ALLOWED = [
  /^package\.json$/,
  /^README\.md$/i,
  /^LICEN[CS]E(\.md|\.txt)?$/i,
  /^CHANGELOG\.md$/,
  /^dist\/[^]+$/,
];

/** Every file path in `exports`, without its leading `./`: what an import of the package loads. */
export function exportedFiles(exports: unknown): string[] {
  if (typeof exports === "string") return [exports.replace(/^\.\//, "")];
  if (exports === null || typeof exports !== "object") return [];
  return Object.values(exports).flatMap(exportedFiles);
}

/** What's wrong with a tarball holding `files`, for a package whose manifest has `exports`. */
export function problems(files: string[], exports: unknown): string[] {
  const found: string[] = [];
  for (const file of files) {
    if (!ALLOWED.some((pattern) => pattern.test(file))) found.push(`${file} would be published`);
  }
  for (const file of exportedFiles(exports)) {
    if (!files.includes(file)) found.push(`${file} is in exports but not in the package`);
  }
  return found;
}

/** The paths `npm pack --dry-run --json` lists for the package in `dir`. */
function packedFiles(dir: string): string[] {
  const json = execFileSync("npm", ["pack", "--dry-run", "--json"], { cwd: dir, encoding: "utf8" });
  const [pack] = JSON.parse(json) as { files: { path: string }[] }[];
  if (!pack) throw new Error("npm pack listed no package");
  return pack.files.map((file) => file.path);
}

runIfMain(import.meta.url, async () => {
  const dir = process.argv[2] ?? "packages/ui";
  const manifest = JSON.parse(readFileSync(`${dir}/package.json`, "utf8")) as {
    name: string;
    exports?: unknown;
  };
  const files = packedFiles(dir);
  const found = problems(files, manifest.exports);
  if (found.length > 0) throw new Error(`${manifest.name}: ${found.join("; ")}`);
  summary(`${manifest.name} would publish ${files.length} files: ${files.join(", ")}`);
});
