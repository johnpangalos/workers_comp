import type { ElementType } from "react";
import classNames from "classnames/bind";
import styles from "./button.module.css";
import { Button as Comp0Button, type ButtonProps as Comp0ButtonProps } from "@comp0/react";

/**
 * Mirrors the Figma "Button" component set (Workers Comp Design System, page "Button").
 * Prop names and values are the Figma property names and values, so
 * `variant=outline, size=sm` in Figma is `<Button variant="outline" size="sm">` here.
 *
 * Behaviour comes from comp0's headless Button. It reports Figma's `state` property as
 * presence attributes (`data-hovered`, `data-pressed`, `data-focus-visible`,
 * `data-disabled`), and `variant` / `size` render as `data-variant` / `data-size`.
 * The styles in button.module.css select on those attributes, so the element only ever
 * carries one scoped class.
 */
export type ButtonVariant = "default" | "outline" | "ghost";
export type ButtonSize = "default" | "sm";

// Names that are in the CSS module resolve to their scoped class; anything else
// (a consumer's Tailwind utilities or own classes) passes through unchanged.
const cx = classNames.bind(styles);

/** The Button's scoped class, for styling another element the same way. */
export const buttonClassName = cx("button");

export type ButtonProps<TElement extends ElementType = "button"> = Comp0ButtonProps<TElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * `className` is appended. The Button's own styles sit in `@layer components`, so a
 * consumer's Tailwind utilities or plain CSS override them (`className="rounded-full"`).
 */
export function Button<TElement extends ElementType = "button">({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps<TElement>) {
  return (
    <Comp0Button
      {...(props as Comp0ButtonProps<TElement>)}
      data-variant={variant}
      data-size={size}
      className={cx("button", className)}
    />
  );
}
