// merge: squash-merges the PR at the rated commit, only on exactly a merge-approved verdict.
// GitHub still requires every required check, and refuses if the head has moved since (`sha`).

import { env, github, runIfMain, summary } from "./actions.ts";
import { parseVerdict } from "./verdict.ts";

/** Whether the rate step's output is an approval: exactly `{"decision":"merge-approved",…}`. */
export const isApproved = (raw: string | undefined) => parseVerdict(raw)?.decision === "merge-approved";

runIfMain(import.meta.url, async () => {
  const repo = env("GITHUB_REPOSITORY");
  const pr = env("PR");
  const sha = env("SHA");
  if (!isApproved(process.env.VERDICT)) return summary(`Not merging #${pr}: Claude didn't approve it.`);

  await github(`/repos/${repo}/pulls/${pr}/merge`, {
    method: "PUT",
    body: JSON.stringify({ merge_method: "squash", sha }),
  });
  summary(`Merged #${pr} at ${sha}.`);
});
