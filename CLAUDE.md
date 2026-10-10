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
pnpm test:figma   # Playwright: rendered pages against Figma exports, pixel by pixel
pnpm build
pnpm playground   # http://localhost:5173
```

## Where things live

- `packages/ui/src/<component>/` — the React components (`@workers-comp/ui`), one folder each.
- `packages/ui/src/theme.css` — the Tailwind theme the components compile against.
- `apps/playground/app/examples/<component>/<page>.tsx` — every file is a page at
  `/<component>/<page>`.
- `figma/tokens.json` — a snapshot of the Figma file's variables, text styles and effect
  styles. Refresh it by running `figma/export-tokens.js` through the Figma MCP's `use_figma`.
- `apps/playground/figma/` — Figma exports (PNG at 1x, plus node positions) that the pixel
  tests in `apps/playground/tests/` compare against.

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

A component or page isn't done until a pixel test passes for it:

1. Export the Figma node with the MCP's `get_screenshot` (`contentsOnly: true`, and
   `maxDimension` set to the node's longer side, so it is 1x) into `apps/playground/figma/`,
   with a JSON file of the node positions next to it, like `button.json`.
2. Add a playground page that renders it, and a spec in `apps/playground/tests/` that calls
   `expectToMatchFigma` (see `button.figma.spec.ts`).
3. Run `pnpm test:figma`. On a failure, open `apps/playground/playwright-report` and look at
   the Figma, rendered and diff images, then fix the code. Raise the allowed difference only
   for a reason you can name.
