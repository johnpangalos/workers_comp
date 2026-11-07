# Rulesets

GitHub doesn't read rulesets from the repository: these files are a versioned copy of what
is set in **Settings → Rules → Rulesets**, applied by CI (below). Change the file, not the settings page.

`main.json` protects the default branch: changes go through a squash-merged pull request,
and the `check` and `pr-title` jobs from `.github/workflows/ci.yml` must pass first
(`15368` is the GitHub Actions app, so only Actions can report those checks).

The [Rulesets workflow](../workflows/rulesets.yml) applies every file here when a change to
this folder merges to `main`, updating the ruleset with the same `name` or creating it. It
needs a `RULESETS_TOKEN` secret (`GITHUB_TOKEN` can't manage rulesets): a fine-grained token
for this repo only, with **Administration: read and write** and an expiry. That permission
can also change settings and delete the repo, so keep it out of reach of pull requests: in
**Settings → Environments**, create a `rulesets` environment, set its deployment branches to
`main` only, and add the secret there, not as a repository secret. Run it by hand
from the Actions tab to apply the current files without a change. Deleting a file doesn't
delete its ruleset; do that in Settings.

To apply by hand instead (needs admin on the repo):

```sh
gh api -X POST repos/johnpangalos/workers_comp/rulesets --input .github/rulesets/main.json
```

If a job in `ci.yml` is renamed, rename it here too, or every PR waits on a check that never
runs.
