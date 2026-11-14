// gate: whether the PR at this commit may go on to be rated, before any Claude call. Outputs
// `eligible` (true or false), `pr` and `base` when there is a PR, and `reason` when it needs a
// person. docs/merge-risk.md, "What needs you", says the same for people.
//
// A PR merges by itself unless it's breaking for the people who use @workers-comp/ui, or it
// touches what the safeguards rest on. This step holds what it can see without reading the
// change: the always-you paths, edits to the existing Figma measurement (but a redesign of a
// component may change its own), a major changeset or a `!` title, and a change to the package
// with no changeset. Claude judges the rest.

import { env, github, githubAll, output, runIfMain, summary } from "./actions.ts";

/** johnpangalos, by user ID, which survives a rename. */
export const OWNER_ID = 6550688;

/** The CI jobs that must have passed on the commit (`.github/workflows/ci.yml`). */
export const REQUIRED_CHECKS = ["check", "figma"];

// Whole names: without the m flag `^` and `$` are the ends of the string, and `.` doesn't
// match a newline, so a name with a newline in it can't pass as two.

/**
 * Always you, whatever the change: what runs with write tokens or on your machine (.github,
 * .claude), the files that steer every agent (CLAUDE.md, FEATURE_FLOW.md), dependencies, the
 * config that decides what the checks check, the deploy config, and the shared Figma measuring
 * code.
 */
const ALWAYS = [
  /^\.github\//,
  /^\.claude\//,
  /^(CLAUDE|FEATURE_FLOW)\.md$/,
  /(^|\/)package\.json$/,
  /^pnpm-(lock|workspace)\.yaml$/,
  /^\.(oxlintrc|oxfmtrc)\.json$/,
  /^\.changeset\/config\.json$/,
  /(^|\/)tsconfig[^/]*\.json$/,
  /(^|\/)[^/]+\.config\.(ts|mts|js|mjs|cjs)$/,
  /^wrangler\.jsonc$/,
  /^apps\/playground\/tests\/figma\.ts$/,
];

/**
 * The Figma measurement: a new spec, export or measured page is fine. Changing or removing one is
 * how a check gets loosened, so that's you, unless it's a component's own (OWN_MEASUREMENT) and
 * the PR redesigns that component's shipped code.
 */
const MEASUREMENT = [
  /^apps\/playground\/tests\//,
  /^apps\/playground\/figma\//,
  /^apps\/playground\/app\/examples\/[^/]+\/(figma|overrides)\.tsx$/,
  /^packages\/ui\/src\/figma-tokens\.json$/,
  /^packages\/ui\/src\/theme\.test\.ts$/,
];

/** What `@workers-comp/ui` ships: its code and styles, not its tests or the token snapshot. */
const SHIPPED = /^packages\/ui\/src\/(?!.*\.test\.tsx?$).*\.(tsx?|css)$/;

/**
 * A component's own measurement, by the component's name (its folder under packages/ui/src). The
 * names are lazy, so chip-lint.json names chip. lint-ignore.json is shared, not a component's, even
 * with a folder of that name.
 */
const OWN_MEASUREMENT = [
  /^apps\/playground\/figma\/(?!lint-ignore\.json$)([a-z0-9][a-z0-9-]*?)(?:-lint|-motion)?\.json$/,
  /^apps\/playground\/tests\/([a-z0-9][a-z0-9-]*)\.(?:figma|motion|overrides)\.spec\.ts$/,
  /^apps\/playground\/app\/examples\/([a-z0-9][a-z0-9-]*)\/(?:figma|overrides)\.tsx$/,
];

/**
 * A component's own code, by its folder under packages/ui/src: shipped (SHIPPED), and not a spec
 * or a test helper either, which SHIPPED lets through, so a PR of tests alone isn't a redesign.
 */
const COMPONENT_CODE =
  /^packages\/ui\/src\/([a-z0-9][a-z0-9-]*)\/(?!(?:.*\/)?__tests__\/)(?!.*\.spec\.tsx?$)/;

/** A row of CLAUDE.md's components table: | Figma component | `node` | code | */
const COMPONENT_ROW = /^\+\| [^|]+ \| `\d+:\d+` \| [^|]+ \|$/;
const CHANGESET = /^\.changeset\/(?!README\.md$)[^/]+\.md$/;
// An added or unchanged line of the changeset's patch.
const MAJOR = /^[+ ]\s*["']?@workers-comp\/ui["']?\s*:\s*major\b/m;
const BREAKING_TITLE = /^\w+(\([^)]*\))?!:/;

export type PullRequest = {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  user: { id: number };
  base: { sha: string };
  head: { sha: string; repo: { full_name: string } | null };
  changed_files?: number;
};

export type PullFile = { filename: string; status: string; previous_filename?: string; patch?: string };

export type CheckRun = { id: number; name: string; status: string; conclusion: string | null };

/**
 * Whether a CLAUDE.md change only adds rows to its components table, as CLAUDE.md asks every
 * new component to; anything else in CLAUDE.md is you.
 */
