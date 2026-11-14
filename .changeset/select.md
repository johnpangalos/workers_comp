---
"@workers-comp/ui": minor
---

Add `Select` and `SelectOption`, matching the Figma components: a labelled single select whose trigger shows the chosen option (or a `placeholder`) and opens a listbox, with an optional `description`, and an `errorMessage` that replaces it while `invalid`. Give the options as `items` or as `SelectOption` children; it works with the keyboard (Tab, Enter or Space, the arrow keys, type-ahead, Escape), submits its value under `name` in a form, and `className` overrides it.
