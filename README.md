# workers_comp

A Figma-driven, AI-first design system for React. Figma file: [Workers Comp Design System](https://www.figma.com/design/5OcRRw5a7qZGsgC43FjCp9).

Every Figma variable is a Tailwind v4 default token, and every Figma component property is the React prop of the same name, so a design reads straight into code.

## Packages

- [`packages/ui`](packages/ui) — `@workers-comp/ui`, the React components.
- [`apps/playground`](apps/playground) — a small Vite app for trying components out. One file per component in `apps/playground/src/entries/`.

## Use it in an app

```css
/* app.css */
@import "tailwindcss";
@import "@workers-comp/ui/theme.css";
```

```tsx
import { Button } from "@workers-comp/ui";

<Button variant="outline" size="sm">Cancel</Button>;
```

## Develop

```sh
pnpm install
pnpm playground  # http://localhost:5173 (Cloudflare also posts a preview link on every PR)
pnpm test        # Vitest + Testing Library
pnpm typecheck
pnpm build       # tsdown → packages/ui/dist
pnpm changeset   # describe a change for the next release
```

Why things are set up this way (headless libraries, publishing, playgrounds): [docs/tooling-decisions.md](docs/tooling-decisions.md).
