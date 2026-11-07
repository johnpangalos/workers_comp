# Feature Flow: workers_comp

<!-- The project file for feature-flow-lite and figma-flow. Edit it like a CLAUDE.md: anything
here holds for every run in this repo. Keep it short; a line nobody would act on is noise. -->

## Kind

Library: a React 19 component library (`@workers-comp/ui`, TypeScript, Tailwind v4 compiled to
plain CSS) with a React Router 8 playground, in a pnpm workspace. Figma-driven.

## Checks

- Full: `pnpm format:check`
- Full: `pnpm lint`
- Full: `pnpm typecheck`
- Full: `pnpm test`
- Full: `pnpm build`
- Full: `pnpm test:figma` (CI runs it on macOS: on Linux, Chromium lays text out differently)
- Targeted: `pnpm --filter @workers-comp/ui exec vitest run src/<component>/<component>.test.tsx`
- Targeted, for anything that started from Figma: `pnpm test:figma <component>` (no `--`; it
  passes the filter through literally)
- Run it: `pnpm playground`, then http://localhost:5173/<component>/<page>

## Conventions

- New component: `packages/ui/src/<component>/<component>.tsx` and `.test.tsx`, an export in
  `packages/ui/src/index.ts`, example pages in `apps/playground/app/examples/<component>/`, a
  row in CLAUDE.md's components table, and a changeset in `.changeset/` (`minor`).
- Change to what a component ships: a changeset (`patch` for a fix), and its Figma test still
  passing.
- This file, and CLAUDE.md beyond its components table, change only in their own `docs:` PR:
  they always wait for a person, so a convention learned while building goes in a follow-up PR
  and the code PR merges by itself.
- Commit messages and PR titles are Conventional Commits; CI checks PR titles.
- The PR description follows `.github/pull_request_template.md`; its "For review and decision
  agents" disclosure gets the run's acceptance criteria, each check's result line, the
  reviewer's findings (fixed and open) and what wasn't covered, from the report.

## Standing criteria

- The existing test suite still passes.
- Figma decides: no approximated values, and a design that looks wrong is reported, not fixed
  in code.
- Tailwind theme utilities only, no arbitrary values. Component classes are inline, passed
  through `cx(…)` bound to `tailwind.module.css`, selecting on `data-*` attributes.
- Behaviour comes from comp0 (`@comp0/react`); no second headless library.
- A consumer's `className` is appended as is and overrides the component.

## Reviewer checklist

- The change follows the patterns around it; anything `button.tsx` does that the new code
  should and doesn't is a finding.
- Keyboard: reachable with Tab, activated with Enter and Space, a visible focus ring only for
  keyboard focus, nothing fires when disabled. A link (Badge, Chip) activates with Enter only,
  as native links do; Space is for buttons.
- Every node in the Figma export is covered by the measurement; every state the design draws
  is reached the way a person reaches it; nothing in the diff loosens the comparison or edits
  an export or lint file by hand. A new entry in `lint-ignore.json` has a reason that holds up.
- `CHANGELOG.md` and versions are untouched: Changesets owns them.

## Risky paths

- `.github/workflows/` and `.github/scripts/`: they run with write tokens and spend API credit;
  probe the scripts end to end against a fake GitHub and Claude API (`GITHUB_API_URL`,
  `ANTHROPIC_BASE_URL`), as well as their unit tests.
- `.claude/hooks/`: they run on every edit on the owner's machine.

## Figma

- Source: [Workers Comp Design System](https://www.figma.com/design/5OcRRw5a7qZGsgC43FjCp9),
  file key `5OcRRw5a7qZGsgC43FjCp9`. One page per component.
- Mapping: CLAUDE.md, "Turning Figma into code". Tokens are checked against the theme by
  `packages/ui/src/theme.test.ts` from the snapshot in `packages/ui/src/figma-tokens.json`.
- Lint, before the export: `apps/playground/figma/lint-node.js`, run through `use_figma`, saved
  to `apps/playground/figma/<name>-lint.json`. A finding is fixed in Figma or accepted with a
  reason in `apps/playground/figma/lint-ignore.json`, never worked around in code; CLAUDE.md
  step 1 has the details. `pnpm test:figma` checks it.
- Export: the figma-flow skill carries the scripts. Its `export-node <node id> [<node id>…]`
  result is saved to `apps/playground/figma/<name>.json`; several ids go in one file, and a
  node that lays out children also gets its gap, padding and an entry per child. Its
  `export-tokens` refreshes `packages/ui/src/figma-tokens.json`.
- Motion: export-node doesn't read prototype transitions. A component that animates gets a
  Smart Animate reaction in Figma, exported with `apps/playground/figma/export-motion.js` (run
  through `use_figma`) to `apps/playground/figma/<name>-motion.json`, and a spec that checks the
  CSS transition's duration and curve against it (`chip.motion.spec.ts`). Pick a curve Tailwind
  has (`ease-in-out` is cubic-bezier(0.4, 0, 0.2, 1)), so the code stays on theme utilities.
- Measure: `pnpm test:figma`, specs in `apps/playground/tests/` calling `expectToMatchFigma`.
- Page: `apps/playground/app/examples/<component>/figma.tsx`, served at
  `/<component>/figma` by `pnpm playground`.
- Can't be measured: a focus ring Figma draws as a separate rectangle (the ghost Button's),
  and positions across text-hugging siblings, whose fractions of a pixel add up, so a
  container's width is compared only when it holds one of them.
  Widths that hug text are allowed under 1px of difference.
- Measured exactly, though they look like exceptions: a label's x is where its text starts (after
  a leading dot or icon, not the padding), and radii are clamped to half the box on both sides,
  so `rounded-full` matches Figma's `radius/full` (9999).
- A border that is always on keeps Button's reset minus `border-0`, which would
  zero it; `border-0` is only for a border that some variants add.
- New colours: add the whole Tailwind scale to Figma's Colors collection (v4 values, OKLCH
  converted to sRGB) and refresh `figma-tokens.json`; never a single shade.
