import assert from "node:assert/strict";
import { test } from "node:test";

import { isApproved } from "./merge.ts";

test("only exactly merge-approved, with a reason, is an approval", () => {
  assert.ok(isApproved('{"decision":"merge-approved","reason":"Docs typo."}'));
  assert.ok(isApproved('{"reason":"Docs typo.","decision":"merge-approved"}'));
  for (const raw of [
    undefined,
    "",
    "{}",
    "merge-approved",
    '{"decision":"needs-human","reason":"x"}',
    '{"decision":"Merge-approved","reason":"x"}',
    '{"decision":"merge-approved"}',
    '{"decision":"merge-approved","reason":1}',
    '{"decision":"merge-approved","reason":"x","extra":1}',
    '{"decision":["merge-approved"],"reason":"x"}',
    '{"risk":"low","reason":"x"}',
    '[{"decision":"merge-approved","reason":"x"}]',
  ]) {
    assert.equal(isApproved(raw), false, String(raw));
  }
});
