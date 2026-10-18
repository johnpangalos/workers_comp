import type { ElementType } from "react";
import { mergeProps, usePress } from "@comp0/core";
import { Link, type LinkProps } from "@comp0/react";
import { bindClassNames } from "../class-names";
import styles from "../tailwind.module.css";

/**
 * Mirrors the Figma "Chip" component (Workers Comp Design System, page "Chip", node 39:15): a
 * tab-bar item for a section link, as in a day strip. An uppercase bold label sits over a dotted
 * underline, three 4px round dots centred under the label; there is no box. `muted` is Figma's
 * `muted=true`, the day you're out: the label is gray-500 and the dots gray-100. `current` is `current=true`, the section you're in: the dots are gray-900 and the
 * link carries `aria-current`.
 *
 * Pressed (Figma's `state=pressed`) merges the dots: they turn fuchsia, close the gap and widen
 * into one square-ended 24px dash, and part again on release. comp0's Link has no pressed state, so the
 * Chip takes `usePress` from `@comp0/core` and reports `data-pressed` for the styles to select on.
 *
 * Behaviour comes from comp0's headless Link, which reports `data-hovered` and
 * `data-focus-visible` for the styles to select on. Give it `href` or `as` to make it a link a
 * keyboard can reach. With neither, it still renders an anchor (never a crash), but with no
 * `href` it isn't in the tab order and Enter does nothing. `disabled` removes the `href`, takes
 * the Chip out of the tab order, stops clicks from firing `onClick` and never shows pressed.
 */
export type ChipProps<TElement extends ElementType = "a"> = LinkProps<TElement> & {
  /** The day you're out: the muted label and dot colours. Off by default, as in Figma. */
  muted?: boolean;
  /** The section you're in: gray-900 dots and `aria-current="true"`. Off by default. */
  current?: boolean;
};

// Names in the module resolve to their scoped class.
const cx = bindClassNames(styles);

/**
 * The Chip's scoped classes, for styling another element the same way. The dotted underline is
 * the Chip's child marked `data-slot="underline"`. Its colour is its text colour, set by its own
 * `data-tone` (current over muted over default); the dots take it as `currentColor`. The Chip's
 * hover and pressed states, which are on the link, reach the underline through the `*:` child
 * variant. That rule is more specific than any tone, so hover and press win whatever the tone,
 * without depending on the order of the stylesheet.
 */
export const chipClassName = cx(`
  m-0 appearance-none border-0 border-solid
  inline-flex flex-col gap-1.5 px-1 pt-1.5 rounded-none
  font-sans text-sm font-bold uppercase whitespace-nowrap text-gray-900 no-underline outline-none
  data-muted:text-gray-500
  data-hovered:*:data-[slot=underline]:text-fuchsia-700
  data-pressed:*:data-[slot=underline]:text-fuchsia-700
  data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2
`);

// The dotted underline: a 4px-high row as wide as the label, centring the dots. Its text colour is
// the dots' colour.
const underlineClassName = cx(`
  flex h-1 w-full shrink-0 justify-center text-gray-200 transition-colors
  data-[tone=muted]:text-gray-100 data-[tone=current]:text-gray-900
`);

// Three dots, 4px apart (20px across), centred in the underline whatever the label's width.
// Pressed (`data-pressed` on the row too), the gap closes and each dot widens to a square-ended
// 8px, so they merge into one 24px dash; the transition animates both ways.
const dotsClassName = cx(`
  flex gap-1 transition-all
  data-pressed:gap-0 data-pressed:*:w-2 data-pressed:*:rounded-none
`);

const dotClassName = cx(`block size-1 shrink-0 rounded-full bg-current transition-all`);

/**
 * `className` is appended as is, after the Chip's own classes, so a consumer's Tailwind
 * utilities or plain CSS override them.
 */
export function Chip<TElement extends ElementType = "a">({
  className,
  muted = false,
  current = false,
  disabled,
  "aria-current": ariaCurrent,
  children,
  ...props
}: ChipProps<TElement>) {
  const { pressProps, isPressed } = usePress({ disabled: Boolean(disabled) });
  // The Chip is always a link (comp0's Link gives it role="link", whatever `as` renders), and a
  // link activates on Enter only, so Space doesn't press it.
  const onKeyDown: typeof pressProps.onKeyDown = (event) => {
    if (event.key === " ") return;
    pressProps.onKeyDown?.(event);
  };
  return (
    <Link
      // A consumer's handlers run first; the press handlers chain after them.
      {...(mergeProps(props, { ...pressProps, onKeyDown }) as LinkProps<TElement>)}
      disabled={disabled}
      // Presence attributes: `data-muted` / `data-current` / `data-pressed` when true, nothing otherwise.
      data-muted={muted ? "" : undefined}
      data-current={current ? "" : undefined}
      data-pressed={isPressed ? "" : undefined}
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
      >
        <span data-slot="dots" data-pressed={isPressed ? "" : undefined} className={dotsClassName}>
          {/* Three dots, as Figma draws; the underline is aria-hidden, so so are they. */}
          {Array.from({ length: 3 }, (_, index) => (
            <span key={index} data-slot="dot" className={dotClassName} />
          ))}
        </span>
      </span>
    </Link>
  );
}
