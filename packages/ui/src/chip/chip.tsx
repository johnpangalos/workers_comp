import type { ElementType } from "react";
import { mergeProps, usePress } from "@comp0/core";
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
 * Pressed (Figma's `state=pressed`) is a fuchsia fill that slides up from the bottom behind the
 * chip, with a white label and a fuchsia underline. comp0's Link has no pressed state, so the
 * Chip takes `usePress` from `@comp0/core` and reports `data-pressed` for the styles to select on.
 *
 * Behaviour comes from comp0's headless Link, which reports `data-hovered` and
 * `data-focus-visible` for the styles to select on. Give it `href` or `as` to make it a link a
 * keyboard can reach. With neither, it still renders an anchor (never a crash), but with no
 * `href` it isn't in the tab order and Enter does nothing. `disabled` removes the `href`, takes
 * the Chip out of the tab order, stops clicks from firing `onClick` and never shows pressed.
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
 * (current over muted over default), and the Chip's hover and pressed states, which are on the
 * link, reach it through the `*:` child variant. That rule is more specific than any tone, so
 * hover and press win whatever the tone, without depending on the order of the stylesheet.
 *
 * The pressed label is white over the muted label too: `data-pressed:data-muted:` is the
 * two-attribute selector that beats `data-muted:text-gray-500` whatever order the CSS loads in.
 */
export const chipClassName = cx(`
  m-0 appearance-none border-0 border-solid
  relative isolate overflow-hidden
  inline-flex flex-col gap-1.5 px-1 pt-1.5 rounded-none
  font-sans text-sm font-bold uppercase whitespace-nowrap text-gray-900 no-underline outline-none
  data-muted:text-gray-500
  data-pressed:text-white data-pressed:data-muted:text-white
  data-hovered:*:data-[slot=underline]:bg-fuchsia-700
  data-pressed:*:data-[slot=underline]:bg-fuchsia-700
  data-pressed:*:data-[slot=fill]:translate-y-0
  data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2
`);

const underlineClassName = cx(`
  block h-1 w-full shrink-0 bg-gray-200 transition-colors
  data-[tone=muted]:bg-gray-100 data-[tone=current]:bg-gray-900
`);

// The fill slab sits below the chip, clipped by its overflow, until the chip is pressed.
const fillClassName = cx(`
  absolute inset-0 -z-10 bg-fuchsia-700 translate-y-full transition-transform
`);

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
      <span aria-hidden="true" data-slot="fill" className={fillClassName} />
      <span
        aria-hidden="true"
        data-slot="underline"
        data-tone={current ? "current" : muted ? "muted" : undefined}
        className={underlineClassName}
      />
    </Link>
  );
}
