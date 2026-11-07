# Tooling decisions

How the Button got from Figma to code, and the three choices that shape every component after it.

## The Button

`packages/ui/src/button/button.tsx` is the Figma component set translated one-to-one:

| Figma | Code |
|---|---|
| `variant` = default, outline, ghost | `variant` prop, same values |
| `size` = default, sm | `size` prop, same values |
| `state` = hover, active, focus, disabled | comp0's `data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled` (no prop) |
| `Label` | `children` |

- **Classes are inline Tailwind, looked up in one CSS module.** `variant` and `size` render as `data-variant` / `data-size`, and the Button's classes select on them with Tailwind data variants (`data-[variant=outline]:data-hovered:bg-gray-50`), written inline in `button.tsx`. `src/tailwind.module.css` imports Tailwind's utilities, so Tailwind generates a rule for every class the components use and CSS modules gives each its own scoped name (`wc-bg-fuchsia-700-…`). `bindClassNames(styles)` (`src/class-names.ts`, our own take on `classnames/bind`, no dependency) turns the class list into those names. Reading the classes top to bottom reads like the Figma variant grid, there's no hand-written CSS, and there's no custom build step: it is Tailwind and CSS modules, nothing else.
- **Tailwind is build-time only.** The utilities compile to plain CSS with the token values inlined (`theme(inline)` in `src/theme.css`), and the package ships `dist/styles.css`. Apps import that file once and don't need Tailwind. CSS modules scope the class names, so they can't clash with the app's own Tailwind.
- **`className` overrides anything.** The module puts the utilities in `@layer components` and declares Tailwind's layer order up front. So in a Tailwind app, utilities in `className` beat the component and preflight stays under it, whichever stylesheet loads first; in any other app, plain (unlayered) CSS beats it. A consumer's `className` is appended as is, never looked up in the module. The playground's `/button/overrides` page shows a pill, a recoloured outline and a disabled pill, and `tests/button.overrides.spec.ts` checks them in Chromium. The flip side: an app's unlayered global `button { … }` reset also beats the component, so resets belong in a layer.
- **The Button resets the browser's button styles** (margin, border, appearance), so it looks the same with or without a CSS reset.
- **Disabled is stacked per variant: `data-[variant=default]:data-disabled:bg-gray-100`.** That compiles to `[data-variant=default][data-disabled]`, which beats the plain variant colours on specificity, and `pointer-events: none` keeps hover and press from ever applying to a disabled button. The ghost variant has no disabled fill, as in Figma.
- **`pending`** comes free from comp0: it disables the button and sets `aria-busy` and `data-pending`, which is the start of the loading state in #4.
- **`type="button"` by default** (comp0 does this). A bare `<button>` inside a `<form>` submits it, which surprises people.
- **`as`** renders the button as another element, e.g. a router link, with the same styles and keyboard behaviour.
- **`data-variant` / `data-size`** attributes make the rendered DOM say which Figma variant it is. Handy in devtools, tests and screenshots.
- **Measured against Figma:** rendered in a browser, the buttons are 36px (default), 24px (sm), and 38/26px for outline. Those are exactly the Figma heights, including the outline's extra 2px from its border. If the outline should be 36px like the others, the fix is in Figma first (stroke *inside* instead of outside), then `border border-transparent` on the base classes in code.

## Headless library

A headless library gives you behaviour and accessibility (keyboard, focus management, ARIA) with no styles, so your Tailwind classes stay in charge of how things look.

