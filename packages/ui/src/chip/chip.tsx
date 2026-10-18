import type { ElementType } from "react";
import { Link, type LinkProps } from "@comp0/react";
import { bindClassNames } from "../class-names";
import styles from "../tailwind.module.css";

/**
 * Mirrors the Figma "Chip" component (Workers Comp Design System, page "Chip", node 39:15): the
 * pill that links to a section, as in a day strip. `muted` is Figma's `muted=true`, the day
 * you're out: the label is drawn in gray-500 instead of gray-900.
 *
 * Behaviour comes from comp0's headless Link, which reports `data-hovered` and
 * `data-focus-visible` for the styles to select on. Give it `href` or `as` to make it a link a
 * keyboard can reach. With neither, it still renders an anchor (never a crash), but with no
 * `href` it isn't in the tab order and Enter does nothing. `disabled` removes the `href`, takes
 * the Chip out of the tab order and stops clicks from firing `onClick`.
 */
export type ChipProps<TElement extends ElementType = "a"> = LinkProps<TElement> & {
  /** The day you're out: the muted label colour. Off by default, as in Figma. */
  muted?: boolean;
};

// Names in the module resolve to their scoped class.
const cx = bindClassNames(styles);

/** The Chip's scoped classes, for styling another element the same way. */
export const chipClassName = cx(`
  m-0 appearance-none border-solid
  inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5
  font-sans text-sm font-semibold whitespace-nowrap text-gray-900 no-underline outline-none
  data-muted:text-gray-500
  data-hovered:border-fuchsia-700
  data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2
`);

/**
 * `className` is appended as is, after the Chip's own classes, so a consumer's Tailwind
 * utilities or plain CSS override them.
 */
export function Chip<TElement extends ElementType = "a">({
  className,
  muted = false,
  children,
  ...props
}: ChipProps<TElement>) {
  return (
    <Link
      {...(props as LinkProps<TElement>)}
      // A presence attribute: `data-muted` when muted, nothing at all otherwise.
      data-muted={muted ? "" : undefined}
      className={className ? `${chipClassName} ${className}` : chipClassName}
    >
      {children}
    </Link>
  );
}
