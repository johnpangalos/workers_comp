---
"@workers-comp/ui": patch
---

Components draw the same in apps without Tailwind: each one resets the browser's own defaults on its outermost element and everything inside it, so the ghost `Button` no longer shows the browser's grey background. Content you put inside a component, such as a `TabPanel`'s, starts from the same reset, though native checkboxes, radios and selects keep their browser look, and your own CSS still overrides it.
