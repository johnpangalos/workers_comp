import type { ElementType } from "react";
import { dataAttr, mergeProps, usePress } from "@comp0/core";
import { Link, type LinkProps } from "@comp0/react";
import { bindClassNames } from "../class-names";
import styles from "../tailwind.module.css";

/**
 * Mirrors the Figma "Chip" component (Workers Comp Design System, page "Chip", node 39:15): a pill
 * for a section link, as in a day strip. A medium label sits on a filled, fully rounded container.
 * `muted` is Figma's `muted=true`, the day you're out: a gray-50 fill and a gray-500 label.
 * `current` is `current=true`, the section you're in: a fuchsia-700 fill, a white label, and
 * `aria-current` on the link. Both together are a fuchsia-100 fill and a fuchsia-900 label.
 *
 * Hover and pressed (Figma's `state=hover` and `state=pressed`) each darken the fill a step.
 * comp0's Link has no pressed state, so the Chip takes `usePress` from `@comp0/core` and reports
 * `data-pressed` for the styles to select on.
 *
 * Behaviour comes from comp0's headless Link, which reports `data-hovered` and
 * `data-focus-visible` for the styles to select on. Give it `href` or `as` to make it a link a
 * keyboard can reach. With neither, it still renders an anchor (never a crash), but with no
 * `href` it isn't in the tab order and Enter does nothing. `disabled` removes the `href`, takes
 * the Chip out of the tab order, stops clicks from firing `onClick` and never shows pressed.
 */
export type ChipProps<TElement extends ElementType = "a"> = LinkProps<TElement> & {
  /** The day you're out: the muted fill and label colours. Off by default, as in Figma. */
  muted?: boolean;
  /** The section you're in: the fuchsia fill and `aria-current="true"`. Off by default. */
  current?: boolean;
};

// Names in the module resolve to their scoped class.
const cx = bindClassNames(styles);

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
  // The colours' tone: Figma's four combinations of muted and current.
  let tone = "default";
  if (muted) tone = "muted";
  if (current) tone = "current";
  if (muted && current) tone = "muted-current";
  return (
    <Link
      // A consumer's handlers run first; the press handlers chain after them.
      {...(mergeProps(props, { ...pressProps, onKeyDown }) as LinkProps<TElement>)}
      disabled={disabled}
      // Presence attributes: `data-muted` / `data-current` / `data-pressed` when true, nothing otherwise.
      data-muted={dataAttr(muted)}
      data-current={dataAttr(current)}
      data-pressed={dataAttr(isPressed)}
      data-tone={tone}
      // A consumer's own aria-current (e.g. "location") wins over the one `current` sets.
      aria-current={ariaCurrent ?? ((current && "true") || undefined)}
      // The colours select on `data-tone`, which is always one of four values, and on the state
      // within it: pressed, or hovered and not pressed. So no two rules that set the same property
      // match at once, except a tone and its own state, where the state's rule is the more
      // specific. Nothing depends on the order of the stylesheet. The fill changes over Figma's
      // Smart Animate from default to pressed: 150ms on the cubic-bezier(0.4, 0, 0.2, 1) curve,
      // Tailwind's ease-in-out.
      className={[
        cx(`
          m-0 inline-flex appearance-none items-center justify-center rounded-full border-0 border-solid px-3
          py-1 font-sans text-sm font-medium whitespace-nowrap no-underline transition-colors duration-150
          ease-in-out outline-none
          data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2
          data-[tone=current]:bg-fuchsia-700 data-[tone=current]:text-white
          data-[tone=current]:not-data-pressed:data-hovered:bg-fuchsia-800
          data-[tone=current]:data-pressed:bg-fuchsia-900
          data-[tone=default]:bg-gray-100 data-[tone=default]:text-gray-900
          data-[tone=default]:not-data-pressed:data-hovered:bg-gray-200
          data-[tone=default]:data-pressed:bg-gray-300
          data-[tone=muted]:bg-gray-50 data-[tone=muted]:text-gray-500
          data-[tone=muted]:not-data-pressed:data-hovered:bg-gray-100
          data-[tone=muted]:data-pressed:bg-gray-200
          data-[tone=muted-current]:bg-fuchsia-100 data-[tone=muted-current]:text-fuchsia-900
          data-[tone=muted-current]:not-data-pressed:data-hovered:bg-fuchsia-200
          data-[tone=muted-current]:data-pressed:bg-fuchsia-300
        `),
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Link>
  );
}
