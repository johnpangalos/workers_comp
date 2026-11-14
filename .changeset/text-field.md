---
"@workers-comp/ui": minor
---

Add `TextField`, matching the Figma component: a labelled single-line input with an optional `description` and an `errorMessage` shown while `invalid`, its label, description and error wired to the input for screen readers. Use it controlled with `value` and `onChange` (called with the new value) or uncontrolled with `defaultValue`; `disabled`, `required` and the input's own props (`name`, `type`, `placeholder`, `autoComplete`, `ref`…) go to the input, and `className` overrides the field's width.
