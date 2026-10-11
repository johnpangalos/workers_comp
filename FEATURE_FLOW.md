# Feature Flow: workers_comp

<!-- The project file for feature-flow-lite and figma-flow. Edit it like a CLAUDE.md: anything
here holds for every run in this repo. Keep it short; a line nobody would act on is noise. -->

## Kind

Library: a React 19 component library (`@workers-comp/ui`, TypeScript, Tailwind v4 compiled to
plain CSS) with a React Router 8 playground, in a pnpm workspace. Figma-driven.

## Checks

- Full: `pnpm typecheck`
- Full: `pnpm test`
- Full: `pnpm build`
- Full: `pnpm test:figma` (not in CI yet; needs Playwright's Chromium)
- Targeted: `pnpm --filter @workers-comp/ui exec vitest run src/<component>/<component>.test.tsx`
- Targeted, for anything that started from Figma: `pnpm test:figma`
- Run it: `pnpm playground`, then http://localhost:5173/<component>/<page>

## Conventions

- New component: `packages/ui/src/<component>/<component>.tsx` and `.test.tsx`, an export in
  `packages/ui/src/index.ts`, example pages in `apps/playground/app/examples/<component>/`, a
  row in CLAUDE.md's components table, and a changeset in `.changeset/` (`minor`).
- Change to what a component ships: a changeset (`patch` for a fix), and its Figma test still
  passing.
- Commit messages and PR titles are Conventional Commits; CI checks PR titles.

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
  keyboard focus, nothing fires when disabled.
- Every node in the Figma export is covered by the measurement; every state the design draws
  is reached the way a person reaches it; nothing in the diff loosens the comparison or edits
  an export by hand.
- `CHANGELOG.md` and versions are untouched: Changesets owns them.

## Risky paths

none

## Figma

- Source: [Workers Comp Design System](https://www.figma.com/design/5OcRRw5a7qZGsgC43FjCp9),
  file key `5OcRRw5a7qZGsgC43FjCp9`. One page per component.
- Mapping: CLAUDE.md, "Turning Figma into code". Tokens are checked against the theme by
  `packages/ui/src/theme.test.ts` from the snapshot in `figma/tokens.json`.
- Export: `node figma/print.ts export-node <node id> [<node id>…]` prints the script for
  `use_figma`; save the result to `apps/playground/figma/<name>.json`. Several ids go in one
  file; a node that lays out children also gets its gap, padding and an entry per child. `export-tokens` refreshes
  `figma/tokens.json` the same way.
- Measure: `pnpm test:figma`, specs in `apps/playground/tests/` calling `expectToMatchFigma`.
- Page: `apps/playground/app/examples/<component>/figma.tsx`, served at
  `/<component>/figma` by `pnpm playground`.
- Can't be measured: a focus ring Figma draws as a separate rectangle (the ghost Button's),
  and positions across text-hugging siblings, whose fractions of a pixel add up, so a
  container's width is compared only when it holds one of them.
  Widths that hug text are allowed under 1px of difference.
