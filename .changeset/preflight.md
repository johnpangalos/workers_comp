---
"@workers-comp/ui": patch
---

Components draw the same in apps without Tailwind: each one's outermost element now resets the browser's defaults for itself and everything inside it. Before, the ghost Button showed the browser's grey button background, and anything a component didn't style picked up the browser's own styles. Anything you put inside a component (a `TabPanel`'s content, a `Button`'s children) also starts from these reset defaults, as it would under Tailwind's preflight; your own CSS still overrides them.
