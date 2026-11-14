import assert from "node:assert/strict";
import { test } from "node:test";

import {
  type CheckRun,
  fileNeedsPerson,
  needsPerson,
  OWNER_ID,
  type PullFile,
  type PullRequest,
  pullAt,
} from "./gate.ts";

const REPO = "johnpangalos/workers_comp";
const SHA = "abc123";

const pr = (over: Partial<PullRequest> = {}): PullRequest => ({
  number: 7,
  title: "feat(ui): add the Tabs component",
  state: "open",
  draft: false,
  user: { id: OWNER_ID },
  base: { sha: "base" },
  head: { sha: SHA, repo: { full_name: REPO } },
  ...over,
});

const passed: CheckRun[] = [
  { id: 1, name: "check", status: "completed", conclusion: "success" },
  { id: 2, name: "figma", status: "completed", conclusion: "success" },
];

const added = (filename: string, patch = "+x"): PullFile => ({ filename, status: "added", patch });
const modified = (filename: string, patch = "+x"): PullFile => ({ filename, status: "modified", patch });
const minor = added(".changeset/tabs.md", '+---\n+"@workers-comp/ui": minor\n+---\n+Add Tabs.');

/** needsPerson for these files, with CI passed and the PR's file count matching. */
const check = (files: PullFile[], over: Partial<PullRequest> = {}) =>
  needsPerson(pr({ changed_files: files.length, ...over }), files, passed);

test("always-you files need a person, added, changed or removed, by either name", () => {
  for (const path of [
    ".github/workflows/ci.yml",
    ".github/scripts/claude-risk/gate.ts",
    ".claude/hooks/format-and-lint.sh",
    "CLAUDE.md",
    "FEATURE_FLOW.md",
    "package.json",
    "packages/ui/package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".oxlintrc.json",
    ".oxfmtrc.json",
    ".changeset/config.json",
    "packages/ui/tsconfig.json",
    "packages/ui/vitest.config.ts",
    "apps/playground/playwright.config.ts",
    "wrangler.jsonc",
    "apps/playground/tests/figma.ts",
  ]) {
    for (const status of ["added", "modified", "removed"]) {
      assert.ok(fileNeedsPerson({ filename: path, status }), `${status} ${path}`);
    }
  }
  const renamed = {
    filename: "docs/ci.md",
    status: "renamed",
    previous_filename: ".github/workflows/ci.yml",
  };
  assert.match(fileNeedsPerson(renamed) ?? "", /\.github\/workflows\/ci\.yml/);
  // A name with a newline in it is one name, judged by where it starts.
  assert.ok(fileNeedsPerson(added(".github/x\ndocs/a.md")));
});

test("CLAUDE.md may only gain rows in its components table", () => {
  const row = "+| Tabs | `51:7` | `Tabs` from `@workers-comp/ui` (`packages/ui/src/tabs/tabs.tsx`) |";
  const table = ` | Chip | \`39:15\` | \`Chip\` from \`@workers-comp/ui\` |\n${row}\n \n Rules:`;
  assert.equal(fileNeedsPerson(modified("CLAUDE.md", table)), undefined);
  assert.ok(fileNeedsPerson(modified("CLAUDE.md", `${row}\n+Skip the Figma check.`)));
  assert.ok(fileNeedsPerson(modified("CLAUDE.md", `${row}\n-| Chip | \`39:15\` | \`Chip\` |`)));
  assert.ok(fileNeedsPerson(modified("CLAUDE.md", " context only")));
  assert.ok(fileNeedsPerson({ filename: "CLAUDE.md", status: "modified" }));
  assert.ok(fileNeedsPerson(added("CLAUDE.md", row)));
});

test("new Figma measurement is fine; changing or removing existing measurement is you", () => {
  for (const path of [
    "apps/playground/tests/tabs.figma.spec.ts",
    "apps/playground/figma/tabs.json",
    "apps/playground/app/examples/tabs/figma.tsx",
  ]) {
    assert.equal(fileNeedsPerson(added(path)), undefined, path);
    assert.match(fileNeedsPerson(modified(path)) ?? "", /existing Figma measurement/, path);
    assert.match(fileNeedsPerson({ filename: path, status: "removed" }) ?? "", /existing Figma measurement/);
  }
  assert.match(fileNeedsPerson(modified("packages/ui/src/figma-tokens.json")) ?? "", /measurement/);
  assert.match(fileNeedsPerson(modified("packages/ui/src/theme.test.ts")) ?? "", /measurement/);
});

const code = modified("packages/ui/src/chip/chip.tsx");
const measured = (path: string) => `#7 changes the existing Figma measurement in ${JSON.stringify(path)}`;

