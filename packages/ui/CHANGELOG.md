# @workers-comp/ui

## 1.0.0

### Major Changes

- d847e61: `buttonClassName`, `badgeClassName`, `chipClassName`, `tabsClassName`, `tabListClassName`, `tabClassName` and `tabPanelClassName` are no longer exported. To style another element like a component, render the component itself (`Button`, `Badge` and `Chip` take `as` or `href`), or use your own classes; the components look and behave as before.

### Minor Changes

- 6feb9f1: Add `Badge` (color: gray | fuchsia | red | amber | green | teal | blue | violet | pink, with an optional dot), matching the Figma component. Give it `href` or `as` to make it a link with a keyboard focus ring; `className` overrides it.
- db28eac: Add `Button` (variant: default | outline | ghost, size: default | sm), matching the Figma component. Styles ship as plain CSS: import `@workers-comp/ui/styles.css` once, no Tailwind needed, and override anything with `className`.
- 581a44c: Add `Chip`, matching the Figma component: a pill for a section link, a medium label on a filled, fully rounded container. `muted` marks a day you're out and `current` marks the section you're in (`aria-current`); give it `href` or `as` to make it a link with a keyboard focus ring, and `className` overrides it. Hovering and pressing it each darken the fill a step.
- fcc2a2e: Add `Tabs`, `TabList`, `Tab` and `TabPanel`, matching the Figma component: a tab list with a panel per tab, following the WAI-ARIA tabs pattern (arrow keys, Home and End, disabled tabs skipped). Control the selected tab with `value` and `onValueChange`, or start it with `defaultValue`; `className` overrides any of the four.
- d953300: Add `TextArea`, matching the Figma component: a labelled multi-line input with an optional `description` and an `errorMessage` that shows, and is announced, while `invalid`. It is at least 96px tall, as in Figma, and `rows={4}` or more makes it taller; every other prop (`placeholder`, `name`, `value`, `onChange`, `disabled`, …) goes to the native textarea, and `className` overrides the field.
- 6b13603: Add `TextField`, matching the Figma component: a labelled single-line input with an optional `description` and an `errorMessage` shown while `invalid`, its label, description and error wired to the input for screen readers. Use it controlled with `value` and `onChange` (called with the new value) or uncontrolled with `defaultValue`; `disabled`, `required` and the input's own props (`name`, `type`, `placeholder`, `autoComplete`, `ref`…) go to the input, and `className` overrides the field's width.

### Patch Changes

- 4734452: `styles.css` now declares `--default-border-width: 1px` with the other theme variables, matching the Figma variable the outline `Button`'s border is bound to. Borders look the same; nothing else changes.
