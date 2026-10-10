import type { ElementType } from "react";
import { bindClassNames } from "../class-names";
import styles from "../tailwind.module.css";
import { Button as Comp0Button, type ButtonProps as Comp0ButtonProps } from "@comp0/react";

/**
 * Mirrors the Figma "Button" component set (Workers Comp Design System, page "Button").
 * Prop names and values are the Figma property names and values, so
 * `variant=outline, size=sm` in Figma is `<Button variant="outline" size="sm">` here.
 *
 * Behaviour comes from comp0's headless Button. It reports Figma's `state` property as
 * presence attributes (`data-hovered`, `data-pressed`, `data-focus-visible`,
 * `data-disabled`), and `variant` / `size` render as `data-variant` / `data-size`.
 * The classes below select on those attributes. Each one is a scoped class in
 * tailwind.module.css, so the package ships plain CSS.
 */
export type ButtonVariant = "default" | "outline" | "ghost";
export type ButtonSize = "default" | "sm";

// Names in the module resolve to their scoped class.
const cx = bindClassNames(styles);

/** The Button's scoped classes, for styling another element the same way. */
export const buttonClassName = cx(`
  m-0 appearance-none border-0 border-solid
  inline-flex items-center justify-center rounded-md font-sans font-semibold transition-colors outline-none
  data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2
  data-[variant=default]:bg-fuchsia-700 data-[variant=default]:text-white
  data-[variant=default]:data-hovered:bg-fuchsia-800 data-[variant=default]:data-pressed:bg-fuchsia-900
  data-[variant=outline]:border data-[variant=outline]:border-gray-400
  data-[variant=outline]:bg-white data-[variant=outline]:text-gray-900
  data-[variant=outline]:data-hovered:bg-gray-50 data-[variant=outline]:data-pressed:bg-gray-100
  data-[variant=ghost]:text-fuchsia-700
  data-[variant=ghost]:data-hovered:bg-fuchsia-50 data-[variant=ghost]:data-pressed:bg-fuchsia-100
  data-[size=default]:px-4 data-[size=default]:py-2 data-[size=default]:text-sm
  data-[size=sm]:px-3 data-[size=sm]:py-1 data-[size=sm]:text-xs
  data-disabled:pointer-events-none
  data-[variant]:data-disabled:bg-gray-100 data-[variant]:data-disabled:text-gray-400
  data-[variant=outline]:data-disabled:border-gray-200
`);

export type ButtonProps<TElement extends ElementType = "button"> = Comp0ButtonProps<TElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * `className` is appended as is. The Button's own styles sit in `@layer components`, so a
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
      className={className ? `${buttonClassName} ${className}` : buttonClassName}
    />
  );
}