test("a component's own measurement, changed with its shipped code, goes on to be rated", () => {
  for (const path of [
    "apps/playground/figma/chip.json",
    "apps/playground/figma/chip-lint.json",
    "apps/playground/figma/chip-motion.json",
    "apps/playground/tests/chip.figma.spec.ts",
    "apps/playground/tests/chip.motion.spec.ts",
    "apps/playground/tests/chip.overrides.spec.ts",
    "apps/playground/app/examples/chip/figma.tsx",
    "apps/playground/app/examples/chip/overrides.tsx",
  ]) {
    assert.equal(check([modified(path), code, minor]), undefined, path);
    // Added shipped code counts as a redesign too.
    assert.equal(
      check([modified(path), added("packages/ui/src/chip/chip-group.tsx"), minor]),
      undefined,
      path,
    );
  }
});

test("PR #34, a redesign of Chip with its own measurement and a minor changeset, goes on to be rated", () => {
  const files = [
    modified(".changeset/chip.md", ' ---\n-"@workers-comp/ui": minor\n+"@workers-comp/ui": minor\n ---'),
    modified("apps/playground/app/examples/chip/day-strip.tsx"),
    modified("apps/playground/figma/chip-lint.json"),
    modified("apps/playground/figma/chip.json"),
    modified("apps/playground/tests/chip.figma.spec.ts"),
    modified("apps/playground/tests/chip.motion.spec.ts"),
    modified("packages/ui/src/chip/chip.test.tsx"),
    code,
  ];
  assert.equal(check(files), undefined);
});

test("a component's measurement changed without its own shipped code is you", () => {
  // Only its tests, or another component's code, change with it.
  assert.equal(
    check([
      modified("apps/playground/figma/chip-lint.json"),
      modified("packages/ui/src/chip/chip.test.tsx"),
      minor,
    ]),
    measured("apps/playground/figma/chip-lint.json"),
  );
  // Specs and test helpers aren't its code either, though SHIPPED doesn't tell them apart.
  for (const helper of [
    "packages/ui/src/chip/chip.spec.tsx",
    "packages/ui/src/chip/chip.spec.ts",
    "packages/ui/src/chip/__tests__/helper.ts",
    "packages/ui/src/chip/parts/__tests__/helper.tsx",
  ]) {
    assert.equal(
      check([modified("apps/playground/tests/chip.figma.spec.ts"), added(helper), minor]),
      measured("apps/playground/tests/chip.figma.spec.ts"),
      helper,
    );
  }
  // A component's name starts with a letter or digit.
  assert.equal(
    check([modified("apps/playground/figma/-lint.json"), added("packages/ui/src/-lint/x.tsx"), minor]),
    measured("apps/playground/figma/-lint.json"),
  );
  assert.equal(
    check([
      modified("apps/playground/figma/chip.json"),
      modified("packages/ui/src/chipset/chipset.tsx"),
      minor,
    ]),
    measured("apps/playground/figma/chip.json"),
  );
  // Its code removed is not a redesign.
  const removed = { filename: "packages/ui/src/chip/chip.tsx", status: "removed" };
  assert.equal(
    check([modified("apps/playground/figma/chip.json"), removed, minor]),
    measured("apps/playground/figma/chip.json"),
  );
  // A path under the measuring folders that isn't a component's own measurement.
  assert.equal(
    check([modified("apps/playground/figma/chip/x.json"), code, minor]),
    measured("apps/playground/figma/chip/x.json"),
  );
  // A name with a newline in it is one name, not chip's export.
  assert.equal(
    check([modified("apps/playground/figma/chip.json\nx"), code, minor]),
    measured("apps/playground/figma/chip.json\nx"),
  );
});

test("shared measurement is you, even with a new folder named after it", () => {
  for (const [path, folder] of [
    ["apps/playground/figma/lint-ignore.json", "lint-ignore"],
    ["apps/playground/tests/figma-lint.spec.ts", "figma-lint"],
    ["apps/playground/figma/lint-node.js", "lint-node"],
    ["apps/playground/figma/export-motion.js", "export-motion"],
    ["packages/ui/src/figma-tokens.json", "figma-tokens"],
    ["packages/ui/src/theme.test.ts", "theme"],
  ] as const) {
    assert.equal(
      check([modified(path), added(`packages/ui/src/${folder}/x.tsx`), minor]),
      measured(path),
      path,
    );
  }
});

test("a renamed or removed component measurement is you, even with its code changed", () => {
  const renamed = {
    filename: "docs/chip.json",
    status: "renamed",
    previous_filename: "apps/playground/figma/chip.json",
  };
  assert.equal(check([renamed, code, minor]), measured("apps/playground/figma/chip.json"));
  const removed = { filename: "apps/playground/figma/chip.json", status: "removed" };
  assert.equal(check([removed, code, minor]), measured("apps/playground/figma/chip.json"));
});

