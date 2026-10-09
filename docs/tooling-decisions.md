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

- **Variants are data attributes.** `variant` and `size` render as `data-variant` / `data-size`, and the class list styles them with Tailwind's `data-[variant=outline]:…` variants. The class list is one constant string, so there's no variant table and no class-merging helper. Reading the classes top to bottom reads like the Figma variant grid.
- **`className` is for layout only** (`w-full`, `mt-4`). It's appended, and it can't restyle a variant because `data-[…]:` selectors are more specific than plain utilities. A new look means a new variant, in Figma first.
- **Disabled is stacked: `data-[variant]:data-disabled:bg-gray-100`.** A bare `data-disabled:` is exactly as specific as `data-[variant=default]:` and Tailwind emits it first, so a disabled primary button stayed fuchsia. Requiring both attributes makes it more specific, so it wins without `!`. Checked in Chromium: every variant, size, hover, press, keyboard focus ring (and no ring on mouse focus) and disabled state computes to the Figma values.
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

**The playground is a small custom Vite app (`apps/playground`), not Storybook.** `pnpm playground` starts it.

Each component gets one file in `apps/playground/src/entries/`, and the app picks it up automatically. The file says which props are editable and how to lay out the variant grid:

```tsx
export default definePlayground({
  name: "Button",
  figma: "https://www.figma.com/design/5OcRRw5a7qZGsgC43FjCp9?node-id=1-91",
  component: Button,
  controls: {
    variant: { type: "select", options: ["default", "outline", "ghost"], default: "default" },
    size: { type: "select", options: ["default", "sm"], default: "default" },
    disabled: { type: "boolean", default: false },
    children: { type: "text", default: "Button" },
  },
  matrix: { rows: ["variant", "size"], columns: [{ label: "default", props: {} }, { label: "disabled", props: { disabled: true } }] },
});
```

The `controls` are the Figma component properties, so writing an entry is a direct copy of the Figma property panel. Each component page shows:

- **Playground:** a live preview with a control for each prop.
- **Code:** the JSX for the current settings, leaving out defaults, with a copy button. This is what you'd paste into an app or hand to an AI.
- **All variants:** the same variant × size grid as the Figma frame.
- **Accessibility:** axe-core checks the preview and the grid on every change and lists violations with links to the fix.
- **Open in Figma:** a link to the component set.

The app renders the ui package's *source* through a Vite alias, so editing `button.tsx` updates the playground instantly with no rebuild. It's about 300 lines of code you own, with no addon ecosystem to keep up with.

What Storybook would have added that this doesn't have yet: an embedded Figma panel, autogenerated prop tables, and Chromatic visual regression. The last one matters most, and doesn't need Storybook: **Playwright screenshot tests against the playground's grid** (`toHaveScreenshot()`) give the same "the button got 2px taller" safety net. That's the next thing I'd add.

**Behaviour tests: Vitest + Testing Library** (`pnpm test`). 10 tests cover the defaults, each variant's Figma classes, the focus ring, `className` overrides, keyboard activation and disabled behaviour. They run in jsdom, so they test behaviour, not pixels.

**CI** (`.github/workflows/ci.yml`) runs typecheck, tests and builds (the package and the playground) on every PR.

**Previews on Cloudflare Workers.** The playground is a static-assets-only Worker (`apps/playground/wrangler.jsonc`, named `workers-comp`). The repo is connected to it with Cloudflare's **Workers Builds**, so Cloudflare itself builds every branch: pull requests get a preview link (`npx wrangler preview`) posted on the PR, and `main` deploys to production. Build settings live in the Cloudflare dashboard: root directory `apps/playground`, build command `pnpm install --frozen-lockfile && pnpm build`, build variable `SKIP_DEPENDENCY_INSTALL=1` (Cloudflare would otherwise try npm, which can't install the pnpm workspace), deploy `npx wrangler deploy`, preview `npx wrangler preview`. Nothing in the repo needs secrets for this.

## Note on the Figma MCP

While building this, the Figma MCP hit the **Starter plan's tool-call limit** (earlier work in the project had used most of it). For an AI-first flow that reads Figma on every component, that limit will be felt quickly; it's another point alongside Code Connect (issue #2) in favour of a paid Figma seat when you get there.