**This design system is built on [comp0](https://github.com/mewhhaha/comp0)** (`@comp0/react`), a headless React 19 library. It fits the Figma → code rule unusually well:

- **State is presence attributes.** Every interactive part sets `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible` and `data-disabled` (plus `data-open`, `data-selected` and so on for composites). Those map one-to-one onto Figma's `state` variant, so *a Figma state is a `data-*` modifier* and the whole class list is static.
- **No CSS and no class names** of its own, and `className` is always a string (no render props), so styles stay readable Tailwind.
- **Native first.** Buttons are real `<button>`s, form controls submit through native form data, and `as` swaps the element (router links included).
- **Breadth.** Select, Combobox, Dialog, Menu, Tabs, DatePicker, charts and more, so every later component uses the same state vocabulary.

It's pre-1.0 (`0.1.0-next.*`), so the package pins an exact version and upgrades are deliberate.

Alternatives considered: React Aria Components (the same `data-*` state model, larger and more mature) and Base UI (shadcn-style APIs). Avoid mixing two headless libraries.

## Publishing

**npm, scoped as `@workers-comp/ui`, versioned with Changesets and published from GitHub Actions.**

- **Build: tsdown.** One step writes `dist/index.js`, the `.d.ts` files and `dist/styles.css`. Its CSS support (`@tsdown/css`) runs `src/tailwind.module.css` through PostCSS with `@tailwindcss/postcss`, then scopes the class names as CSS modules. React is a peer dependency, so the app's copy is used; Tailwind is not a dependency of consumers at all. The tests and the playground read the package's source through Vite (`@tailwindcss/vite` in the playground), so the same module is compiled by two toolchains; the pixel tests cover the playground's, and the built stylesheet was checked separately on a page with no Tailwind.
- **CSS: ship compiled CSS.** `@workers-comp/ui/styles.css` is plain CSS (about 7 kB) with scoped class names and the Figma token values inlined. Verified in Chromium with a scratch app that has no Tailwind: every variant, hover, disabled state and a plain-CSS `border-radius` override render as in Figma, and in the Tailwind playground `rounded-full` and `border-fuchsia-700` in `className` override the component.
- **Versioning: Changesets.** Each PR that changes the package adds a small markdown file saying what changed, for the people using it, and whether it's a patch, minor or major (`pnpm changeset`). `.github/workflows/release.yml` runs on every push to `main`: while there are changeset files, it keeps a "Version Packages" PR open that bumps the version and writes the CHANGELOG; merging *that* publishes. release-please was tried and dropped: it works the version out from commit titles, and here the release note is written on purpose instead.
- **Commits: Conventional Commits.** Commit messages and PR titles are `type(scope): summary` (`feat(ui): …`, `fix(ui): …`). PRs are squash-merged, so the PR title is the commit on `main`, and CI checks it. This is for a readable history; it doesn't drive versions.
- **Where:** public npm if this can be open source (free, works everywhere). If it must be private, GitHub Packages works with the same setup plus an `.npmrc` in consuming apps.

Two things only the repo owner can do before the first release works:

- **Let Actions open PRs.** In the repo's Settings → Actions → General, turn on "Allow GitHub Actions to create and approve pull requests", or the workflow can't open its "Version Packages" PR.
- **npm.** Claim the `@workers-comp` scope and add an npm access token that can publish to it as the `NPM_TOKEN` repository secret.

A PR opened by the workflow's own token doesn't trigger CI, so the "Version Packages" PR shows no checks; it only changes the version and the CHANGELOG.

## Testing and playgrounds

**The playground is a React Router 8 app of plain example pages (`apps/playground`)**, modelled on [Headless UI's playground](https://github.com/tailwindlabs/headlessui/tree/main/playgrounds/react). `pnpm playground` starts it.

Every file in `apps/playground/app/examples/` is a page at its own URL: `examples/button/form.tsx` is `/button/form`. `app/routes.ts` reads the folder, so adding a file adds a page, and the home page lists them grouped by component. There are no controls panels or story formats: each example is an ordinary React component showing the component in a realistic situation, so it doubles as copy-pasteable usage and as a page you can link a designer to.

The Button examples:
- **`/button/variants`**: the Figma component set as a page, every variant and size, enabled and disabled.
- **`/button/form`**: an invite form with a React Router `clientAction`, where the submit button shows `pending` while it sends.
- **`/button/as-link`**: `as={Link}` renders buttons as router links with the same styles and keyboard behaviour.

Like Headless UI's, it shows the keys you press in the corner, so keyboard behaviour is visible in demos and screen recordings.

It runs in SPA mode (`ssr: false`) and builds to static files in `build/client`, which is what the Cloudflare Worker serves. The app renders the ui package's *source* through a Vite alias, so editing `button.tsx` updates the page instantly with no rebuild.

**Checking against Figma: a model looks, then the values are measured** (`pnpm test:figma`).

- **Looking** is the skill's job, not the repo's: screenshot the Figma node and the rendered page, compare them, fix what differs.
- **Measuring** is `expectToMatchFigma` in `apps/playground/tests/figma.ts`. It compares what Figma says a node is drawn with (size, fill, border, radius, focus rings, and the label's colour, size, weight, line height and position) against the browser's computed styles in Chromium. For the Button, all 30 Figma variants are checked, in real hover, press and keyboard-focus states (`/button/figma` is the page it drives). The Figma side is `apps/playground/figma/button.json`, written by the figma-flow skill's `export-node`; it ends in a hash of its contents, which the tests check, so a bad copy fails loudly.

Why this shape: an earlier version diffed screenshots pixel by pixel (pngjs and pixelmatch). To compare the approaches, the Button was broken in eight specific ways (Inter 4 for 3.19, a disabled border two shades dark, a fill on the disabled ghost, 8px radius for 6, 14px padding for 16, weight 500 for 600, text one shade light, a 1px ring gap for 2) and each method was run on each, plus an unbroken control:

| | Pixel diff | Exact values | Model looking at screenshots |
|---|---|---|---|
| Bugs caught, of 8 | 6 (missed the ghost fill and the text shade; caught the radius on only 4 of 30 variants) | 8 | 7, plus the text shade at low confidence |
| Unbroken control | passed | passed | reported differences anyway |

The pixel diff was the weakest and the most machinery, so it is gone. The model did far better than expected at finding bugs, with enlarged, identically laid out images, but it never says "match": every report, the control's included, listed the sub-pixel width difference below and a few uncertain items. So it finds things, and the values decide.

**The skill and the mod: figma-flow**, in [johnpangalos/skills](https://github.com/johnpangalos/skills/tree/main/figma-flow). A Claude Code plugin that packages this flow: export Figma's values with the scripts it carries, build, measure, then have a fresh agent (`figma-flow:looker`) compare screenshots. Its mod writes a marked `use_figma` result straight to a file, so the model no longer retypes an export, and holds `git commit` and `git push` after design edits until a command containing `test:figma` passes (`/figma-flow release` lifts it). It once handed builds to feature-flow-lite's implementor and reviewer; that was removed after evals showed plain Sonnet and Opus passing every check alone, at a fraction of the cost. Install it with `npx skills add johnpangalos/skills@figma-flow -g`.

The looker was tried again as the plugin defines it, twice per case, on a smaller model (Sonnet):

| | Rated `likely` in both runs | Only `unsure`, or in one run |
|---|---|---|
| Planted bugs | disabled border, ghost fill, padding, ring gap, font version | radius and weight (only `unsure`), text shade (`likely` once) |
| Unbroken control | reported the sub-pixel width as `likely` both times | |

So the looker runs on the most capable model, every `unsure` finding becomes a measurement, and the sub-pixel width is never a reason to stop: the control is never "clean" to a model, which is why the measurement, enforced by the mod, is what ends the work.

Things the checks found in the real Button along the way:

- **Figma's Inter is 3.19; Google Fonts serves Inter 4**, whose letters are about 2% narrower, so the button was 1.5px narrower than in Figma. The playground now serves Inter 3.19 itself (the `inter-ui` package). An app that wants to match the designs has to do the same.
- **The disabled outline button kept its `gray-400` border**; Figma's is `gray-200`.
- **The disabled ghost button had a `gray-100` fill**; Figma has none.

Sizes can't match to the last fraction: Figma snaps text to whole pixels and browsers don't, so a button that hugs its label is 77.3px wide against Figma's 78. The comparison allows under a pixel of size, and 1 of 255 per colour channel for rounding. The ghost button's focus ring used to be a separate rectangle, which the export can't read as a ring; it is now the same spread shadows as the other variants, so it is measured too (see the lint, below).

**The export scripts live in the figma-flow skill**, in [johnpangalos/skills](https://github.com/johnpangalos/skills/tree/main/figma-flow). They were written here first, but they are the same for every repo and only run inside Figma through the MCP's `use_figma`, so only an agent ever runs them. This repo keeps its own data: the exported values and the specs that measure against them.

**The Figma file is linted before it is exported** (`apps/playground/figma/lint-node.js`). Figma decides, so a mistake in the file is copied into code faithfully, and the measurement then passes against it: a label that isn't linked to its property keeps its default text, which is exactly what the export records. The lint finds what code would have to guess at: fills, strokes, gaps, padding, radii and fixed sizes not bound to a variable, effects without a style, text whose type isn't a style or bound variables, text linked to its property in some variants and not others, and detached frames. It stops at instances, which their own component's lint covers. Its result is saved like an export, with a hash, and `tests/figma-lint.spec.ts` fails while an export has no lint, or its lint has a finding that isn't in `lint-ignore.json` with a reason; an accepted finding that Figma no longer has fails too, so the list can't go stale. The two kinds of check don't overlap: every bug the measurement found (the Inter version, the disabled border, the v3 colours) was on the code side, where Figma was right, and the lint's first run found three on the Figma side that the measurement passes: the focus Button's and pressed Chip's labels not linked to `Label`, and the Chip label's weight not bound. It also flagged the ghost Button's focus ring, a rectangle with typed-in sizes, which was why that ring was only covered by looking. Figma doesn't render spread shadows on a frame with no fill (tried with and without clip content and "show behind transparent areas"), so a fill-less component can have a ring that is drawn but not data, or data but not drawn. The Chip already had the second, and the ghost Button now does too: its ring is the same two bound shadows as the other variants, the export reads it, the measurement checks it, and both components' descriptions say the ring doesn't show on the canvas. The ring is the same on every component, so a designer loses little by not seeing it, and a ring that is data can't drift from code unnoticed.

**The export is a manual step, on purpose.** The tests compare against the saved export, not live Figma: whoever implements or updates a design exports it at that moment. Nothing watches Figma for later changes.

It runs in CI as the `figma` job, on macOS: Chromium on Linux lays text out a pixel or two differently, and 129 of the 167 checks failed there on widths that hug text, while all pass on macOS. An axe check per page is still worth adding.

**Token check: Vitest.** `packages/ui/src/figma-tokens.json` is a snapshot of the Figma variables, text styles and effect styles, and `packages/ui/src/theme.test.ts` checks each one resolves to a token in the Tailwind theme with the same value. The Variables REST API is Enterprise-only, so the snapshot is refreshed through the Figma MCP (the skill's `export-tokens`).

Its first run failed for 23 of the 46 colours, and that was a real difference, not a rounding one: Figma held Tailwind v3's hex values, and Tailwind v4's palette is more vivid (`fuchsia/700` was `#a21caf` in Figma and rendered as `#a800b7`). The Figma variables now hold v4's values, converted from OKLCH to sRGB.

**Behaviour tests: Vitest + Testing Library** (`pnpm test`). 10 tests cover the defaults, each variant's Figma classes, the focus ring, `className` overrides, keyboard activation and disabled behaviour. They run in jsdom, so they test behaviour, not pixels.

**CI** (`.github/workflows/ci.yml`) runs format and lint checks, typecheck, tests, builds (the package and the playground) and the Figma measurement on every PR.

**Previews on Cloudflare Workers.** The playground is a static-assets-only Worker named `workers-comp`, configured in the root `wrangler.jsonc`. The repo is connected to it with Cloudflare's **Workers Builds**, so Cloudflare itself builds every branch: pull requests get a preview link (`npx wrangler preview`) posted on the PR, and `main` deploys to production. The build lives in the config's `build.command` (install the workspace with pnpm, then build the playground to `apps/playground/build/client`), and wrangler finds the config from the repo root or from `apps/playground`, so the dashboard only needs deploy `npx wrangler deploy` and preview `npx wrangler preview`; the root directory and build command can be left empty. Nothing in the repo needs secrets for this.

## Review

Review follows the Claude Code team's process, described in [How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/), split by where each part is worth running in a one-person repo.

**Before the PR, locally: feature-flow-lite.** The post moves most review before the PR: verify the work, review it in fresh context, simplify, and hunt for bugs. feature-flow-lite does that with an investigator, an implementor, the checks, a simplifier and a red-team reviewer that writes and runs probes, and it runs on the owner's Claude plan. Running probes is what matters: on this PR, they found a file name with a newline in it passing the auto-merge path check as two names, and a failed request that still let auto-merge through. A review that only reads the code missed both.

**On the PR: only the merge decision.** The first version of this PR also ran a Claude bug review, a separate security review and an `@claude` fixer in CI, as the post does. A red-team pass on those workflows found that each gave Claude a way to change the repo: GraphQL mutations (merging included), the REST merge endpoint, pushes as `claude[bot]` that the reviews then refused. Each was fixable, but for one maintainer who already reviews locally, the CI reviews mostly repeated that work, at API prices. So CI keeps the one thing that has to happen on GitHub: `claude-risk.yml` rates a PR whose files are all on the low-risk list (docs, examples, a component's own tests) and merges it when Claude, on Haiku, answers `merge-approved`. The paths are checked first, so most PRs never call Claude. It runs on `workflow_run` after CI passes rather than on `pull_request`, because a `pull_request` run uses the PR's own copy of the workflow, so a PR could rewrite the check it is judged by; `workflow_run` always uses `main`'s. It merges the commit CI passed directly, instead of switching on auto-merge, so there is no state to turn off when a new commit is pushed. The Claude call runs in a job with a read-only token, apart from the job that merges.

The rating is one Messages API request: no agent, no tools and no GitHub App, since a classification needs none. The job exchanges its GitHub OIDC token for a Claude API token at `/v1/oauth/token` (workload identity federation, so no stored API key), sends the diff, the PR description and CLAUDE.md as the base commit has it, and asks for structured outputs (`output_config.format` with a JSON schema whose `decision` is `merge-approved` or `needs-human`), so the workflow reads a schema-checked field rather than parsing prose. An earlier version ran claude-code-action with read-only tools; its red-team pass found the action stored the Claude App's write token where Claude's Read tool could reach it, and the plain request removes that whole class of problem.

The three jobs' steps are TypeScript in `.github/scripts/claude-risk/` rather than shell in the workflow: Node 22 runs them as they are (its type stripping), they need no dependencies (`fetch` for the APIs, `git` for the diff), and they are tested with `node --test`, type-checked, linted and formatted with the rest of the repo by `pnpm check`. The workflow runs `main`'s copy of them, never the PR's. The rating also starts when the PR title check finishes, which runs on edits, so a filled-in description gets re-rated without a new commit. Merges made with the workflow's token don't start CI or the release on `main`; the low tier has nothing to release.

The first rule was a low-risk allowlist: only docs, example pages and tests merged by themselves. Checked against the repo's first 18 PRs, none would have: every one touched component code, dependencies, CI or the agent instructions. So the rule turned around: a PR merges unless it's breaking for the apps that use the package (by its changeset or title, or as Claude reads it), or it touches the safeguards themselves: CI and `.claude/`, the agent instructions, dependencies, check config, the measuring code, or existing Figma measurement. How a component looks doesn't count as breaking. The release stays manual: nothing reaches npm until the "Version Packages" PR is merged by a person. When a PR does need a person, a comment on it says why.

Left out, because they need more than one person or a history that doesn't exist yet: required human approvals (GitHub won't let the only maintainer approve their own PR), CODEOWNERS, a merge queue (only on organization-owned repos), feature flags and staged releases, and an eval set of past incidents for scoring the reviewer.

## Note on the Figma MCP

While building this, the Figma MCP hit the **Starter plan's tool-call limit** (earlier work in the project had used most of it). For an AI-first flow that reads Figma on every component, that limit will be felt quickly; it's another point alongside Code Connect (issue #2) in favour of a paid Figma seat when you get there.
