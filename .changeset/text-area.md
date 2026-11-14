---
"@workers-comp/ui": minor
---

Add `TextArea`, matching the Figma component: a labelled multi-line input with an optional `description` and an `errorMessage` that shows, and is announced, while `invalid`. It is at least four rows tall (`rows` makes it taller); every other prop (`placeholder`, `name`, `value`, `onChange`, `disabled`, …) goes to the native textarea, and `className` overrides the field.
