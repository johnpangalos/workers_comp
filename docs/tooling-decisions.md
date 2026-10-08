# Tooling decisions

How the Button got from Figma to code, and the three choices that shape every component after it.

## The Button

`packages/ui/src/button/button.tsx` is the Figma component set translated one-to-one:

| Figma | Code |
|---|---|
| `variant` = default, outline, ghost | `variant` prop, same values |
| `size` = default, sm | `size` prop, same values |
| `state` = hover, active, focus, disabled | `hover:`, `active:`, `focus-visible:`, `disabled:` modifiers (no prop) |
| `Label` | `children` |

- **`cva` (class-variance-authority)** holds the variant → class table. It reads like the Figma variant grid, which makes it easy for a person or an AI to diff the two.
- **`cn` = `clsx` + `tailwind-merge`**, so `<Button className="px-8">` replaces `px-4` rather than both classes fighting in the cascade.
- **`type="button"` by default.** A bare `<button>` inside a `<form>` submits it, which surprises people.
- **`data-variant` / `data-size`** attributes make the rendered DOM say which Figma variant it is. Handy in devtools, tests and screenshots.
- **Measured against Figma:** in Storybook the buttons render 36px (default), 24px (sm), and 38/26px for outline. Those are exactly the Figma heights, including the outline's extra 2px from its border. If the outline should be 36px like the others, the fix is in Figma first (stroke *inside* instead of outside), then `border border-transparent` on the base classes in code.

## Headless library

A headless library gives you behaviour and accessibility (keyboard, focus management, ARIA) with no styles, so your Tailwind classes stay in charge of how things look.

**Button doesn't need one.** A native `<button>` already does keyboard, focus and disabled correctly, so it has zero runtime dependencies beyond the class helpers.

**Recommendation: React Aria Components, adopted when the first complex component arrives** (Select, Combobox, Dialog, Menu, Tabs, DatePicker).

| | React Aria Components | Base UI | Radix Primitives |
|---|---|---|---|
| Accessibility depth | Best in class (Adobe; tested across screen readers, touch, i18n) | Very good | Good |
| State styling | `data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled` on every component | `data-*` attributes | `data-state` attributes |
| Breadth | Largest (date/time pickers, grids, drag & drop) | Growing | Mature, but development has slowed |
| Tailwind fit | Official plugin: `data-pressed:` etc. | Good | Good |

Why React Aria for this project: its state attributes map one-to-one onto Figma's `state` variant (hover, pressed, focus-visible, disabled), and it normalises "pressed" across mouse, touch and keyboard, which plain CSS `:active` doesn't. That keeps the Figma → code rule simple: *a Figma state is a `data-*` modifier.*

Runner-up: **Base UI** (from the Radix and MUI teams). Pick it instead if you'd rather have shadcn-style APIs, since a lot of AI training data follows shadcn/Radix conventions. Avoid mixing two headless libraries.

When it lands, Button can move onto React Aria's `<Button>` with the same props and classes (`active:` becomes `pressed:`), so nothing here is wasted.

## Publishing

**Recommendation: npm, scoped as `@workers-comp/ui`, versioned with Changesets and published from GitHub Actions.**

- **Build: `tsdown`** (the successor to tsup, built on Rolldown). One ESM bundle plus `.d.ts` types. React and Tailwind are peer dependencies, so the app's copies are used.
- **CSS: ship class strings, not compiled CSS.** The package exports `theme.css`, which sets the font and contains `@source "../dist"`. That line tells the app's Tailwind to scan the package, so only the classes actually used end up in the app's stylesheet, deduplicated with the app's own. Verified with a scratch app: importing `theme.css` produced `bg-fuchsia-700`, `focus-visible:ring-fuchsia-600` and the `Inter` font stack.
- **Versioning: Changesets.** Each PR adds a small markdown file saying what changed and whether it's a patch, minor or major (`pnpm changeset`). This PR includes one. On merge, a bot opens a "Version packages" PR that bumps the version and writes the CHANGELOG; merging *that* publishes.
- **Where:** public npm if this can be open source (free, works everywhere). If it must be private, GitHub Packages works with the same setup plus an `.npmrc` in consuming apps.

Not set up yet, deliberately: the release workflow. It needs an `NPM_TOKEN` secret (or npm trusted publishing) and the `@workers-comp` scope claimed on npm, both of which only you can do. When ready, add `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: write
  id-token: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm, registry-url: "https://registry.npmjs.org" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Testing and playgrounds

**Recommendation: Storybook as the playground and the place visual checks live; Vitest + Testing Library for behaviour.**

- **Storybook 10** (`pnpm storybook`). `Playground` story has controls for variant, size, label and disabled. `Matrix` lays out the same variant × size × state grid as the Figma frame, so you can put them side by side. Addons:
  - **Designs** embeds the Figma frame in a panel next to the story. Design and code in one view.
  - **Accessibility (axe)** checks every story, set to fail on violations.
  - **Docs** generates a props table from the TypeScript types.
- **Vitest + Testing Library** (`pnpm test`): 10 tests covering the defaults, each variant's Figma classes, the focus ring, `className` overrides, keyboard activation and disabled behaviour. These run in jsdom, so they test behaviour, not pixels.
- **CI** (`.github/workflows/ci.yml`) runs typecheck, tests, the build and a Storybook build on every PR.

Next steps, in order of value:
1. **Visual regression with Chromatic** (made by the Storybook team; free tier). Every story is screenshotted on each PR and diffs need approval. That's the safety net that catches "the button turned 2px taller" when an AI edits a component.
2. **Storybook's Vitest addon** to run stories as browser tests (real Chromium), including the axe checks, so stories and tests aren't maintained twice.
3. **Publish Storybook** (Chromatic hosts it, or GitHub Pages) so designers can review the live components without running anything.

Alternatives considered: **Ladle** (faster, Storybook-compatible stories, far fewer addons) and **Histoire** (Vue-first). Storybook wins on the Figma embed, a11y, Chromatic, and because AI tools know its story format well.

## Note on the Figma MCP

While building this, the Figma MCP hit the **Starter plan's tool-call limit** (earlier work in the project had used most of it). For an AI-first flow that reads Figma on every component, that limit will be felt quickly; it's another point alongside Code Connect (issue #2) in favour of a paid Figma seat when you get there.
