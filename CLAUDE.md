# workers_comp

A Figma-driven design system for React. The Figma file is the source of truth:
[Workers Comp Design System](https://www.figma.com/design/5OcRRw5a7qZGsgC43FjCp9) (file key
`5OcRRw5a7qZGsgC43FjCp9`). Read it with the Figma MCP. Background on the setup is in
[docs/tooling-decisions.md](docs/tooling-decisions.md).

## Commands

Use pnpm.

```sh
pnpm format       # oxfmt; `pnpm format:check` is what CI runs
pnpm lint         # oxlint: no ternaries (use `if`, `&&`/`??`, or comp0's `dataAttr`), no arbitrary
                  # Tailwind values, sorted classes; `pnpm lint --fix` fixes the order
pnpm typecheck
pnpm test         # Vitest: component behaviour, and Figma tokens against the theme
pnpm test:figma   # Playwright: rendered values (colours, sizes, type) against Figma's, exactly
pnpm build
pnpm playground   # http://localhost:5173/<component>/<page>
```

All of these but `playground` run in CI. While working, run only what covers the change:
`pnpm --filter @workers-comp/ui exec vitest run src/<component>/<component>.test.tsx`, and
`pnpm test:figma <component>` (no `--`; it passes the filter through). A hook formats and
lints each file Claude edits (`.claude/hooks/format-and-lint.sh`).

A new component is `packages/ui/src/<component>/<component>.tsx` and `.test.tsx`, an export
in `packages/ui/src/index.ts`, example pages in `apps/playground/app/examples/<component>/`
(with a `figma.tsx` its spec measures), a row in the components table below, and a
`minor` changeset.

## Commits and releases

