---
"@workers-comp/ui": major
---

`Button` follows the redesigned Figma Button: variants `filled` (default), `tonal`, `outlined`, `text` and `accent`, sizes `xs`, `sm`, `md` (default), `lg` and `xl`, pill-shaped at rest (a radius of half its height) with a squarer corner that springs in while pressed (no motion under `prefers-reduced-motion`), and a focus ring drawn as a CSS outline. To migrate, rename `variant="default"` to `"filled"`, `"outline"` to `"outlined"` (now fuchsia, not gray) and `"ghost"` to `"text"`, and `size="default"` to `"md"`; both sizes you have get taller (`md` is 56px where `default` was 36px, `sm` 40px where it was 24px; `xs` is 32px), and the old values no longer type-check.
