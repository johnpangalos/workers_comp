---
"@workers-comp/ui": minor
---

Add `Chip`, matching the Figma component: an uppercase tab-bar item with a dotted underline, three round dots centred under the label. `muted` marks a day you're out and `current` marks the section you're in (`aria-current`); give it `href` or `as` to make it a link with a keyboard focus ring, and `className` overrides it. Pressing it merges the dots into one fuchsia dash, which splits back into dots on release.