Commit messages and PR titles follow [Conventional Commits](https://www.conventionalcommits.org):
`type(scope): summary`, e.g. `feat(ui): add the Input component`, `fix(ui): …`,
`docs: …`, `test(playground): …`, `chore: …`; `feat!:` for a breaking change. PRs are
squash-merged, so the PR title is the commit on `main`, and CI checks it.

Versions come from Changesets, not from commit titles. A PR that changes what
`@workers-comp/ui` ships adds a file in `.changeset/` (`pnpm changeset`, or write it by hand
like the existing ones): `patch` for a fix, `minor` for something new, `major` for a breaking
change, and one or two sentences for the people using the package. Never edit `CHANGELOG.md`
or the version by hand.

## Review

Before opening or updating a PR, run the `pre-pr` skill: the checks with their output, then
`/simplify`, `/code-review` and `/security-review`. Fill in the PR template's Testing, Risk
and How to revert. In CI every PR gets a Claude review and a separate security review, and
every finding has to be fixed or resolved with a reason before it merges; `@claude` in a PR
comment asks Claude to fix them. Low-risk PRs (docs, examples, tests) merge by themselves once
both reviews are clean; REVIEW.md has the tiers. What the review looks for, and how to set it up, is in
[REVIEW.md](REVIEW.md).

## Where things live

- `packages/ui/src/<component>/` — the React components (`@workers-comp/ui`), one folder each.
- `packages/ui/src/theme.css` — the Tailwind theme the components compile against.
- `apps/playground/app/examples/<component>/<page>.tsx` — every file is a page at
  `/<component>/<page>`.
- `packages/ui/src/figma-tokens.json` — a snapshot of the Figma file's variables, text styles
  and effect styles, which `theme.test.ts` checks against the theme.
- `apps/playground/figma/` — what Figma says each node is drawn with (size, colours, type),
  which the tests in `apps/playground/tests/` compare the rendered page against.

## Turning Figma into code

Figma decides. Don't approximate a value, and don't "fix" a design in code: if Figma looks
wrong, say so and leave the code matching Figma.

| In Figma | In code |
|---|---|
| Variable | The Tailwind utility for its WEB code syntax: `var(--color-fuchsia-700)` is `bg-fuchsia-700` / `text-fuchsia-700`, `calc(var(--spacing) * 4)` is `p-4` / `gap-4`, `var(--radius-md)` is `rounded-md`. Go by the code syntax, not the name (`spacing/0_5` is `0.5`). |
| Text style `text-sm/semibold` | `text-sm font-semibold` |
| Effect style `shadow-md` | `shadow-md` |
| Auto layout | Flexbox: direction, `gap-*`, `p-*`, alignment; hug is the default, fill is `flex-1` or `w-full`. |
| Component | The component of the same name from `@workers-comp/ui`. Never rebuild its markup. |
| Component property `variant=outline` | The prop of the same name and value: `variant="outline"`. |
| `state` variant (hover, active, focus, disabled) | Not a prop. comp0's `data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled`. |
| Text property (`Label`) | `children` |

Components so far:

| Figma component | Node | Code |
|---|---|---|
| Button | `1:91` | `Button` from `@workers-comp/ui` (`packages/ui/src/button/button.tsx`) |
| Badge | `36:112` | `Badge` from `@workers-comp/ui` (`packages/ui/src/badge/badge.tsx`) |
| Chip | `39:15` | `Chip` from `@workers-comp/ui` (`packages/ui/src/chip/chip.tsx`) |

Rules:

- Tailwind theme utilities only, no arbitrary values (`w-[137px]`, `text-[#a21caf]`). A value
  with no variable in Figma is a question for the designer, not a magic number.
- A Figma variable that isn't a Tailwind default goes in `packages/ui/src/theme.css` under
  the same name. `pnpm test` fails until it does.
- Component classes are inline Tailwind passed through `cx(…)` (bound to
  `tailwind.module.css`), selecting on `data-*` attributes. Copy how `button.tsx` does it.
  A consumer's `className` is appended as is and overrides the component.
- Behaviour comes from comp0 (`@comp0/react`). Don't add another headless library.
- The font is Inter 3.19, the version Figma uses. Don't switch to Google Fonts' Inter.

## Checking the result against Figma

The [figma-flow](https://github.com/johnpangalos/skills/tree/main/figma-flow) skill runs this
flow when it is installed, following this section and the one above. What follows is also
what to do by hand without it.

A component or page isn't done until its measurement passes. Measure to finish; look to find
what the measurement can't read.

1. **Export.** Export the node's values, fresh, every time you implement or change a design:
   use the figma-flow skill's `export-node <node id> [<node id>…]` and save its output exactly
   as returned to `apps/playground/figma/<name>.json` (it ends in a hash the tests check).
   Several ids go in one file, and a node that lays out children also gets its gap, padding
   and an entry per child.
2. **Build**, following the mapping above.
3. **Measure.** Add a playground page, `apps/playground/app/examples/<component>/figma.tsx`
   (served at `/<component>/figma`), that renders the design, and a spec in
   `apps/playground/tests/` that calls `expectToMatchFigma` for each node; see
   `button.figma.spec.ts`. The page doesn't have to look like the Figma file. Run
   `pnpm test:figma` and fix the code until it passes. Never loosen the comparison.
4. **Look**, for what the export can't describe: a ring Figma draws as a separate shape,
   shadows with blur, spacing between text-hugging siblings. Compare a screenshot of the
   Figma node (the MCP's `get_screenshot`) with one of the rendered page in the same states.
   "I see no difference" is not a pass: in a trial a model looking at screenshots reported
   differences on a correct Button, so only the measurement can say something matches.

The export scripts live in the figma-flow skill, not in this repo, because they only run
inside Figma through the MCP's `use_figma`. The skill says how to run them; its `export-tokens`
refreshes `packages/ui/src/figma-tokens.json`.

What the measurement does and doesn't cover:

- **Motion.** `export-node` doesn't read prototype transitions. A component that animates gets
  a Smart Animate reaction in Figma, exported with `apps/playground/figma/export-motion.js`
  (run through `use_figma`) to `apps/playground/figma/<name>-motion.json`, and a spec that
  checks the CSS transition's duration and curve against it (`chip.motion.spec.ts`). Pick a
  curve Tailwind has (`ease-in-out` is cubic-bezier(0.4, 0, 0.2, 1)), so the code stays on
  theme utilities.
- **Can't be measured:** a focus ring Figma draws as a separate rectangle (the ghost
  Button's), and positions across text-hugging siblings, whose fractions of a pixel add up,
  so a container's width is compared only when it holds one of them. Widths that hug text are
  allowed under 1px of difference.
- **Measured exactly, though they look like exceptions:** a label's x is where its text
  starts (after a leading dot or icon, not the padding), and radii are clamped to half the
  box on both sides, so `rounded-full` matches Figma's `radius/full` (9999).
- **Borders.** A border that is always on keeps Button's reset minus `border-0`, which would
  zero it; `border-0` is only for a border that some variants add.
- **New colours:** add the whole Tailwind scale to Figma's Colors collection (v4 values, OKLCH
  converted to sRGB) and refresh `figma-tokens.json`; never a single shade.
