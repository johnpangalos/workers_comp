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
- **Disabled is stacked: `data-[variant]:data-disabled:bg-gray-100`.** That compiles to `[data-variant][data-disabled]`, which beats the plain variant colours on specificity, and `pointer-events: none` keeps hover and press from ever applying to a disabled button.
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

- **Build: tsdown.** One step writes `dist/index.js`, the `.d.ts` files and `dist/styles.css`. Its CSS support (`@tsdown/css`) runs `src/tailwind.module.css` through PostCSS with `@tailwindcss/postcss`, then scopes the class names as CSS modules. React is a peer dependency, so the app's copy is used; Tailwind is not a dependency of consumers at all. The tests and the playground read the package's source through Vite (`@tailwindcss/vite` in the playground), so the same module is compiled by two toolchains; the pixel tests cover the playground's, and the built stylesheet was checked separately on a page with no Tailwind.
- **CSS: ship compiled CSS.** `@workers-comp/ui/styles.css` is plain CSS (about 7 kB) with scoped class names and the Figma token values inlined. Verified in Chromium with a scratch app that has no Tailwind: every variant, hover, disabled state and a plain-CSS `border-radius` override render as in Figma, and in the Tailwind playground `rounded-full` and `border-fuchsia-700` in `className` override the component.
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

**The playground is a React Router 8 app of plain example pages (`apps/playground`)**, modelled on [Headless UI's playground](https://github.com/tailwindlabs/headlessui/tree/main/playgrounds/react). `pnpm playground` starts it.

Every file in `apps/playground/app/examples/` is a page at its own URL: `examples/button/form.tsx` is `/button/form`. `app/routes.ts` reads the folder, so adding a file adds a page, and the home page lists them grouped by component. There are no controls panels or story formats: each example is an ordinary React component showing the component in a realistic situation, so it doubles as copy-pasteable usage and as a page you can link a designer to.

The Button examples:
- **`/button/variants`**: the Figma component set as a page, every variant and size, enabled and disabled.
- **`/button/form`**: an invite form with a React Router `clientAction`, where the submit button shows `pending` while it sends.
- **`/button/as-link`**: `as={Link}` renders buttons as router links with the same styles and keyboard behaviour.

Like Headless UI's, it shows the keys you press in the corner, so keyboard behaviour is visible in demos and screen recordings.

It runs in SPA mode (`ssr: false`) and builds to static files in `build/client`, which is what the Cloudflare Worker serves. The app renders the ui package's *source* through a Vite alias, so editing `button.tsx` updates the page instantly with no rebuild.

**Pixel tests against Figma: Playwright** (`pnpm test:figma`). `apps/playground/figma/` holds 1x exports from Figma and the position of each node in them; `apps/playground/tests/figma.ts` renders a playground page in Chromium, checks the element is within a pixel of the Figma node's size, and diffs the pixels. For the Button, all 30 Figma variants are compared (`/button/figma` is the page it drives, with real hover, press and keyboard focus). Two things it found on its first run:

- **Figma's Inter is 3.19; Google Fonts serves Inter 4**, whose letters are about 2% narrower, so the button was 1.5px narrower than in Figma. The playground now serves Inter 3.19 itself (the `inter-ui` package). An app that wants to match the designs has to do the same.
- **The disabled outline button kept its `gray-400` border**; Figma's is `gray-200`.

Sizes can't match to the last fraction: Figma snaps text to whole pixels and browsers don't, so a button that hugs its label is 77.3px wide against Figma's 78. The comparison allows under a pixel of size and 4% of pixels (glyph edges); the wrong border colour above was 4.6%.

These don't run in CI yet (it needs a Chromium install step and a check that Linux text rendering stays inside the allowance). An axe check per page is still worth adding.

**Token check: Vitest.** `figma/tokens.json` is a snapshot of the Figma variables, text styles and effect styles, and `packages/ui/src/theme.test.ts` checks each one resolves to a token in the Tailwind theme with the same value. The Variables REST API is Enterprise-only, so the snapshot is refreshed through the Figma MCP (`figma/export-tokens.js`).

Its first run failed for 23 of the 46 colours, and that was a real difference, not a rounding one: Figma held Tailwind v3's hex values, and Tailwind v4's palette is more vivid (`fuchsia/700` was `#a21caf` in Figma and rendered as `#a800b7`). The Figma variables now hold v4's values, converted from OKLCH to sRGB.

**Behaviour tests: Vitest + Testing Library** (`pnpm test`). 10 tests cover the defaults, each variant's Figma classes, the focus ring, `className` overrides, keyboard activation and disabled behaviour. They run in jsdom, so they test behaviour, not pixels.

**CI** (`.github/workflows/ci.yml`) runs typecheck, tests and builds (the package and the playground) on every PR.

**Previews on Cloudflare Workers.** The playground is a static-assets-only Worker named `workers-comp`, configured in the root `wrangler.jsonc`. The repo is connected to it with Cloudflare's **Workers Builds**, so Cloudflare itself builds every branch: pull requests get a preview link (`npx wrangler preview`) posted on the PR, and `main` deploys to production. The build lives in the config's `build.command` (install the workspace with pnpm, then build the playground to `apps/playground/build/client`), and wrangler finds the config from the repo root or from `apps/playground`, so the dashboard only needs deploy `npx wrangler deploy` and preview `npx wrangler preview`; the root directory and build command can be left empty. Nothing in the repo needs secrets for this.

## Note on the Figma MCP

While building this, the Figma MCP hit the **Starter plan's tool-call limit** (earlier work in the project had used most of it). For an AI-first flow that reads Figma on every component, that limit will be felt quickly; it's another point alongside Code Connect (issue #2) in favour of a paid Figma seat when you get there.
