---
"@workers-comp/ui": minor
---

Add `TextArea`, matching the Figma component: a labelled multi-line input with an optional `description` and an `errorMessage` that shows, and is announced, while `invalid`. It is at least 96px tall, as in Figma, and `rows={4}` or more makes it taller; every other prop (`placeholder`, `name`, `value`, `onChange`, `disabled`, …) goes to the native textarea, and `className` overrides the field.
