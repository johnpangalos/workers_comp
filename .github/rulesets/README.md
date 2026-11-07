# Rulesets

GitHub doesn't read rulesets from the repository: these files are a versioned copy of what
is set in **Settings → Rules → Rulesets**. Change the file and the live ruleset together.

`main.json` protects the default branch: changes go through a squash-merged pull request,
and the `check` and `pr-title` jobs from `.github/workflows/ci.yml` must pass first
(`15368` is the GitHub Actions app, so only Actions can report those checks).

Apply it once (needs admin on the repo):

```sh
gh api -X POST repos/johnpangalos/workers_comp/rulesets --input .github/rulesets/main.json
```

or **Settings → Rules → Rulesets → New ruleset → Import a ruleset** and pick the file.
After a change, update the live one with `gh api -X PUT repos/johnpangalos/workers_comp/rulesets/<id> --input .github/rulesets/main.json`
(`gh api repos/johnpangalos/workers_comp/rulesets` lists the ids).

If a job in `ci.yml` is renamed, rename it here too, or every PR waits on a check that never
runs.
