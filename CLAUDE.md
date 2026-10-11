# workers_comp

A Figma-driven design system for React. The Figma file is the source of truth:
[Workers Comp Design System](https://www.figma.com/design/5OcRRw5a7qZGsgC43FjCp9) (file key
`5OcRRw5a7qZGsgC43FjCp9`). Read it with the Figma MCP. Background on the setup is in
[docs/tooling-decisions.md](docs/tooling-decisions.md).

## Commands

Use pnpm.

```sh
pnpm typecheck
pnpm test         # Vitest: component behaviour, and Figma tokens against the theme
pnpm test:figma   # Playwright: rendered values (colours, sizes, type) against Figma's, exactly
pnpm build
pnpm playground   # http://localhost:5173
```

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

## Where things live

- `packages/ui/src/<component>/` — the React components (`@workers-comp/ui`), one folder each.
- `packages/ui/src/theme.css` — the Tailwind theme the components compile against.
- `apps/playground/app/examples/<component>/<page>.tsx` — every file is a page at
  `/<component>/<page>`.
- `figma/tokens.json` — a snapshot of the Figma file's variables, text styles and effect
  styles. Refresh it with `figma/export-tokens.ts` (see below for how the scripts run).
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

Rules:

- Tailwind theme utilities only, no arbitrary values (`w-[137px]`, `text-[#a21caf]`). A value
  with no variable in Figma is a question for the designer, not a magic number.
- A Figma variable that isn't a Tailwind default goes in `packages/ui/src/theme.css` under
  the same name. `pnpm test` fails until it does.
- Component classes are inline Tailwind passed through `cx(…)` (bound to
  `tailwind.module.css`), selecting on `data-*` attributes. Copy how `button.tsx` does it.
- Behaviour comes from comp0 (`@comp0/react`). Don't add another headless library.
- The font is Inter 3.19, the version Figma uses. Don't switch to Google Fonts' Inter.

## Checking the result against Figma

The [figma-flow](https://github.com/johnpangalos/skills/tree/main/figma-flow) skill runs this
flow when it is installed; what follows is what it expects of this repo, and what to do by
hand without it.

Two checks, and a component or page isn't done until both are clean. Look first, then measure:
looking finds what is wrong and where; measuring is the only one that can say "nothing is".

1. **Look.** Take a screenshot of the Figma node (the MCP's `get_screenshot`) and one of the
   rendered page in the same states, enlarge both, and compare them side by side: layout,
   anything missing, radius, weight, spacing, rings. Fix what you find. Don't treat "I see
   no difference" as a pass: in a trial a model looking at screenshots found 7 of 8 planted
   bugs but also reported differences on a correct Button, and it hedged on a text colour
   one shade off.
2. **Measure.** Export the node's values, fresh, every time you implement or change a design:
   run `figma/export-node.ts` and save its output exactly as returned to
   `apps/playground/figma/<name>.json` (it ends in a hash the tests check). Add a playground
   page that renders the design and a spec in `apps/playground/tests/` that calls
   `expectToMatchFigma` for each node; see `button.figma.spec.ts`. Then run `pnpm test:figma`
   and fix the code until it passes. Never loosen the comparison to make it pass.

The scripts in `figma/` are TypeScript, typed against Figma's plugin API, but they run inside
Figma, not in Node. `node figma/print.ts export-node 1:91` prints the plain JavaScript to pass
to the MCP's `use_figma`.