export function onlyAddsComponentRows(file: PullFile): boolean {
  if (file.filename !== "CLAUDE.md" || file.status !== "modified" || file.patch === undefined) return false;
  const changed = file.patch.split("\n").filter((line) => line.startsWith("+") || line.startsWith("-"));
  return changed.length > 0 && changed.every((line) => COMPONENT_ROW.test(line));
}

/** The components whose shipped code the PR adds or modifies, by folder under packages/ui/src. */
function redesignedComponents(files: PullFile[]): Set<string> {
  const components = new Set<string>();
  for (const file of files) {
    if (file.status !== "added" && file.status !== "modified") continue;
    const component = COMPONENT_CODE.exec(file.filename)?.[1];
    if (component !== undefined && SHIPPED.test(file.filename)) components.add(component);
  }
  return components;
}

/**
 * Why a file needs a person, or undefined. `redesigned` is the components whose shipped code the PR
 * adds or modifies: a modified measurement file of one of them is let through to be rated.
 */
export function fileNeedsPerson(
  file: PullFile,
  redesigned: ReadonlySet<string> = new Set(),
): string | undefined {
  if (onlyAddsComponentRows(file)) return undefined;
  for (const path of [file.filename, file.previous_filename]) {
    if (path === undefined) continue;
    if (ALWAYS.some((rule) => rule.test(path))) return `touches ${JSON.stringify(path)}`;
    // A new measurement file is fine; a removed or renamed one is a change to the check, whatever else.
    if (file.status === "added" || !MEASUREMENT.some((rule) => rule.test(path))) continue;
    const own = OWN_MEASUREMENT.map((rule) => rule.exec(path)?.[1]).find((c) => c !== undefined);
    if (file.status === "modified" && own !== undefined && redesigned.has(own)) continue;
    return `changes the existing Figma measurement in ${JSON.stringify(path)}`;
  }
  return undefined;
}

/** The open PR from a branch in this repo whose head is `sha`. */
export function pullAt(pulls: PullRequest[], repo: string, sha: string): PullRequest | undefined {
  return pulls.find((pr) => pr.state === "open" && pr.head.sha === sha && pr.head.repo?.full_name === repo);
}

/** Why the PR needs a person, or undefined when it may go on to be rated. */
export function needsPerson(pr: PullRequest, files: PullFile[], checks: CheckRun[]): string | undefined {
  if (pr.user.id !== OWNER_ID) return `#${pr.number} isn't johnpangalos's`;
  if (pr.draft) return `#${pr.number} is a draft`;

  for (const name of REQUIRED_CHECKS) {
    // The latest run of each job on this commit.
    const run = checks.filter((c) => c.name === name).sort((a, b) => b.id - a.id)[0];
    if (run?.status !== "completed" || run.conclusion !== "success") {
      let state = "not run";
      if (run) state = run.conclusion ?? run.status;
      return `${name} hasn't passed on ${pr.head.sha} (${state})`;
    }
  }

  // The list has to be as long as the PR says it is: the API stops at 3000 files.
  if (files.length === 0 || files.length !== pr.changed_files) {
    return `#${pr.number}'s file list is empty or incomplete`;
  }
  const redesigned = redesignedComponents(files);
  for (const file of files) {
    const reason = fileNeedsPerson(file, redesigned);
    if (reason) return `#${pr.number} ${reason}`;
  }

  if (BREAKING_TITLE.test(pr.title)) return `#${pr.number}'s title marks it as a breaking change`;
  const changesets = files.filter((f) => CHANGESET.test(f.filename) && f.status !== "removed");
  // A changeset too big for the API to show its patch is read as possibly major.
  if (changesets.some((f) => f.patch === undefined || MAJOR.test(f.patch))) {
    return `#${pr.number} has a major changeset for @workers-comp/ui`;
  }
  if (files.some((f) => SHIPPED.test(f.filename)) && changesets.length === 0) {
    return `#${pr.number} changes what @workers-comp/ui ships with no changeset`;
  }
  return undefined;
}

runIfMain(import.meta.url, async () => {
  const repo = env("GITHUB_REPOSITORY");
  const sha = env("SHA");
  const stop = (reason: string) => {
    summary(`Needs a person: ${reason}.`);
    output("eligible", "false");
    output("reason", reason);
  };

  const found = pullAt(await github<PullRequest[]>(`/repos/${repo}/commits/${sha}/pulls`), repo, sha);
  if (!found) return stop(`no open PR from this repo is at ${sha}`);
  output("pr", String(found.number));
  output("base", found.base.sha);

  const [pr, files, checks] = await Promise.all([
    github<PullRequest>(`/repos/${repo}/pulls/${found.number}`),
    githubAll<PullFile>(`/repos/${repo}/pulls/${found.number}/files`),
    github<{ check_runs: CheckRun[] }>(`/repos/${repo}/commits/${sha}/check-runs?per_page=100`),
  ]);
  // Still the PR's head: a push since this run started makes this commit stale.
  if (pr.head.sha !== sha) return stop(`#${pr.number} has moved on from ${sha}`);

  const reason = needsPerson(pr, files, checks.check_runs);
  if (reason) return stop(reason);
  output("eligible", "true");
});
