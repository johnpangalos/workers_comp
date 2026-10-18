import type { ComponentPropsWithoutRef, ElementType } from "react";
import { Link, type LinkProps } from "@comp0/react";
import { bindClassNames } from "../class-names";
import styles from "../tailwind.module.css";

/**
 * Mirrors the Figma "Badge" component set (Workers Comp Design System, page "Badge", node 36:112).
 * Prop names and values are the Figma property names and values, so `color=red` in Figma is
 * `<Badge color="red">` here.
 *
 * With no `href` or `as`, a Badge is a plain span. With either, it is a link from comp0's
 * headless Link, which reports `data-focus-visible` and `data-hovered` for the styles to select
 * on. The dot is a child span marked `data-slot="dot"` and hidden from assistive technology.
 */
export type BadgeColor = "gray" | "fuchsia" | "red" | "amber" | "green" | "teal" | "blue" | "violet" | "pink";

export type BadgeProps<TElement extends ElementType = "a"> = Omit<LinkProps<TElement>, "color"> & {
  color?: BadgeColor;
  /** The coloured dot before the label. On by default, as in Figma. */
  dot?: boolean;
};

// Names in the module resolve to their scoped class.
const cx = bindClassNames(styles);

/** The Badge's scoped classes, for styling another element the same way. */
export const badgeClassName = cx(`
  inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold
  no-underline outline-none
  data-[color=gray]:bg-gray-100 data-[color=gray]:text-gray-800
  data-[color=fuchsia]:bg-fuchsia-100 data-[color=fuchsia]:text-fuchsia-800
  data-[color=red]:bg-red-100 data-[color=red]:text-red-800
  data-[color=amber]:bg-amber-100 data-[color=amber]:text-amber-800
  data-[color=green]:bg-green-100 data-[color=green]:text-green-800
  data-[color=teal]:bg-teal-100 data-[color=teal]:text-teal-800
  data-[color=blue]:bg-blue-100 data-[color=blue]:text-blue-800
  data-[color=violet]:bg-violet-100 data-[color=violet]:text-violet-800
  data-[color=pink]:bg-pink-100 data-[color=pink]:text-pink-800
  data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2
`);

/** The dot's scoped classes: the colour of the badge it sits in. */
export const dotClassName = cx(`
  size-2 shrink-0 rounded-full
  data-[color=gray]:bg-gray-500 data-[color=fuchsia]:bg-fuchsia-500 data-[color=red]:bg-red-500
  data-[color=amber]:bg-amber-500 data-[color=green]:bg-green-500 data-[color=teal]:bg-teal-500
  data-[color=blue]:bg-blue-500 data-[color=violet]:bg-violet-500 data-[color=pink]:bg-pink-500
`);

/**
 * `className` is appended as is, after the Badge's own classes, so a consumer's Tailwind
 * utilities or plain CSS override them.
 */
export function Badge<TElement extends ElementType = "a">({
  as,
  href,
  className,
  color = "gray",
  dot = true,
  children,
  ...props
}: BadgeProps<TElement>) {
  const classes = className ? `${badgeClassName} ${className}` : badgeClassName;
  const dotElement = dot ? (
    <span aria-hidden="true" data-slot="dot" data-color={color} className={dotClassName} />
  ) : null;

  if (as === undefined && href === undefined) {
    // `disabled` only means something on a link; a span would carry it as a stray attribute.
    const { disabled: _disabled, ...spanProps } = props as ComponentPropsWithoutRef<"span"> & { disabled?: boolean };
    return (
      <span {...spanProps} data-color={color} className={classes}>
        {dotElement}
        {children}
      </span>
    );
  }

  return (
    <Link
      {...(props as LinkProps<TElement>)}
      as={as}
      href={href}
      data-color={color}
      className={classes}
    >
      {dotElement}
      {children}
    </Link>
  );
}
