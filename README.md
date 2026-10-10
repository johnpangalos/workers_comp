# workers_comp

A Figma-driven, AI-first design system for React. Figma file: [Workers Comp Design System](https://www.figma.com/design/5OcRRw5a7qZGsgC43FjCp9).

Every Figma variable is a Tailwind v4 default token, and every Figma component property is the React prop of the same name, so a design reads straight into code. Tailwind is only used to build the package: it ships plain CSS, so apps don't need Tailwind to use it.

## Packages

- [`packages/ui`](packages/ui) — `@workers-comp/ui`, the React components.
- [`apps/playground`](apps/playground) — a React Router 8 app of example pages. Every file in `apps/playground/app/examples/` is a page.

## Use it in an app

```tsx
import { Button } from "@workers-comp/ui";
import "@workers-comp/ui/styles.css"; // once, at the app's entry

<Button variant="outline" size="sm">Cancel</Button>;
```

The components' styles live in `@layer components`, so anything you pass in `className` wins: Tailwind utilities (`className="rounded-full"`) or your own CSS classes, no `!important`.

## Develop

```sh
pnpm install
pnpm playground  # http://localhost:5173 (Cloudflare also posts a preview link on every PR)
pnpm test        # Vitest + Testing Library
pnpm test:figma  # Playwright: rendered pages against Figma exports
pnpm typecheck
pnpm build       # Vite + tsc → packages/ui/dist (index.js, styles.css, types)
pnpm changeset   # describe a change for the next release
```

Why things are set up this way (headless libraries, publishing, playgrounds): [docs/tooling-decisions.md](docs/tooling-decisions.md).
