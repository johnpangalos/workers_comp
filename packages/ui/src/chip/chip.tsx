import type { ElementType } from "react";
import { Link, type LinkProps } from "@comp0/react";
import { bindClassNames } from "../class-names";
import styles from "../tailwind.module.css";

/**
 * Mirrors the Figma "Chip" component (Workers Comp Design System, page "Chip", node 39:15): a
 * tab-bar item for a section link, as in a day strip. An uppercase bold label sits over a 4px
 * underline; there is no box. `muted` is Figma's `muted=true`, the day you're out: the label is
 * gray-500 and the underline gray-100. `current` is `current=true`, the section you're in: the
 * underline is gray-900 and the link carries `aria-current`.
 *
 * Behaviour comes from comp0's headless Link, which reports `data-hovered` and
 * `data-focus-visible` for the styles to select on. Give it `href` or `as` to make it a link a
 * keyboard can reach. With neither, it still renders an anchor (never a crash), but with no
 * `href` it isn't in the tab order and Enter does nothing. `disabled` removes the `href`, takes
 * the Chip out of the tab order and stops clicks from firing `onClick`.
 */
export type ChipProps<TElement extends ElementType = "a"> = LinkProps<TElement> & {
  /** The day you're out: the muted label and underline colours. Off by default, as in Figma. */
  muted?: boolean;
  /** The section you're in: a gray-900 underline and `aria-current="true"`. Off by default. */
  current?: boolean;
};

// Names in the module resolve to their scoped class.
const cx = bindClassNames(styles);

/**
 * The Chip's scoped classes, for styling another element the same way. The underline is the
 * Chip's child marked `data-slot="underline"`. Its colour is set by its own `data-tone`
 * (current over muted over default), and the Chip's hover, which is on the link, reaches it
 * through the `*:` child variant. That rule is more specific than any tone, so hover wins
 * whatever the tone, without depending on the order of the stylesheet.
 */
export const chipClassName = cx(`
  m-0 appearance-none border-0 border-solid
  inline-flex flex-col gap-1.5 pt-1.5 rounded-none
  font-sans text-sm font-bold uppercase whitespace-nowrap text-gray-900 no-underline outline-none
  data-muted:text-gray-500
  data-hovered:*:data-[slot=underline]:bg-fuchsia-700
  data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2
`);

const underlineClassName = cx(`
  block h-1 w-full shrink-0 bg-gray-200 transition-colors
  data-[tone=muted]:bg-gray-100 data-[tone=current]:bg-gray-900
`);

/**
 * `className` is appended as is, after the Chip's own classes, so a consumer's Tailwind
 * utilities or plain CSS override them.
 */
export function Chip<TElement extends ElementType = "a">({
  className,
  muted = false,
  current = false,
  "aria-current": ariaCurrent,
  children,
  ...props
}: ChipProps<TElement>) {
  return (
    <Link
      {...(props as LinkProps<TElement>)}
      // Presence attributes: `data-muted` / `data-current` when true, nothing at all otherwise.
      data-muted={muted ? "" : undefined}
      data-current={current ? "" : undefined}
      // A consumer's own aria-current (e.g. "location") wins over the one `current` sets.
      aria-current={ariaCurrent ?? (current ? "true" : undefined)}
      className={className ? `${chipClassName} ${className}` : chipClassName}
    >
      {children}
      <span
        aria-hidden="true"
        data-slot="underline"
        data-tone={current ? "current" : muted ? "muted" : undefined}
        className={underlineClassName}
      />
    </Link>
  );
}
