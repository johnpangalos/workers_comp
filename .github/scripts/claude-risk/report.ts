// report: keeps one comment on the PR saying where the merge-risk check stopped and why, so the
// person who reviews it sees the reason without opening the run. Updated in place on each run.

import { env, github, githubAll, runIfMain, summary } from "./actions.ts";
import { parseVerdict } from "./verdict.ts";

export const MARKER = "<!-- claude-risk -->";

export type Outcome = {
  sha: string;
  runUrl: string;
  /** The gate's reason, when it stopped the PR. */
  gateReason?: string;
  /** The rate and merge jobs' results (`success`, `failure`, `skipped`, …). */
  rateResult?: string;
  verdict?: string;
  mergeResult?: string;
};

// Claude's reason is text from a model: keep it from mentioning anyone or running on.
const quiet = (text: string) => text.replaceAll("@", "&#64;").slice(0, 500);

/** What the check found, in a sentence or two. */
export function headline(outcome: Outcome): string {
  if (outcome.gateReason) return `**Needs a person.** ${quiet(outcome.gateReason)}.`;
  const verdict = parseVerdict(outcome.verdict);
  if (!verdict) return "**Needs a person.** The rating didn't finish, so there's no verdict; see the run.";
  if (verdict.decision === "needs-human") return `**Needs a person.** Claude: ${quiet(verdict.reason)}`;
  if (outcome.mergeResult === "success") return `**Merged by itself.** Claude: ${quiet(verdict.reason)}`;
  return `**Approved, but not merged.** Claude approved it (${quiet(verdict.reason)}), but GitHub refused the merge; see the run. A person can merge it.`;
}

/** The whole comment. */
export function comment(outcome: Outcome): string {
  return [
    MARKER,
    `Merge-risk check: ${headline(outcome)}`,
    "",
    `<sub>At ${outcome.sha.slice(0, 7)} · [run](${outcome.runUrl}) · what needs a person: [docs/merge-risk.md](../blob/main/docs/merge-risk.md)</sub>`,
  ].join("\n");
}

type IssueComment = { id: number; body?: string; user: { login: string } | null };

runIfMain(import.meta.url, async () => {
  const repo = env("GITHUB_REPOSITORY");
  const pr = env("PR");
  const body = comment({
    sha: env("SHA"),
    runUrl: env("RUN_URL"),
    gateReason: process.env.GATE_REASON || undefined,
    rateResult: process.env.RATE_RESULT,
    verdict: process.env.VERDICT,
    mergeResult: process.env.MERGE_RESULT,
  });

  // The workflow's own earlier comment, if there is one.
  const comments = await githubAll<IssueComment>(`/repos/${repo}/issues/${pr}/comments`);
  const mine = comments.find((c) => c.user?.login === "github-actions[bot]" && c.body?.startsWith(MARKER));
  if (mine) {
    await github(`/repos/${repo}/issues/comments/${mine.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
  } else {
    await github(`/repos/${repo}/issues/${pr}/comments`, { method: "POST", body: JSON.stringify({ body }) });
  }
  summary(body.split("\n")[1]!);
});