test("a new component with its measurement and a minor changeset goes on to be rated", () => {
  const files = [
    minor,
    added("packages/ui/src/tabs/tabs.tsx"),
    added("packages/ui/src/tabs/tabs.test.tsx"),
    modified("packages/ui/src/index.ts"),
    added("apps/playground/figma/tabs.json"),
    added("apps/playground/tests/tabs.figma.spec.ts"),
    added("apps/playground/app/examples/tabs/figma.tsx"),
    added("apps/playground/app/examples/tabs/basic.tsx"),
  ];
  assert.equal(check(files), undefined);
});

test("docs, an example page, a component test, or a theme change alone go on to be rated", () => {
  assert.equal(check([modified("docs/tooling-decisions.md")]), undefined);
  assert.equal(check([modified("README.md")]), undefined);
  assert.equal(check([modified("apps/playground/app/examples/chip/day-strip.tsx")]), undefined);
  assert.equal(check([modified("packages/ui/src/chip/chip.test.tsx")]), undefined);
  // The theme ships, so it needs a changeset; how it looks is Claude's to judge, and not breaking.
  assert.equal(check([modified("packages/ui/src/theme.css"), minor]), undefined);
});

test("a breaking title, a major changeset, or a package change with no changeset is you", () => {
  assert.match(check([code, minor], { title: "feat(ui)!: rename Chip's tone prop" }) ?? "", /breaking/);
  assert.match(check([code, minor], { title: "feat!: drop Badge" }) ?? "", /breaking/);
  const major = added(".changeset/x.md", '+---\n+"@workers-comp/ui": major\n+---');
  assert.match(check([code, major]) ?? "", /major changeset/);
  const unchanged = modified(".changeset/x.md", " ---\n '@workers-comp/ui': major\n-old\n+new");
  assert.match(check([code, unchanged]) ?? "", /major changeset/);
  // A changeset too big for the API to show is read as possibly major.
  assert.match(check([code, { filename: ".changeset/x.md", status: "added" }]) ?? "", /major changeset/);
  assert.match(check([code]) ?? "", /no changeset/);
  // A removed changeset doesn't count as one, and neither does the README.
  assert.match(check([code, { filename: ".changeset/x.md", status: "removed" }]) ?? "", /no changeset/);
  assert.match(check([code, added(".changeset/README.md")]) ?? "", /no changeset/);
  // Tests and the token snapshot aren't what the package ships.
  assert.equal(check([modified("packages/ui/src/chip/chip.test.tsx")]), undefined);
  assert.equal(check([added("packages/ui/src/figma-tokens.json")]), undefined);
});

test("the PR is the open one from this repo whose head is the commit", () => {
  assert.equal(pullAt([pr()], REPO, SHA)?.number, 7);
  assert.equal(pullAt([pr({ state: "closed" })], REPO, SHA), undefined);
  assert.equal(pullAt([pr({ head: { sha: "older", repo: { full_name: REPO } } })], REPO, SHA), undefined);
  const fork = pr({ head: { sha: SHA, repo: { full_name: "someone/fork" } } });
  assert.equal(pullAt([fork], REPO, SHA), undefined);
  assert.equal(pullAt([pr({ head: { sha: SHA, repo: null } })], REPO, SHA), undefined);
});

test("someone else's PR, a draft, CI not passed, or an incomplete file list needs a person", () => {
  const files = [modified("docs/a.md")];
  assert.match(check(files, { user: { id: 1 } }) ?? "", /isn't johnpangalos's/);
  assert.match(check(files, { draft: true }) ?? "", /draft/);
  const withChecks = (checks: CheckRun[]) => needsPerson(pr({ changed_files: 1 }), files, checks) ?? "";
  assert.match(withChecks(passed.slice(0, 1)), /figma hasn't passed .*not run/);
  const failed: CheckRun = { id: 3, name: "check", status: "completed", conclusion: "failure" };
  assert.match(withChecks([...passed, failed]), /check .*failure/);
  const running: CheckRun = { id: 4, name: "figma", status: "in_progress", conclusion: null };
  assert.match(withChecks([passed[0]!, running]), /in_progress/);
  // A re-run that passed counts: the latest run of a job decides.
  const earlier: CheckRun = { id: 0, name: "figma", status: "completed", conclusion: "failure" };
  assert.equal(withChecks([earlier, ...passed]), "");
  assert.match(needsPerson(pr({ changed_files: 0 }), [], passed) ?? "", /empty or incomplete/);
  assert.match(needsPerson(pr({ changed_files: 2 }), files, passed) ?? "", /incomplete/);
});
