// gate: whether the PR at this commit is one that may merge with no person reading it, before
// any Claude call. Outputs `low` (true or false), and `pr` and `base` when there is a PR.
//
// Low risk: docs, the README, playground example pages other than the ones the Figma specs
// measure (figma.tsx, overrides.tsx), and a component's own tests. Everything else (the
// package, the theme and its token test, Figma exports, the Figma specs and the measuring
// code, changesets, CI, .claude/, CLAUDE.md, FEATURE_FLOW.md, dependencies, config) needs a
// person. docs/merge-risk.md, "What merges by itself", is the same list for people.

import { env, github, githubAll, output, runIfMain, summary } from "./actions.ts";

/** johnpangalos, by user ID, which survives a rename. */
export const OWNER_ID = 6550688;

/** The CI jobs that must have passed on the commit (`.github/workflows/ci.yml`). */
export const REQUIRED_CHECKS = ["check", "figma"];

// Whole names: without the m flag `^` and `$` are the ends of the string, and `.` doesn't
// match a newline, so a name with a newline in it can't pass as two.
const LOW =
  /^(docs\/.+|README\.md|apps\/playground\/app\/examples\/.+|packages\/ui\/src\/[^/]+\/[^/]+\.test\.tsx?)$/;
const MEASURED = /^apps\/playground\/app\/examples\/[^/]+\/(figma|overrides)\.tsx$/;

export const isLowRisk = (path: string) => LOW.test(path) && !MEASURED.test(path);

export type PullRequest = {
  number: number;
  state: string;
  draft: boolean;
  user: { id: number };
  base: { sha: string };
  head: { sha: string; repo: { full_name: string } | null };
  changed_files?: number;
};

export type PullFile = { filename: string; previous_filename?: string };

export type CheckRun = { id: number; name: string; status: string; conclusion: string | null };

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
  for (const file of files) {
    for (const path of [file.filename, file.previous_filename]) {
      if (path !== undefined && !isLowRisk(path)) return `#${pr.number} touches ${JSON.stringify(path)}`;
    }
  }
  return undefined;
}

runIfMain(import.meta.url, async () => {
  const repo = env("GITHUB_REPOSITORY");
  const sha = env("SHA");
  const stop = (reason: string) => {
    summary(`Needs a person: ${reason}.`);
    output("low", "false");
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
  output("low", "true");
});
