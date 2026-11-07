# Merging without a person

How a change gets from a branch to `main`, and how PRs that aren't breaking merge with no
person reading them. Why it's built this way is in [tooling-decisions.md](tooling-decisions.md), "Review".

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
4. **Merge** (`.github/workflows/claude-risk.yml`): a PR merges by itself unless it's breaking
   or touches the safeguards; then it waits for you, with a comment saying why.

## What needs you

A PR merges by itself unless it's a breaking change for the apps that use `@workers-comp/ui`,
or it touches what the safeguards rest on. `.github/scripts/claude-risk/gate.ts` holds what it
can see without reading the change, with tests:

- **Always you:** `.github/` and `.claude/` (they run with write tokens or on your machine),
  CLAUDE.md and FEATURE_FLOW.md (they steer every agent; adding a row to CLAUDE.md's
  components table, as every new component does, is the one exception), any `package.json`
  and the lockfile (dependencies), the config that decides what the checks check (lint,
  format, TypeScript, Vitest, Playwright, Changesets), `wrangler.jsonc`, and the shared Figma
  measuring code (`apps/playground/tests/figma.ts`).
- **Changing existing Figma measurement:** a new spec, export or measured page is fine, but
  changing or removing one, or the token snapshot or its test, is how a check gets loosened.
- **Breaking, by its own account:** a `major` changeset, or a `feat!:`-style title.
- **No changeset:** a change to what the package ships (`packages/ui/src`, not its tests) with
  no changeset.

Then Claude reads the change for what a path can't show (see below). How a component looks is
not breaking: a new Figma design for an existing variant, a colour or spacing change, merges
by itself. The "Version Packages" PR, which publishes to npm, is the release step: it's opened
by the release workflow, not by you, so it always waits for you.

## Setup

The workflow uses no secrets. It needs workload identity federation, which trades each run's
GitHub OIDC token for a short-lived Claude API token. In the Claude Console, open
[Workload identity](https://platform.claude.com/settings/workload-identity-federation) (it needs
the admin or owner role) and create a service account (`workers-comp-review`, role developer,
in the Default workspace) and a rule for it with **Rules → New rule**: issuer GitHub Actions
(`https://token.actions.githubusercontent.com`), audience `https://api.anthropic.com`, the
Default workspace, scope `workspace:developer`, lifetime 1 hour, and match **CEL expression**:

```
claims.sub == "repo:johnpangalos@6550688/workers_comp@1410780847:ref:refs/heads/main" && claims.repository_owner_id == "6550688" && claims.event_name == "workflow_run" && claims.job_workflow_ref == "johnpangalos/workers_comp/.github/workflows/claude-risk.yml@refs/heads/main"
```

A `workflow_run` always runs on `main`, so that is its subject; the last clause means only this
workflow, as it is on `main`, can get a token. The repo uses GitHub's immutable subject, which
puts the owner and repo IDs in `sub` (`gh api repos/johnpangalos/workers_comp/actions/oidc/customization/sub`
shows the prefix); the old `repo:johnpangalos/workers_comp:…` form never matches.

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
  Claude into approving still has to get past the gate first.
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
