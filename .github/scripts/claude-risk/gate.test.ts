import assert from "node:assert/strict";
import { test } from "node:test";

import { type CheckRun, isLowRisk, needsPerson, OWNER_ID, type PullRequest, pullAt } from "./gate.ts";

const REPO = "johnpangalos/workers_comp";
const SHA = "abc123";

const pr = (over: Partial<PullRequest> = {}): PullRequest => ({
  number: 7,
  state: "open",
  draft: false,
  user: { id: OWNER_ID },
  base: { sha: "base" },
  head: { sha: SHA, repo: { full_name: REPO } },
  changed_files: 1,
  ...over,
});

const passed: CheckRun[] = [
  { id: 1, name: "check", status: "completed", conclusion: "success" },
  { id: 2, name: "figma", status: "completed", conclusion: "success" },
];

test("low-risk paths are docs, the README, unmeasured example pages and a component's own tests", () => {
  for (const path of [
    "docs/tooling-decisions.md",
    "README.md",
    "apps/playground/app/examples/chip/day-strip.tsx",
    "packages/ui/src/chip/chip.test.tsx",
    "packages/ui/src/button/button.test.ts",
  ]) {
    assert.ok(isLowRisk(path), path);
  }
  for (const path of [
    "apps/playground/app/examples/chip/figma.tsx",
    "apps/playground/app/examples/button/overrides.tsx",
    "apps/playground/tests/chip.figma.spec.ts",
    "packages/ui/src/theme.test.ts",
    "packages/ui/src/a/b/c.test.ts",
    "packages/ui/src/chip/chip.tsx",
    ".github/workflows/claude-risk.yml",
    ".github/scripts/claude-risk/gate.ts",
    "CLAUDE.md",
    "REVIEW.md",
    "FEATURE_FLOW.md",
    "pnpm-lock.yaml",
    "readme.md",
    "docs/a\n.github/workflows/ci.yml",
    "packages/ui/src/x/x.test.ts\ndocs/evil.tsx",
  ]) {
    assert.ok(!isLowRisk(path), JSON.stringify(path));
  }
});

test("the PR is the open one from this repo whose head is the commit", () => {
  assert.equal(pullAt([pr()], REPO, SHA)?.number, 7);
  assert.equal(pullAt([pr({ state: "closed" })], REPO, SHA), undefined);
  assert.equal(pullAt([pr({ head: { sha: "older", repo: { full_name: REPO } } })], REPO, SHA), undefined);
  assert.equal(
    pullAt([pr({ head: { sha: SHA, repo: { full_name: "someone/fork" } } })], REPO, SHA),
    undefined,
  );
  assert.equal(pullAt([pr({ head: { sha: SHA, repo: null } })], REPO, SHA), undefined);
});

test("a low-risk PR of the owner's, with CI passed, goes on to be rated", () => {
  assert.equal(needsPerson(pr(), [{ filename: "docs/a.md" }], passed), undefined);
});

test("someone else's PR, a draft, or CI not passed needs a person", () => {
  const files = [{ filename: "docs/a.md" }];
  assert.match(needsPerson(pr({ user: { id: 1 } }), files, passed) ?? "", /isn't johnpangalos's/);
  assert.match(needsPerson(pr({ draft: true }), files, passed) ?? "", /draft/);
  assert.match(needsPerson(pr(), files, passed.slice(0, 1)) ?? "", /figma hasn't passed .*not run/);
  const failed = [...passed, { id: 3, name: "check", status: "completed", conclusion: "failure" }];
  assert.match(needsPerson(pr(), files, failed) ?? "", /check hasn't passed .*failure/);
  const running = [passed[0]!, { id: 4, name: "figma", status: "in_progress", conclusion: null }];
  assert.match(needsPerson(pr(), files, running) ?? "", /figma hasn't passed .*in_progress/);
  // A re-run that passed counts: the latest run of a job decides.
  const rerun = [{ id: 0, name: "figma", status: "completed", conclusion: "failure" }, ...passed];
  assert.equal(needsPerson(pr(), files, rerun), undefined);
});

test("an empty or incomplete file list, or any file outside the low tier, needs a person", () => {
  assert.match(needsPerson(pr({ changed_files: 0 }), [], passed) ?? "", /empty or incomplete/);
  assert.match(
    needsPerson(pr({ changed_files: 2 }), [{ filename: "docs/a.md" }], passed) ?? "",
    /incomplete/,
  );
  const renamed = [{ filename: "docs/a.md", previous_filename: ".github/workflows/ci.yml" }];
  assert.match(needsPerson(pr(), renamed, passed) ?? "", /touches ".github\/workflows\/ci.yml"/);
  const measured = [{ filename: "apps/playground/app/examples/chip/figma.tsx" }];
  assert.match(needsPerson(pr(), measured, passed) ?? "", /figma.tsx/);
});
