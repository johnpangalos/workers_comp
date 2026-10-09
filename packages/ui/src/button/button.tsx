import type { ElementType } from "react";
import { Button as Comp0Button, type ButtonProps as Comp0ButtonProps } from "@comp0/react";

/**
 * Mirrors the Figma "Button" component set (Workers Comp Design System, page "Button").
 * Prop names and values are the Figma property names and values, so
 * `variant=outline, size=sm` in Figma is `<Button variant="outline" size="sm">` here.
 *
 * Behaviour comes from comp0's headless Button. It reports Figma's `state` property as
 * presence attributes (`data-hovered`, `data-pressed`, `data-focus-visible`,
 * `data-disabled`), and `variant` / `size` render as `data-variant` / `data-size`.
 * Every style is a Tailwind data variant on those attributes, so the class list never changes.
 */
export type ButtonVariant = "default" | "outline" | "ghost";
export type ButtonSize = "default" | "sm";

export const buttonClassName = [
  // base
  "inline-flex items-center justify-center rounded-md font-semibold transition-colors outline-none",
  "data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2",

  // variant=default
  "data-[variant=default]:bg-fuchsia-700 data-[variant=default]:text-white",
  "data-[variant=default]:data-hovered:bg-fuchsia-800 data-[variant=default]:data-pressed:bg-fuchsia-900",

  // variant=outline
  "data-[variant=outline]:border data-[variant=outline]:border-gray-400",
  "data-[variant=outline]:bg-white data-[variant=outline]:text-gray-900",
  "data-[variant=outline]:data-hovered:bg-gray-50 data-[variant=outline]:data-pressed:bg-gray-100",

  // variant=ghost
  "data-[variant=ghost]:text-fuchsia-700",
  "data-[variant=ghost]:data-hovered:bg-fuchsia-50 data-[variant=ghost]:data-pressed:bg-fuchsia-100",

  // size
  "data-[size=default]:px-4 data-[size=default]:py-2 data-[size=default]:text-sm",
  "data-[size=sm]:px-3 data-[size=sm]:py-1 data-[size=sm]:text-xs",

  // state=disabled. Stacked on data-[variant] so it is more specific than the
  // variant colours (two attributes beat one) and wins whatever order Tailwind emits.
  "data-disabled:pointer-events-none",
  "data-[variant]:data-disabled:bg-gray-100 data-[variant]:data-disabled:text-gray-400",
].join(" ");

export type ButtonProps<TElement extends ElementType = "button"> = Comp0ButtonProps<TElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * `className` is appended, for layout (`w-full`, `mt-4`). It can't restyle the
 * variant: `data-[…]:` selectors are more specific than plain utilities, so a new
 * look means a new variant, in Figma first.
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
      className={className ? `${buttonClassName} ${className}` : buttonClassName}
    />
  );
}
