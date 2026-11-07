# Reviewing workers_comp

What the automated review (`.github/workflows/claude-review.yml`) looks for, and how it
reports. CLAUDE.md has the rules; this file says which breaks of them matter. When the same
review comment comes up twice, add it here, or to CLAUDE.md or a lint rule if it belongs there.

## How a change gets reviewed

1. **Before the PR**, the `pre-pr` skill (`.claude/skills/pre-pr/`) runs the checks and shows
   their output, then `/simplify`, `/code-review` and `/security-review` in fresh context.
2. **Required CI**: `check` (format, lint, types, tests, build), `figma` (`pnpm test:figma`)
   and `pr-title`. Red blocks the merge.
3. **Claude review** on every push: three bug hunters in parallel, three verifiers voting on
   each finding, survivors posted inline by severity. From round 3 it re-reviews only the new
   diff; after three rounds it asks whether the approach should change.
4. **Security review** (`claude-security-review.yml`), a separate pass with its own findings.
5. **Every thread answered.** A PR can't merge with an open finding from either review: fix
   it, or resolve the thread with a reason (that's how a false positive is cleared). A push
   that fixes a finding resolves its thread on the next review.
6. **Fixes on request.** `@claude` in a PR comment (`claude-fix.yml`) has Claude fix the open
   findings, run the checks and push, which starts the next review round.

## What failure looks like

A finding is a change that makes a component or page wrong, or lets it drift from Figma
without a test noticing:

- **The code doesn't match Figma, or approximates it.** A value typed in by hand where Figma
  has a variable, a near-miss utility (`gap-3` where the export says 4), a design "fixed" in
  code. The export in `apps/playground/figma/<name>.json` is the reference.
- **The Figma check was weakened.** A `figma.spec.ts` that loosens `expectToMatchFigma`, skips a
  node or a state, or an export in `apps/playground/figma/` edited by hand (it ends in a hash).
  A new or changed component with no playground page and spec measuring it, a node in the
  export the spec doesn't measure, or a state the design draws that the spec doesn't reach
  the way a person does (real hover, press, keyboard focus).
- **A theme token that isn't in Figma**, or a Figma variable added to `theme.css` under a
  different name or value than `figma-tokens.json`.
- **Markup rebuilt** for something that is already a `@workers-comp/ui` component, or a state
  (hover, pressed, focus, disabled) passed as a prop instead of comp0's `data-*` attributes.
- **Not the pattern around it.** Anything `button.tsx` does that the new component should and
  doesn't: classes through `cx(…)` selecting on `data-*`, a consumer's `className` appended
  as is so it overrides the component, the export in `packages/ui/src/index.ts`, a row in
  CLAUDE.md's components table.
- **Behaviour not from comp0**: another headless library, or hand-rolled focus, keyboard or
  ARIA handling that comp0 already gives.
- **The shipped package changed with no changeset** in `.changeset/`, a changeset with the
  wrong bump (`patch` fix, `minor` new, `major` breaking), or `CHANGELOG.md` or a version
  edited by hand.
- **Accessibility**: a control with no accessible name, a lost focus ring, a state only colour
  shows. Keyboard: reachable with Tab, a visible focus ring only for keyboard focus, nothing
  fires when disabled; a button activates with Enter and Space, a link (Badge, Chip) with
  Enter only, as native links do.

Security (workflow permissions, untrusted input, secrets, dependencies) is the security
review's, not this one's.

## Skip

- Anything oxlint, oxfmt, `tsc` or the tests in CI catch: formatting, class order, ternaries,
  arbitrary Tailwind values.
- Generated files: `pnpm-lock.yaml`, `CHANGELOG.md`, `apps/playground/figma/*.json`,
  `packages/ui/src/figma-tokens.json`. Review the code that uses them, not their contents.
- Taste: naming, wording and structure that CLAUDE.md doesn't rule on.

## How to write a finding

- Every finding names a file and line and says what goes wrong, for which input or state.
  No evidence, no finding.
- **Important** is a real bug or a broken rule above. **Nit** is worth a minute but not a
  blocker; at most 3. **Pre-existing** is a real bug the PR didn't introduce.
- Where one cause shows up in several places, one finding names the class of bug and lists
  every place, so the fix covers all of them.
- The summary starts with the count, and says "Nothing to fix." when there is nothing.

## Setup

The workflows use no secrets. They need the Claude GitHub App on the repository, and workload
identity federation so each run trades its GitHub OIDC token for a short-lived Claude API
token. In the Claude Console, open
[Workload identity](https://platform.claude.com/settings/workload-identity-federation) (it needs
the admin or owner role) and click **Connect workload** → **GitHub Actions**.

**Rule for the reviews** (`claude-review.yml`, `claude-security-review.yml`):

| Field | Value |
|---|---|
| Issuer | `https://token.actions.githubusercontent.com` |
| GitHub organization / Repository | `johnpangalos` / `workers_comp` |
| Branch / ref | blank (PR runs aren't on `main`) |
| Organization numeric ID | `6550688` |
| Allowed events | The dropdown has no pull request option. Open **Advanced match options** instead. |
| Subject pattern | `repo:johnpangalos/workers_comp:pull_request`, exact, no `*` |
| Additional claims | the ones it prefills, with `event_name` changed from `push` to `pull_request` |
| Expected audience | `https://api.anthropic.com` |
| Workspaces | the one the service account works in (Default) |
| OAuth scope / Token lifetime | under **Advanced rule options**: `workspace:developer`, 1 hour |
| Target | a new service account (`workers-comp-review`) |

**Rule for the fixer** (`claude-fix.yml`): the same, except comment events aren't
`pull_request` runs. Their subject is the default branch's
(`repo:johnpangalos/workers_comp:ref:refs/heads/main` for a PR comment), so: subject pattern
`repo:johnpangalos/workers_comp:*`, no `event_name` claim, and the CEL condition
`claims.event_name in ["issue_comment", "pull_request_review_comment", "pull_request_review"] && claims.job_workflow_ref.startsWith("johnpangalos/workers_comp/.github/workflows/claude-fix.yml@")`,
so only that workflow can use it. Target the same service account. The job only runs for
people who can write to the repo.

Then add the IDs as repository *variables* (Settings → Secrets and variables → Actions →
Variables; they are identifiers, not credentials): `ANTHROPIC_FEDERATION_RULE_ID` and
`ANTHROPIC_FIX_FEDERATION_RULE_ID` (`fdrl_…`), `ANTHROPIC_ORGANIZATION_ID` (the UUID on
[Organization](https://platform.claude.com/settings/organization)) and
`ANTHROPIC_SERVICE_ACCOUNT_ID` (`svac_…`). Usage is billed as API usage to that organization.

The Claude workflows only run once they are on `main`: on a PR that adds or changes one, the
action skips itself (and the check still shows green).

## Who can trigger what

The repo is public, so anyone can fork it and open a PR; GitHub doesn't let a personal
account's public repo turn forking off. What a fork or an outsider can start is limited
instead:

- The Claude reviews only run on PRs from this repo's own branches, opened by someone with
  write access. Fork PRs don't get an OIDC token or secrets anyway; the guard means they
  don't even start.
- The fixer only runs on a comment from someone with write access, and stops if the PR comes
  from a fork.
- Every action is pinned to a commit SHA (Dependabot keeps the pins current), checkouts that
  don't push drop their credentials, and CI's token is read-only.

Repository settings that go with it:

- **Rules → `main` ruleset:** "Require conversation resolution before merging", `figma` in
  the required status checks, and "Restrict deletions" and "Block force pushes".
- **Actions → General:** "Require approval for all external contributors" for fork PR
  workflows; allow only actions from GitHub, verified creators and `anthropics/*`,
  `pnpm/*`, `changesets/*`, with "Require actions to be pinned to a full-length commit SHA".
- **Moderation → Interaction limits:** "Limit to prior contributors" or "collaborators only"
  stops outsiders from opening PRs, issues and comments, for up to six months at a time.
- **Advanced Security:** Dependabot security updates on; secret scanning and push protection
  are already on.
