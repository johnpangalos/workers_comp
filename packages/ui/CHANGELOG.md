# @workers-comp/ui

## 0.1.0

### Minor Changes

- 6feb9f1: Add `Badge` (color: gray | fuchsia | red | amber | green | teal | blue | violet | pink, with an optional dot), matching the Figma component. Give it `href` or `as` to make it a link with a keyboard focus ring; `className` overrides it.
- db28eac: Add `Button` (variant: default | outline | ghost, size: default | sm), matching the Figma component. Styles ship as plain CSS: import `@workers-comp/ui/styles.css` once, no Tailwind needed, and override anything with `className`.
