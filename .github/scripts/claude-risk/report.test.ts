import assert from "node:assert/strict";
import { test } from "node:test";

import { comment, headline, MARKER } from "./report.ts";

const base = { sha: "abc1234def", runUrl: "https://github.com/o/r/actions/runs/1" };
const approved = '{"decision":"merge-approved","reason":"Docs typo."}';

test("the gate's reason is the headline when it stopped the PR", () => {
  assert.equal(
    headline({ ...base, gateReason: '#7 touches ".github/workflows/ci.yml"' }),
    '**Needs a person.** #7 touches ".github/workflows/ci.yml".',
  );
});

test("Claude's reason is shown for a needs-human verdict and for a merge", () => {
  const human = headline({ ...base, verdict: '{"decision":"needs-human","reason":"Loosens a test."}' });
  assert.equal(human, "**Needs a person.** Claude: Loosens a test.");
  assert.equal(
    headline({ ...base, verdict: approved, mergeResult: "success" }),
    "**Merged by itself.** Claude: Docs typo.",
  );
});

test("an approval GitHub didn't merge, or no verdict at all, is said as such", () => {
  assert.match(headline({ ...base, verdict: approved, mergeResult: "failure" }), /Approved, but not merged/);
  assert.match(headline({ ...base, rateResult: "failure" }), /didn't finish/);
  assert.match(headline({ ...base, verdict: "not json" }), /didn't finish/);
});

test("Claude's reason can't mention anyone, and is kept short", () => {
  const loud = headline({
    ...base,
    verdict: JSON.stringify({ decision: "needs-human", reason: `ping @someone ${"x".repeat(1000)}` }),
  });
  assert.equal(loud.includes("@someone"), false);
  assert.ok(loud.length < 600);
});

test("the comment starts with the marker it's found by, and links the run and the doc", () => {
  const body = comment({ ...base, gateReason: "#7 is a draft" });
  assert.ok(body.startsWith(`${MARKER}\nMerge-risk check: **Needs a person.** #7 is a draft.`));
  assert.match(body, /At abc1234 · \[run\]\(https:\/\/github.com\/o\/r\/actions\/runs\/1\)/);
  assert.match(body, /docs\/merge-risk.md/);
});
