---
name: pre-pr
description: Use before opening or updating a pull request in workers_comp, or when asked to check that a change is ready. Verifies the change with this repo's checks and shows their output, then runs the built-in simplify, code-review and security-review passes in fresh context, and fills in the PR template.
---

# Before the pull request

Most review should happen before a PR exists. Every PR you open then gets the Claude review and the
security review in CI (REVIEW.md); this is the same work done first, so CI finds less.

1. **Verify, and show it.** Run each check and quote the command and its result line, not
   "tests pass":
   - `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
   - `pnpm test:figma` if anything under `packages/ui/` or `apps/playground/` changed. Anything
     built from Figma isn't done until its measurement passes (CLAUDE.md, "Checking the
     result against Figma"); never loosen a spec to get there.

   Fix what fails before going on.
2. **Simplify.** Run `/simplify` on the change, then the checks again if it edited anything.
3. **Review in fresh context.** Run `/code-review` and `/security-review`. Fix real findings,
   and say which ones you dropped and why.
4. **Fix at the source.** If a finding is something the CI review has flagged before, or will
   flag again, add one line where it belongs instead of only fixing this instance: a rule in
   REVIEW.md's "What failure looks like", a line in CLAUDE.md, or a lint rule in
   `.oxlintrc.json`.
5. **The PR.** A Conventional Commits title (CI checks it), a changeset if what
   `@workers-comp/ui` ships changes, and `.github/pull_request_template.md` filled in:
   Testing with the output from step 1, Risk, and How to revert.

Report what each step found and what you fixed. If a check still fails, say so and don't
open the PR.
