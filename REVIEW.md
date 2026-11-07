# Reviewing workers_comp

What the automated review (`.github/workflows/claude-review.yml`) looks for, and how it
reports. CLAUDE.md has the rules; this file says which breaks of them matter. When the same
review comment comes up twice, add it here.

## What failure looks like

A finding is a change that makes a component or page wrong, or lets it drift from Figma
without a test noticing:

- **The code doesn't match Figma, or approximates it.** A value typed in by hand where Figma
  has a variable, a near-miss utility (`gap-3` where the export says 4), a design "fixed" in
  code. The export in `apps/playground/figma/<name>.json` is the reference.
- **The Figma check was weakened.** A `figma.spec.ts` that loosens `expectToMatchFigma`, skips a
  node or a state, or an export in `apps/playground/figma/` edited by hand (it ends in a hash).
  A new or changed component with no playground page and spec measuring it.
- **A theme token that isn't in Figma**, or a Figma variable added to `theme.css` under a
  different name or value than `figma-tokens.json`.
- **Markup rebuilt** for something that is already a `@workers-comp/ui` component, or a state
  (hover, pressed, focus, disabled) passed as a prop instead of comp0's `data-*` attributes.
- **Behaviour not from comp0**: another headless library, or hand-rolled focus, keyboard or
  ARIA handling that comp0 already gives.
- **The shipped package changed with no changeset** in `.changeset/`, a changeset with the
  wrong bump (`patch` fix, `minor` new, `major` breaking), or `CHANGELOG.md` or a version
  edited by hand.
- **Accessibility**: a control with no accessible name, a lost focus ring, a state only
  colour shows.
- **Workflows**: a `.github/workflows/` change that widens permissions, puts PR-controlled text
  into a `run:` script, or adds a long-lived secret where a short-lived token would do.

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
- The summary starts with the count, and says "Nothing to fix." when there is nothing.

## Setup

The workflow uses no secrets. It needs the Claude GitHub App on the repository, and workload
identity federation so each run trades its GitHub OIDC token for a short-lived Claude API token.
In the [Claude Console](https://platform.claude.com), under Settings → Workload identity:

1. Register an issuer: `https://token.actions.githubusercontent.com`, JWKS source `discovery`.
2. Create a service account (Settings → Service accounts) and add it to a workspace.
3. Create a federation rule for that service account, matching the subject
   `repo:johnpangalos/workers_comp:pull_request` and the audience `https://api.anthropic.com`.

Then add the IDs as repository *variables* (Settings → Secrets and variables → Actions →
Variables; they are identifiers, not credentials): `ANTHROPIC_FEDERATION_RULE_ID` (`fdrl_…`),
`ANTHROPIC_ORGANIZATION_ID` (the organization UUID) and `ANTHROPIC_SERVICE_ACCOUNT_ID`
(`svac_…`). Usage is billed as API usage to that organization.

To make findings block merging, turn on "Require conversation resolution before merging" in
the `main` branch rule. Then each finding has to be fixed or resolved with a reason.
