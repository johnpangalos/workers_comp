# Reviewing and merging workers_comp

How a change gets from a branch to `main`. What counts as a bug, and the reviewer's checklist,
are in FEATURE_FLOW.md; the rules are in CLAUDE.md.

## How a change gets reviewed

1. **Before the PR, locally**, with the feature-flow-lite skill: an investigator maps the
   code, an implementor builds it against written acceptance criteria, the checks run, a
   simplifier tidies the diff, and a red-team reviewer writes and runs probes to break it,
   for at most two fix rounds. It runs on your Claude plan.
2. **The PR** has a Conventional Commits title and the template filled in: what and why, the
   risk, and, in its "For review and decision agents" disclosure, what an agent needs to judge
   the change without rerunning it: the acceptance criteria, each check's result line, the
   review findings and what is still open, and what wasn't covered. Copy it from the
   feature-flow-lite report.
3. **Required CI**: `check` (`pnpm check`: format, lint, types, tests, build), `figma`
   (`pnpm test:figma`, on macOS) and `pr-title`. Red blocks the merge.
4. **Merge by risk** (`.github/workflows/claude-risk.yml`). When CI passes on a low-risk PR,
   it merges by itself; everything else waits for you.

## Risk tiers

The paths set the tier, and Claude can only make it stricter.

| Tier | What | Merge |
|---|---|---|
| Low | Only `docs/**`, `README.md`, playground example pages (`apps/playground/app/examples/**`) other than the ones the Figma specs measure (`figma.tsx`, `overrides.tsx`), and a component's own tests (`packages/ui/src/<component>/*.test.ts(x)`) | Automatic, when the required checks pass and Claude answers `merge-approved` |
| Medium | The package (`packages/ui/src/**`), `theme.css`, Figma exports and tokens, changesets | You |
| Always you | `.github/**`; `.claude/**` (its hooks run on your machine); `CLAUDE.md`, `FEATURE_FLOW.md` and `REVIEW.md`; the Figma specs and the measuring code (`apps/playground/tests/`) and the token test (`packages/ui/src/theme.test.ts`), which say whether code matches Figma; `package.json`, `pnpm-lock.yaml`, lint, format and Wrangler config; the "Version Packages" PR, which publishes to npm | You |

For a PR whose files are all low tier, Claude (Haiku) gets the diff, the PR description,
CLAUDE.md and this file in one Messages API request and answers, as JSON that the API holds to a schema (structured
outputs), `merge-approved` or `needs-human` with a one-sentence reason. `merge-approved` only
if the change is docs, copy, examples or tests that only add coverage, and is right: docs that
say only what the code does, tests that loosen nothing. Anything else, any doubt, a refusal or a
cut-off answer is `needs-human`, and so is a description claim the diff doesn't back or an
open finding. The verdict and its reason are in the run's summary.

Start strict and widen with evidence: move a path down a tier only after its PRs have been
approved and merged clean for a while.

It runs when CI or the PR title check finishes on a PR's commit (`workflow_run`), so editing the
description re-rates the PR, and it goes on only once `check` and `figma` have passed on that
commit. GitHub always runs a `workflow_run` from `main`'s copy of the workflow, and its steps
are `main`'s scripts in `.github/scripts/claude-risk/`, so a PR can't change the rules it is
judged by. It merges that exact commit, so a push since is refused, and nothing is left
switched on between pushes. The merge is made with the workflow's own token, so it doesn't
start CI or the release on `main`; that's fine for the low tier, which has nothing to release.

## Setup

The workflow uses no secrets. It needs workload identity federation, which trades each run's
GitHub OIDC token for a short-lived Claude API token. In the Claude Console, open
[Workload identity](https://platform.claude.com/settings/workload-identity-federation) (it needs
the admin or owner role) and create a service account (`workers-comp-review`, role developer,
in the Default workspace) and a rule for it with **Rules → New rule**: issuer GitHub Actions
(`https://token.actions.githubusercontent.com`), audience `https://api.anthropic.com`, the
Default workspace, scope `workspace:developer`, lifetime 1 hour, and match **CEL expression**:

```
claims.sub == "repo:johnpangalos/workers_comp:ref:refs/heads/main" && claims.repository_owner_id == "6550688" && claims.event_name == "workflow_run" && claims.job_workflow_ref == "johnpangalos/workers_comp/.github/workflows/claude-risk.yml@refs/heads/main"
```

A `workflow_run` always runs on `main`, so that is its subject; the last clause means only this
workflow, as it is on `main`, can get a token.

Then add the IDs as repository *variables* (Settings → Secrets and variables → Actions →
Variables; they are identifiers, not credentials): `ANTHROPIC_FEDERATION_RULE_ID` (`fdrl_…`),
`ANTHROPIC_ORGANIZATION_ID` (the UUID on
[Organization](https://platform.claude.com/settings/organization)) and
`ANTHROPIC_SERVICE_ACCOUNT_ID` (`svac_…`). Usage is billed as API usage to that organization.

The workflow only runs once it is on `main`.

## Who can trigger what

The repo is public, so anyone can fork it and open a PR; GitHub doesn't let a personal
account's public repo turn forking off. What a fork or an outsider can start is limited
instead:

- Only PRs johnpangalos opened, from this repo's own branches, are rated, checked by GitHub
  user ID (6550688) so a rename doesn't hand the check to whoever takes the old name.
- The rules are `main`'s: the workflow runs on `workflow_run`, from the default branch, so
  a PR that edits it is judged by the version already on `main` (and needs a person anyway).
- No PR code runs. The diff is read with `git diff` and sent to Claude as text.
- Claude gets no tools at all: one request in, one JSON verdict out, from a job whose GitHub
  token can only read. A separate job, not Claude, merges, and only on exactly
  `{"decision": "merge-approved", "reason": …}`. The diff is marked as data, and a PR that talks
  Claude into approving still has to be all low-tier files.
- Every action is pinned to a commit SHA (Dependabot keeps the pins current), checkouts drop
  their credentials, and CI's token is read-only.

Repository settings that go with it:

- **Rules → `main` ruleset:** `figma` in the required status checks, and "Restrict deletions"
  and "Block force pushes".
- **Actions → General:** "Require approval for all external contributors" for fork PR
  workflows; allow only actions from GitHub, verified creators and `anthropics/*`,
  `pnpm/*`, `changesets/*`, with "Require actions to be pinned to a full-length commit SHA".
- **Moderation → Interaction limits:** "collaborators only" stops outsiders from opening PRs,
  issues and comments, for up to six months at a time.
- **Advanced Security:** Dependabot security updates on; secret scanning and push protection
  are already on.
