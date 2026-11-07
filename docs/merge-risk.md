# Merging by risk

How a change gets from a branch to `main`, and how low-risk PRs merge with no person reading
them. Why it's built this way is in [tooling-decisions.md](tooling-decisions.md), "Review".

## From branch to main

1. **Before the PR, locally**, with the feature-flow-lite skill: an investigator maps the
   code, an implementor builds it against written acceptance criteria, the checks run, a
   simplifier tidies the diff, and a red-team reviewer writes and runs probes to break it,
   for at most two fix rounds. It runs on your Claude plan. Its project file, with the
   reviewer's checklist, is [FEATURE_FLOW.md](../FEATURE_FLOW.md).
2. **The PR** has a Conventional Commits title and the template filled in: what and why, the
   risk, and, in its "For review and decision agents" disclosure, what an agent needs to judge
   the change without rerunning it: the acceptance criteria, each check's result line, the
   review findings and what is still open, and what wasn't covered. Copy it from the
   feature-flow-lite report.
3. **Required CI**: `check` (`pnpm check`: format, lint, types, tests, build), `figma`
   (`pnpm test:figma`, on macOS) and `pr-title`. Red blocks the merge.
4. **Merge by risk** (`.github/workflows/claude-risk.yml`): a low-risk PR merges by itself;
   everything else waits for you.

## What merges by itself

Only a PR whose every file (and every rename's old name) is one of these:

- `docs/**` and `README.md`;
- a playground example page (`apps/playground/app/examples/**`) other than the ones the Figma
  specs measure (`figma.tsx`, `overrides.tsx`);
- a component's own tests (`packages/ui/src/<component>/*.test.ts(x)`).

`isLowRisk` in `.github/scripts/claude-risk/gate.ts` is the rule, with tests. Everything else
waits for you: the package, the theme and its token test, Figma exports and specs and the
measuring code, changesets, `.github/`, `.claude/` (its hooks run on your machine), CLAUDE.md
and FEATURE_FLOW.md, dependencies and config, and the "Version Packages" PR, which publishes
to npm. Start strict and widen with evidence: add a path only after PRs like it have merged
clean for a while.

## How the check runs

It runs when CI or the PR title check finishes on a PR's commit (`workflow_run`), so editing the
description re-rates the PR. GitHub runs a `workflow_run` from `main`'s copy of the workflow,
and its steps are `main`'s scripts in `.github/scripts/claude-risk/`, so a PR can't change the
rules it is judged by. Three jobs, each one script:

- **gate** (`gate.ts`): the PR is johnpangalos's, from a branch here, not a draft, still at
  that commit, `check` and `figma` passed on it, and every file is on the list above. Most PRs
  stop here, with no Claude call.
- **rate** (`rate.ts`): Claude (Haiku) gets the diff, the PR description and CLAUDE.md in one
  Messages API request, and answers, as JSON the API holds to a schema (structured outputs),
  `merge-approved` or `needs-human` with a one-sentence reason. `merge-approved` only if the
  change is docs, copy, examples or tests that only add coverage, and is right: docs that say
  only what the code does, tests that loosen nothing. Anything else, any doubt, a description
  claim the diff doesn't back, an open finding, a refusal or a cut-off answer is
  `needs-human`. The verdict and its reason are in the run's summary.
- **merge** (`merge.ts`): on exactly `merge-approved`, squash-merges that commit; a push since
  is refused. The merge is made with the workflow's own token, so it doesn't start CI or the
  release on `main`; the low tier has nothing to release.

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

Then add the IDs as repository _variables_ (Settings → Secrets and variables → Actions →
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
- The rules are `main`'s, so a PR that edits them is judged by the version already on `main`
  (and needs a person anyway).
- No PR code runs: its commits are fetched and diffed, never checked out, and the diff goes to
  Claude as text.
- Claude gets no tools at all: one request in, one JSON verdict out, from a job whose GitHub
  token can only read. A separate job, not Claude, merges, and only on exactly
  `{"decision": "merge-approved", "reason": …}`. The diff is marked as data, and a PR that talks
  Claude into approving still has to be all low-risk files.
- Every action is pinned to a commit SHA (Dependabot keeps the pins current), checkouts drop
  their credentials, and CI's token is read-only.

## Repository settings

- **Rules → `main` ruleset:** `check`, `figma` and `pr-title` in the required status checks,
  and "Restrict deletions" and "Block force pushes".
- **Actions → General:** "Require approval for all external contributors" for fork PR
  workflows; allow only actions from GitHub, verified creators and `anthropics/*`,
  `pnpm/*`, `changesets/*`, with "Require actions to be pinned to a full-length commit SHA".
- **Moderation → Interaction limits:** "collaborators only" stops outsiders from opening PRs,
  issues and comments, for up to six months at a time.
- **Advanced Security:** Dependabot security updates on; secret scanning and push protection
  are already on.
